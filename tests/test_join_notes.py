import sys
import unittest
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))


class JoinNotesTest(unittest.TestCase):
    def test_join_output_row_count_matches_content_unique_ids(self):
        content = pd.read_excel(ROOT / "data/raw/所有正文.xlsx", sheet_name=0, dtype=object)
        spend = pd.read_excel(ROOT / "data/raw/消耗表new_1779592774354809327.xlsx", sheet_name=0, dtype=object)
        joined = pd.read_csv(ROOT / "data/output/joined_notes.csv", dtype=object)
        content_ids = set(content["笔记id"].dropna().astype(str).str.strip())
        spend = spend.assign(_note_id=spend["笔记id"].dropna().astype(str).str.strip())
        expected = spend[spend["_note_id"].isin(content_ids) & spend["是否KOS笔记"].isin([0, 1])]["_note_id"].drop_duplicates().shape[0]
        self.assertEqual(len(joined), expected)
        self.assertEqual(set(joined["note_segment"]), {"kos", "non_kos"})

    def test_unmatched_rows_have_quality_note_when_present(self):
        joined = pd.read_csv(ROOT / "data/output/joined_notes.csv", dtype=object).fillna("")
        unmatched = joined[joined["data_quality_note"].ne("")]
        if not unmatched.empty:
            self.assertTrue(unmatched["data_quality_note"].eq("内容表存在，但投放表现表未匹配").all())
            self.assertTrue(unmatched["bid_spend"].eq("").all())


if __name__ == "__main__":
    unittest.main()
