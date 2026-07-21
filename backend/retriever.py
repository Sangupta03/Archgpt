# retriever.py
from chromadb import PersistentClient
from google import genai
from google.genai import types
import os
from dotenv import load_dotenv

load_dotenv()
gemini = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Load ChromaDB
client = PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection(
    name="system_design_docs",
    metadata={"hnsw:space": "cosine"}
)

def embed_query(query):
    result = gemini.models.embed_content(
        model="gemini-embedding-001",
        contents=query,
        config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY")
    )
    return result.embeddings[0].values

def retrieve(query, top_k=3):
    context, _ = retrieve_with_sources(query, top_k)
    return context

def retrieve_with_sources(query, top_k=3):
    """Returns (context_string, list_of_source_names) so frontend can show citations."""
    if collection.count() == 0:
        return "", []

    query_embedding = embed_query(query)
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k, collection.count()),
        include=["documents", "metadatas"]
    )

    if not results["documents"][0]:
        return "", []

    context_parts = []
    seen_sources = []
    for doc, meta in zip(
        results["documents"][0],
        results["metadatas"][0]
    ):
        name = meta["source"].replace(".txt", "").replace("-", " ").title()
        # don't add source label to the chunk — AI mimics it and adds "[Source: X]" everywhere
        # we track the name separately and show it as UI chips instead
        context_parts.append(doc)
        if name not in seen_sources:
            seen_sources.append(name)

    return "\n\n---\n\n".join(context_parts), seen_sources