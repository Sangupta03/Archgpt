"""
Builds a labeled (query, chunk, label) dataset for the reranker.

No real user click data exists yet, so Gemini acts as the labeler (weak
supervision): it writes questions each chunk would answer (label=1), then the
app's own cosine search finds chunks that LOOK similar but aren't the real
answer (label=0, "hard negatives") -- those are what actually teach the model
to tell relevance apart from topical closeness.

Chunks are split train/val/test before any questions are generated, so one
chunk's queries can't leak across splits.

Run once (or whenever backend/docs/ changes): python -m ml.generate_labels
"""
import json
import os
import random
import re
import time

from chromadb import PersistentClient
from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai.errors import ClientError

load_dotenv()

SEED = 42
QUESTIONS_PER_CHUNK = 2
HARD_NEGATIVES_PER_QUERY = 4  # nearest-by-cosine chunks that aren't the true answer
EASY_NEGATIVES_PER_QUERY = 1  # one chunk from an unrelated doc, for contrast
SPLIT = {"train": 0.7, "val": 0.15, "test": 0.15}

# free-tier gemini-2.5-flash-lite is capped at 20 generate_content calls/day,
# so chunks are batched into one prompt each instead of one call per chunk
CHUNKS_PER_BATCH = 10
MIN_SECONDS_BETWEEN_CALLS = 6.5

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
PROGRESS_PATH = os.path.join(DATA_DIR, "_progress.json")

_last_call_at = 0.0


def _throttled_call(fn, *args, **kwargs):
    """Keeps us under the free-tier rate limit and retries once on a 429
    using the delay the API itself suggests."""
    global _last_call_at
    wait = MIN_SECONDS_BETWEEN_CALLS - (time.time() - _last_call_at)
    if wait > 0:
        time.sleep(wait)
    try:
        result = fn(*args, **kwargs)
    except ClientError as e:
        if e.code != 429:
            raise
        time.sleep(15)
        result = fn(*args, **kwargs)
    _last_call_at = time.time()
    return result

gemini = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
client = PersistentClient(path=os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_db"))
collection = client.get_or_create_collection(
    name="system_design_docs",
    metadata={"hnsw:space": "cosine"},
)


def embed_query(text):
    result = _throttled_call(
        gemini.models.embed_content,
        model="gemini-embedding-001",
        contents=text,
        config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY"),
    )
    return result.embeddings[0].values


def generate_questions_batch(chunk_texts):
    """Asks Gemini to reverse-engineer questions for several chunks in one call.
    Returns a list of question-lists, same order and length as chunk_texts."""
    passages = "\n\n".join(f"Passage {i}:\n\"\"\"{text}\"\"\"" for i, text in enumerate(chunk_texts))
    prompt = f"""For each numbered passage below, write {QUESTIONS_PER_CHUNK} short questions
a student would type into a search box if that exact passage were the answer.

{passages}

Return ONLY a JSON object mapping each passage number (as a string) to its list
of questions, nothing else. Example: {{"0": ["q1", "q2"], "1": ["q1", "q2"]}}"""

    response = _throttled_call(gemini.models.generate_content, model="gemini-2.5-flash", contents=prompt)
    text = re.sub(r"^```json\s*|^```\s*|\s*```$", "", response.text.strip())
    try:
        parsed = json.loads(text)
    except Exception:
        print(f"   [skip] couldn't parse batch response: {text[:80]}")
        return [[] for _ in chunk_texts]

    return [
        [q for q in parsed.get(str(i), []) if isinstance(q, str) and q.strip()][:QUESTIONS_PER_CHUNK]
        for i in range(len(chunk_texts))
    ]


def split_chunks(chunk_ids):
    """Splits by chunk (not by generated query) so no chunk's Qs leak across splits."""
    shuffled = chunk_ids[:]
    random.Random(SEED).shuffle(shuffled)
    n = len(shuffled)
    n_train = int(n * SPLIT["train"])
    n_val = int(n * SPLIT["val"])
    return {
        "train": set(shuffled[:n_train]),
        "val": set(shuffled[n_train:n_train + n_val]),
        "test": set(shuffled[n_train + n_val:]),
    }


def rank_all_chunks(query_embedding):
    """Ranks every chunk (cheap at 78 total) so the true chunk always gets a
    real similarity score, even if it falls outside the top few results."""
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=collection.count(),
        include=["documents", "metadatas", "distances"],
    )
    return [
        {"chunk_id": cid, "text": doc, "source": meta["source"], "similarity": 1 - dist}
        for cid, doc, meta, dist in zip(
            results["ids"][0], results["documents"][0], results["metadatas"][0], results["distances"][0]
        )
    ]


def build_examples_for_question(question, true_chunk_id, true_text, true_source, rng):
    ranked = rank_all_chunks(embed_query(question))
    by_id = {r["chunk_id"]: r for r in ranked}

    examples = [{
        "query": question,
        "chunk_id": true_chunk_id,
        "text": true_text,
        "source": true_source,
        "label": 1,
        "cosine_score": by_id[true_chunk_id]["similarity"],
    }]

    hard_negatives = [r for r in ranked if r["chunk_id"] != true_chunk_id][:HARD_NEGATIVES_PER_QUERY]
    for neg in hard_negatives:
        examples.append({
            "query": question, "chunk_id": neg["chunk_id"], "text": neg["text"],
            "source": neg["source"], "label": 0, "cosine_score": neg["similarity"],
        })

    # easy negative: a chunk from an unrelated doc, so the model also sees clear-cut cases
    candidates = [r for r in ranked if r["source"] != true_source]
    if candidates:
        easy = rng.choice(candidates)
        examples.append({
            "query": question, "chunk_id": easy["chunk_id"], "text": easy["text"],
            "source": easy["source"], "label": 0, "cosine_score": easy["similarity"],
        })

    return examples


def main():
    os.makedirs(DATA_DIR, exist_ok=True)

    all_chunks = collection.get(include=["documents", "metadatas"])
    ids, docs, metas = all_chunks["ids"], all_chunks["documents"], all_chunks["metadatas"]
    by_id = {cid: {"text": doc, "source": meta["source"]} for cid, doc, meta in zip(ids, docs, metas)}
    print(f"Loaded {len(ids)} chunks from ChromaDB")

    split_of = {cid: name for name, id_set in split_chunks(ids).items() for cid in id_set}
    counts = {name: sum(1 for v in split_of.values() if v == name) for name in SPLIT}
    print(f"Split sizes: {counts}")

    # resume support -- a 429 or dropped connection partway through shouldn't
    # mean re-spending API calls on chunks already done
    done = set(json.load(open(PROGRESS_PATH))) if os.path.exists(PROGRESS_PATH) else set()
    if done:
        print(f"Resuming: {len(done)}/{len(ids)} chunks already processed")

    rng = random.Random(SEED)
    files = {name: open(os.path.join(DATA_DIR, f"{name}.jsonl"), "a", encoding="utf-8") for name in SPLIT}
    pending = [cid for cid in ids if cid not in done]

    try:
        for batch_start in range(0, len(pending), CHUNKS_PER_BATCH):
            batch_ids = pending[batch_start:batch_start + CHUNKS_PER_BATCH]
            batch_texts = [by_id[cid]["text"] for cid in batch_ids]
            batch_questions = generate_questions_batch(batch_texts)

            for chunk_id, questions in zip(batch_ids, batch_questions):
                chunk_text, source = by_id[chunk_id]["text"], by_id[chunk_id]["source"]
                split_name = split_of[chunk_id]
                print(f"[{len(done) + 1}/{len(ids)}] {chunk_id} -> {len(questions)} questions ({split_name})")

                for question in questions:
                    for row in build_examples_for_question(question, chunk_id, chunk_text, source, rng):
                        files[split_name].write(json.dumps(row) + "\n")
                files[split_name].flush()

                done.add(chunk_id)
                with open(PROGRESS_PATH, "w") as f:
                    json.dump(sorted(done), f)
    finally:
        for f in files.values():
            f.close()

    print(f"Done: {len(done)}/{len(ids)} chunks processed")


if __name__ == "__main__":
    main()
