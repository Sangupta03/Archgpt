# run this ONCE to build your knowledge base
# It reads all .txt files in docs/, splits them into chunks,
# embeds each chunk using Gemini, and stores in ChromaDB

# ingest.py
import os
import chromadb
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
gemini = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection(
    name="system_design_docs",
    metadata={"hnsw:space": "cosine"}
)

def chunk_text(text, chunk_size=500, overlap=50):
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunks.append(" ".join(words[start:end]))
        start += chunk_size - overlap
    return chunks

def embed_text(text):
    result = gemini.models.embed_content(
        model="gemini-embedding-001",
        contents=text,
        config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT")
    )
    return result.embeddings[0].values

def ingest_all_docs():
    docs_path = "./docs"
    total_chunks = 0

    for filename in os.listdir(docs_path):
        if not filename.endswith(".txt"):
            continue

        with open(os.path.join(docs_path, filename), "r", encoding="utf-8") as f:
            text = f.read()

        chunks = chunk_text(text)
        print(f"[doc] {filename}: {len(chunks)} chunks")

        for i, chunk in enumerate(chunks):
            chunk_id = f"{filename}-chunk-{i}"

            existing = collection.get(ids=[chunk_id])
            if existing["ids"]:
                print(f"   [skip] chunk {i} already exists")
                continue

            embedding = embed_text(chunk)
            collection.add(
                documents=[chunk],
                embeddings=[embedding],
                metadatas=[{"source": filename, "chunk": i}],
                ids=[chunk_id]
            )
            print(f"   ok chunk {i} stored")
            total_chunks += 1

    print(f"\n Done! {total_chunks} chunks stored in ChromaDB.")

if __name__ == "__main__":
    ingest_all_docs()