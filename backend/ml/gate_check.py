"""
Compares a freshly-trained model against whatever's currently committed in
metrics.json. Exits 1 if Precision@3 dropped more than TOLERANCE, which CI
treats as a failed build.

TOLERANCE is nonzero because the test set is small -- one query flipping
rank moves Precision@3 by about 1/n_queries, which is noise here, not signal.

Usage: python -m ml.gate_check --new new_finetuned.json
"""
import argparse
import json
import os
import sys

METRICS_PATH = os.path.join(os.path.dirname(__file__), "metrics.json")
TOLERANCE = 0.03


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--new", required=True, help="path to the new finetuned-mode eval JSON")
    args = parser.parse_args()

    with open(args.new) as f:
        new_metrics = json.load(f)

    if not os.path.exists(METRICS_PATH):
        print("No previous metrics.json committed yet -- passing.")
        sys.exit(0)

    with open(METRICS_PATH) as f:
        previous = json.load(f)
    old_precision = previous.get("finetuned", {}).get("precision_at_3")

    if old_precision is None:
        print("No previous finetuned score recorded -- passing.")
        sys.exit(0)

    new_precision = new_metrics["precision_at_3"]
    drop = old_precision - new_precision
    print(f"previous Precision@3: {old_precision:.3f} | new: {new_precision:.3f} | drop: {drop:.3f}")

    if drop > TOLERANCE:
        print(f"REJECTED: drop of {drop:.3f} exceeds tolerance of {TOLERANCE}")
        sys.exit(1)

    print("PASSED: within tolerance")
    sys.exit(0)


if __name__ == "__main__":
    main()
