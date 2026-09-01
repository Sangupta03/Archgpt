"""
Ranks each test query's candidate set (the true chunk + its hard/easy negatives
from generate_labels.py) under one of three rankers and reports Precision@3,
MRR, and NDCG@3.

Usage:
    python -m ml.eval_reranker --mode baseline
    python -m ml.eval_reranker --mode pretrained
    python -m ml.eval_reranker --mode finetuned
"""
import argparse
import json
import math
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
K = 3


def load_queries(path):
    """Regroups the flat jsonl rows back into one candidate set per query."""
    queries = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            row = json.loads(line)
            queries.setdefault(row["query"], []).append(row)
    return list(queries.values())


def precision_at_k(ranked_labels, k=K):
    top_k = ranked_labels[:k]
    return sum(top_k) / len(top_k) if top_k else 0.0


def reciprocal_rank(ranked_labels):
    for i, label in enumerate(ranked_labels, start=1):
        if label == 1:
            return 1.0 / i
    return 0.0


def ndcg_at_k(ranked_labels, k=K):
    dcg = sum(label / math.log2(i + 1) for i, label in enumerate(ranked_labels[:k], start=1))
    ideal = sorted(ranked_labels, reverse=True)
    idcg = sum(label / math.log2(i + 1) for i, label in enumerate(ideal[:k], start=1))
    return dcg / idcg if idcg > 0 else 0.0


def score_baseline(candidates):
    # stage-1 only: the cosine score each candidate already got during generation
    return sorted(candidates, key=lambda c: c["cosine_score"], reverse=True)


def score_with_cross_encoder(candidates, model):
    pairs = [[candidates[0]["query"], c["text"]] for c in candidates]
    scores = model.predict(pairs)
    return [c for _, c in sorted(zip(scores, candidates), key=lambda x: x[0], reverse=True)]


def evaluate(mode, test_path=None):
    test_path = test_path or os.path.join(DATA_DIR, "test.jsonl")
    query_groups = load_queries(test_path)

    model = None
    if mode == "pretrained":
        from sentence_transformers import CrossEncoder
        model = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    elif mode == "finetuned":
        from sentence_transformers import CrossEncoder
        model = CrossEncoder(os.path.join(MODELS_DIR, "reranker-finetuned"))
    elif mode != "baseline":
        raise ValueError(f"unknown mode: {mode}")

    precisions, rrs, ndcgs = [], [], []
    for candidates in query_groups:
        ranked = score_baseline(candidates) if mode == "baseline" else score_with_cross_encoder(candidates, model)
        ranked_labels = [c["label"] for c in ranked]
        precisions.append(precision_at_k(ranked_labels))
        rrs.append(reciprocal_rank(ranked_labels))
        ndcgs.append(ndcg_at_k(ranked_labels))

    n = len(query_groups)
    return {
        "mode": mode,
        "n_queries": n,
        "precision_at_3": sum(precisions) / n,
        "mrr": sum(rrs) / n,
        "ndcg_at_3": sum(ndcgs) / n,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["baseline", "pretrained", "finetuned"], required=True)
    parser.add_argument("--test-path", default=None)
    args = parser.parse_args()

    print(json.dumps(evaluate(args.mode, args.test_path), indent=2))
