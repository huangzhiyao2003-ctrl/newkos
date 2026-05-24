from __future__ import annotations

from pathlib import Path


SENSITIVE_MARKERS = ["竞价运营消耗", "曝光", "点击", "CTR", "bid_spend", "impressions", "clicks"]


def scan_terms(path: Path, terms: list[str]) -> list[str]:
    if not path.exists():
        return []
    text = path.read_text(encoding="utf-8", errors="ignore")
    return [term for term in terms if term in text]
