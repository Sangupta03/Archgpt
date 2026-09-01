# fine-tunes ms-marco-MiniLM-L-6-v2 on the train split, evals against val.
# starting from the pretrained checkpoint instead of from scratch so it keeps
# general query/passage relevance and just adapts to our doc set's phrasing.
#
# usage: python -m ml.train_reranker
import json
import os

from sentence_transformers import CrossEncoder, InputExample
from sentence_transformers.cross_encoder.evaluation import CEBinaryClassificationEvaluator
from torch.utils.data import DataLoader

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
BASE_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"
EPOCHS = 4
BATCH_SIZE = 16


def load_examples(path):
    examples = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            row = json.loads(line)
            examples.append(InputExample(texts=[row["query"], row["text"]], label=row["label"]))
    return examples


def main():
    train_examples = load_examples(os.path.join(DATA_DIR, "train.jsonl"))
    val_examples = load_examples(os.path.join(DATA_DIR, "val.jsonl"))
    print(f"train: {len(train_examples)} pairs, val: {len(val_examples)} pairs")

    model = CrossEncoder(BASE_MODEL, num_labels=1)
    train_dataloader = DataLoader(train_examples, shuffle=True, batch_size=BATCH_SIZE)
    evaluator = CEBinaryClassificationEvaluator.from_input_examples(val_examples, name="val")

    out_dir = os.path.join(MODELS_DIR, "reranker-finetuned")
    os.makedirs(MODELS_DIR, exist_ok=True)
    model.fit(
        train_dataloader=train_dataloader,
        evaluator=evaluator,
        epochs=EPOCHS,
        warmup_steps=int(0.1 * len(train_dataloader) * EPOCHS),
        output_path=out_dir,
        # save_best_model only saves via an internal hook that needs
        # evaluation_steps > 0 to ever fire -- we don't set that, so save
        # the trained weights ourselves right after fit() returns instead
        save_best_model=False,
    )
    model.save(out_dir)
    print(f"Saved fine-tuned model -> {out_dir}")


if __name__ == "__main__":
    main()
