# stage-2 reranker: finetuned model if it exists, else pretrained, else skip
import logging
import os

logger = logging.getLogger(__name__)

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
FINETUNED_PATH = os.path.join(MODELS_DIR, "reranker-finetuned")
FINETUNED_WEIGHTS = os.path.join(FINETUNED_PATH, "model.safetensors")
PRETRAINED_NAME = "cross-encoder/ms-marco-MiniLM-L-6-v2"

# a real weight file is tens of MB; a git-lfs pointer (checked out without
# `git lfs pull`, e.g. on hosts that don't fetch LFS objects) is ~130 bytes
MIN_WEIGHTS_SIZE = 1_000_000

_model = None
_loaded = False


def _finetuned_available():
    return os.path.exists(FINETUNED_WEIGHTS) and os.path.getsize(FINETUNED_WEIGHTS) > MIN_WEIGHTS_SIZE


def get_reranker():
    global _model, _loaded
    if _loaded:
        return _model
    _loaded = True

    if os.getenv("DISABLE_RERANKER"):
        return None

    try:
        from sentence_transformers import CrossEncoder
    except ImportError:
        return None

    model_path = FINETUNED_PATH if _finetuned_available() else PRETRAINED_NAME
    try:
        _model = CrossEncoder(model_path)
    except Exception:
        logger.exception(f"reranker failed to load ({model_path}); falling back to cosine-only retrieval")
        _model = None
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
