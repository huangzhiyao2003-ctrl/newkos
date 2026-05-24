from __future__ import annotations

import pandas as pd


def _num(series: pd.Series) -> pd.Series:
    return pd.to_numeric(series, errors="coerce")


def priority(score: float | int | None, note_count: int) -> str:
    if score is None or pd.isna(score) or note_count <= 1:
        return "P3"
    if score >= 75:
        return "P0"
    if score >= 55:
        return "P1"
    if score >= 35:
        return "P2"
    return "P3"


def summarize(df: pd.DataFrame, group_cols: list[str]) -> pd.DataFrame:
    work = df.copy()
    work["bid_spend_num"] = _num(work.get("bid_spend", pd.Series(dtype=float))).fillna(0)
    work["ctr_num"] = _num(work.get("ctr", pd.Series(dtype=float)))
    grouped = (
        work.groupby(group_cols, dropna=False)
        .agg(
            note_count=("note_id", "count"),
            total_bid_spend=("bid_spend_num", "sum"),
            avg_ctr=("ctr_num", "mean"),
        )
        .reset_index()
    )
    norm_col = "note_segment" if "note_segment" in group_cols else None
    if norm_col:
        max_spend = grouped.groupby(norm_col)["total_bid_spend"].transform("max")
        max_ctr = grouped.groupby(norm_col)["avg_ctr"].transform("max")
        max_count = grouped.groupby(norm_col)["note_count"].transform("max")
        grouped["spend_score"] = [
            round((value / max_value * 100), 2) if max_value else 0
            for value, max_value in zip(grouped["total_bid_spend"], max_spend)
        ]
        grouped["ctr_score"] = [
            round((value / max_value * 100), 2) if max_value and pd.notna(value) else pd.NA
            for value, max_value in zip(grouped["avg_ctr"], max_ctr)
        ]
        grouped["frequency_score"] = [
            round((value / max_value * 100), 2) if max_value else 0
            for value, max_value in zip(grouped["note_count"], max_count)
        ]
    else:
        max_spend = float(grouped["total_bid_spend"].max() or 0)
        max_ctr = float(grouped["avg_ctr"].max() or 0) if grouped["avg_ctr"].notna().any() else 0
        max_count = int(grouped["note_count"].max() or 0)
        grouped["spend_score"] = grouped["total_bid_spend"].apply(lambda x: round((x / max_spend * 100), 2) if max_spend else 0)
        grouped["ctr_score"] = grouped["avg_ctr"].apply(lambda x: round((x / max_ctr * 100), 2) if max_ctr and pd.notna(x) else pd.NA)
        grouped["frequency_score"] = grouped["note_count"].apply(lambda x: round((x / max_count * 100), 2) if max_count else 0)

    scores = []
    for _, row in grouped.iterrows():
        if pd.isna(row["ctr_score"]):
            score = row["spend_score"] * 0.8 + row["frequency_score"] * 0.2
        else:
            score = row["spend_score"] * 0.6 + row["ctr_score"] * 0.25 + row["frequency_score"] * 0.15
        scores.append(round(float(score), 2))
    grouped["recommendation_score"] = scores
    grouped["priority"] = [priority(s, int(n)) for s, n in zip(grouped["recommendation_score"], grouped["note_count"])]
    grouped["recommendation_reason"] = grouped.apply(_reason, axis=1)
    return grouped.sort_values(["priority", "recommendation_score", "note_count"], ascending=[True, False, False])


def _reason(row: pd.Series) -> str:
    parts = []
    if row["total_bid_spend"] > 0:
        parts.append("历史跑量能力相对较强")
    if pd.notna(row["avg_ctr"]):
        parts.append("历史内容反馈有可用记录")
    if row["note_count"] >= 3:
        parts.append("样本出现频次较高")
    if not parts:
        parts.append("样本或表现数据有限")
    return "，".join(parts) + "，建议结合真实素材继续测试。"
