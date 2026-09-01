# stage-2 reranker: finetuned model if it exists, else pretrained, else skip
import os

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
FINETUNED_PATH = os.path.join(MODELS_DIR, "reranker-finetuned")
PRETRAINED_NAME = "cross-encoder/ms-marco-MiniLM-L-6-v2"

_model = None
_loaded = False


def get_reranker():
    global _model, _loaded
    if _loaded:
        return _model

    try:
        from sentence_transformers import CrossEncoder
    except ImportError:
        _loaded = True
        return None

    _model = CrossEncoder(FINETUNED_PATH if os.path.exists(FINETUNED_PATH) else PRETRAINED_NAME)
    _loaded = True
    return _model


def rerank(query, candidates, top_k=3):
    """candidates: list of dicts with at least a "text" key. Returns the
    top_k candidates re-sorted by cross-encoder relevance, or just the first
    top_k unchanged if no reranker is available."""
    model = get_reranker()
    if model is None or not candidates:
        return candidates[:top_k]

    pairs = [[query, c["text"]] for c in candidates]
    scores = model.predict(pairs)
    ranked = [c for _, c in sorted(zip(scores, candidates), key=lambda x: x[0], reverse=True)]
    return ranked[:top_k]
