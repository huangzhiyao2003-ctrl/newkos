from __future__ import annotations

from difflib import SequenceMatcher
from typing import Iterable


FIELD_CANDIDATES: dict[str, list[str]] = {
    "note_id": ["笔记id", "笔记 id", "note_id", "noteid", "笔记编号", "内容id", "作品id"],
    "title": ["笔记标题", "标题", "title", "内容标题"],
    "body": ["笔记正文", "正文", "笔记内容", "笔记内容（标题+正文+话题）", "内容", "文案"],
    "cover_url": ["笔记首图链接", "封面图片", "封面图", "封面", "图片url", "首图", "cover"],
    "note_type": ["笔记类型", "类型", "内容类型", "图文视频", "note_type"],
    "note_url": ["笔记链接", "链接", "url", "note_url"],
    "publish_time": ["发布时间", "发布日期", "笔记创建日期", "创建时间", "发布时间"],
    "bid_spend": ["竞价运营消耗", "运营消耗", "广告消耗", "消耗", "竞价消耗", "spend"],
    "ctr": ["竞价广告ctr", "ctr", "点击率", "广告ctr"],
    "impressions": ["曝光", "曝光量", "累计曝光数", "展现", "impressions"],
    "clicks": ["点击", "点击量", "累计点击数", "clicks"],
    "kos_flag": ["是否kos笔记", "是否 kos 笔记", "kos标记", "kos标签", "是否kos", "kos"],
}


def normalize_header(value: str) -> str:
    return (
        str(value)
        .strip()
        .lower()
        .replace(" ", "")
        .replace("_", "")
        .replace("-", "")
        .replace("/", "")
    )


def score_header(header: str, candidate: str) -> float:
    h = normalize_header(header)
    c = normalize_header(candidate)
    if not h or not c:
        return 0
    if h == c:
        return 1.0
    if c in h or h in c:
        return 0.92
    return SequenceMatcher(None, h, c).ratio()


def identify_fields(columns: Iterable[str], required: Iterable[str] | None = None) -> dict[str, dict[str, object]]:
    cols = [str(c) for c in columns]
    keys = list(required) if required else list(FIELD_CANDIDATES)
    result: dict[str, dict[str, object]] = {}
    used: set[str] = set()
    for key in keys:
        best_col = ""
        best_score = 0.0
        best_candidate = ""
        for col in cols:
            if col in used:
                continue
            for cand in FIELD_CANDIDATES.get(key, []):
                score = score_header(col, cand)
                if score > best_score:
                    best_col, best_score, best_candidate = col, score, cand
        if best_score >= 0.68:
            used.add(best_col)
            result[key] = {"column": best_col, "confidence": round(best_score, 3), "matched_by": best_candidate}
        else:
            result[key] = {"column": None, "confidence": 0, "matched_by": None}
    return result
