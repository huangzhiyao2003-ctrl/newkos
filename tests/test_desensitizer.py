import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from shared.desensitizer import DesensitizationStats, desensitize_text


class DesensitizerTest(unittest.TestCase):
    def test_desensitizer_replaces_org_and_doctor(self):
        stats = DesensitizationStats()
        text = desensitize_text("上海某某口腔张三医生提醒：种植牙要面诊", stats)
        self.assertIn("【某口腔机构】", text)
        self.assertIn("【某医生】", text)
        self.assertNotIn("张三", text)


if __name__ == "__main__":
    unittest.main()
