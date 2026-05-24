import sys
import unittest
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from shared.scoring import summarize


class ScoringTest(unittest.TestCase):
    def test_summary_scores_are_bounded(self):
        df = pd.read_csv(ROOT / "data/output/labeled_notes.csv")
        summary = summarize(df, ["spu"])
        for col in ["spend_score", "frequency_score", "recommendation_score"]:
            self.assertTrue(summary[col].between(0, 100).all())
        self.assertTrue(set(summary["priority"]).issubset({"P0", "P1", "P2", "P3"}))


if __name__ == "__main__":
    unittest.main()
