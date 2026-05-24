from __future__ import annotations

import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen

import pandas as pd

from shared.field_matcher import identify_fields
from shared.io_utils import (
    INTERIM_DIR,
    OUTPUT_DIR,
    RAW_DIR,
    clean_text,
    ensure_dirs,
    normalize_note_id,
    read_first_sheet,
    to_number,
    write_csv,
    write_json,
)


CONTENT_FILE = RAW_DIR / "所有正文.xlsx"
SPEND_FILE = RAW_DIR / "消耗表new_1779592774354809327.xlsx"


def get_col(df: pd.DataFrame, mapping: dict, key: str) -> pd.Series:
    col = mapping.get(key, {}).get("column")
    if col and col in df.columns:
        return df[col]
    return pd.Series([""] * len(df), index=df.index)


def strip_title_from_body(title: str, body: str) -> str:
    body = clean_text(body)
    title = clean_text(title)
    if title and body.startswith(title):
        body = body[len(title) :].lstrip("-—｜|:： \n\t")
    return body


def infer_note_type(title: str, body: str) -> str:
    text = f"{title} {body}"
    if re.search(r"视频|口播|vlog|直播|镜头", text, re.I):
        return "视频"
    return "图文/未知"


def normalize_kos_flag(value: object) -> str:
    text = clean_text(value).lower()
    if text in {"1", "1.0", "是", "yes", "true", "kos", "k"}:
        return "kos"
    if text in {"0", "0.0", "否", "no", "false", "non_kos", "非kos", "非 kos", "n"}:
        return "non_kos"
    return ""


def check_cover_url(url: str) -> tuple[bool, str]:
    url = clean_text(url)
    if not url:
        return False, "封面 URL 缺失"
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        return False, "封面 URL 格式不可识别"
    try:
        req = Request(url, method="HEAD", headers={"User-Agent": "Mozilla/5.0"})
        with urlopen(req, timeout=0.8) as resp:
            status = getattr(resp, "status", 200)
        if status < 400:
            return True, "封面 URL 可访问"
        if status in {403, 405}:
            req = Request(url, method="GET", headers={"User-Agent": "Mozilla/5.0", "Range": "bytes=0-256"})
            with urlopen(req, timeout=1.0) as get_resp:
                get_status = getattr(get_resp, "status", 200)
            if get_status < 400:
                return True, "封面 URL 可访问"
        return False, f"封面 URL 不可访问：HTTP {status}"
    except Exception as exc:
        return False, f"封面 URL 不可访问：{type(exc).__name__}"


def main() -> None:
    ensure_dirs()
    content_raw = read_first_sheet(CONTENT_FILE)
    spend_raw = read_first_sheet(SPEND_FILE)

    content_mapping = identify_fields(content_raw.columns)
    spend_mapping = identify_fields(spend_raw.columns)
    write_json({"content_table": content_mapping, "spend_table": spend_mapping}, INTERIM_DIR / "field_mapping.json")

    content = pd.DataFrame(
        {
            "note_id": get_col(content_raw, content_mapping, "note_id").map(normalize_note_id),
            "title": get_col(content_raw, content_mapping, "title").map(clean_text),
            "raw_body": get_col(content_raw, content_mapping, "body").map(clean_text),
            "note_type": get_col(content_raw, content_mapping, "note_type").map(clean_text),
            "cover_url": get_col(content_raw, content_mapping, "cover_url").map(clean_text),
            "note_url": get_col(content_raw, content_mapping, "note_url").map(clean_text),
            "publish_time": get_col(content_raw, content_mapping, "publish_time").map(clean_text),
            "content_impressions": get_col(content_raw, content_mapping, "impressions").map(to_number),
            "content_clicks": get_col(content_raw, content_mapping, "clicks").map(to_number),
        }
    )
    content["body"] = [strip_title_from_body(t, b) for t, b in zip(content["title"], content["raw_body"])]
    content.loc[content["note_type"].eq(""), "note_type"] = [
        infer_note_type(t, b) for t, b in zip(content.loc[content["note_type"].eq(""), "title"], content.loc[content["note_type"].eq(""), "body"])
    ]
    raw_content_rows = len(content)
    content = content[content["note_id"].ne("")].copy()
    after_content_id_rows = len(content)
    content = content.drop_duplicates("note_id", keep="first").copy()
    after_content_dedupe_rows = len(content)

    spend = pd.DataFrame(
        {
            "note_id": get_col(spend_raw, spend_mapping, "note_id").map(normalize_note_id),
            "bid_spend": get_col(spend_raw, spend_mapping, "bid_spend").map(to_number),
            "spend_ctr": get_col(spend_raw, spend_mapping, "ctr").map(to_number),
            "spend_impressions": get_col(spend_raw, spend_mapping, "impressions").map(to_number),
            "spend_clicks": get_col(spend_raw, spend_mapping, "clicks").map(to_number),
            "note_segment": get_col(spend_raw, spend_mapping, "kos_flag").map(normalize_kos_flag),
        }
    )
    raw_spend_rows = len(spend)
    spend = spend[spend["note_id"].ne("")].copy()
    after_spend_id_rows = len(spend)

    def segment_agg(values: pd.Series) -> str:
        unique = sorted({v for v in values if v in {"kos", "non_kos"}})
        return unique[0] if len(unique) == 1 else ""

    spend_agg = (
        spend.groupby("note_id", dropna=False)
        .agg(
            bid_spend=("bid_spend", "sum"),
            spend_impressions=("spend_impressions", "sum"),
            spend_clicks=("spend_clicks", "sum"),
            spend_ctr=("spend_ctr", "mean"),
            note_segment=("note_segment", segment_agg),
            spend_rows=("note_id", "count"),
        )
        .reset_index()
    )
    for col in ["bid_spend", "spend_impressions", "spend_clicks", "spend_ctr"]:
        spend_agg[col] = spend_agg[col].where(pd.notna(spend_agg[col]), pd.NA)
    write_csv(spend_agg, INTERIM_DIR / "spend_aggregated.csv")

    joined = content.merge(spend_agg, on="note_id", how="left", indicator=True)
    joined["matched_spend"] = joined["_merge"].eq("both")
    joined["has_segment"] = joined["note_segment"].isin(["kos", "non_kos"])
    ignored_unmatched_or_unsegmented = joined[~(joined["matched_spend"] & joined["has_segment"])].copy()
    joined["data_quality_note"] = ""
    joined.loc[~joined["matched_spend"], "data_quality_note"] = "内容表存在，但新消耗表未匹配，按要求忽略"
    joined.loc[joined["matched_spend"] & ~joined["has_segment"], "data_quality_note"] = "新消耗表匹配但 KOS 标记缺失或冲突，按要求忽略"
    joined = joined[joined["matched_spend"] & joined["has_segment"]].copy()

    has_spend_clicks = spend_mapping.get("clicks", {}).get("column") is not None
    has_spend_impressions = spend_mapping.get("impressions", {}).get("column") is not None
    use_content_perf = not (has_spend_clicks and has_spend_impressions)
    if use_content_perf:
        joined["impressions"] = joined["content_impressions"].where(joined["matched_spend"], pd.NA)
        joined["clicks"] = joined["content_clicks"].where(joined["matched_spend"], pd.NA)
    else:
        joined["impressions"] = joined["spend_impressions"].where(joined["matched_spend"], pd.NA)
        joined["clicks"] = joined["spend_clicks"].where(joined["matched_spend"], pd.NA)

    joined["bid_spend"] = joined["bid_spend"].where(joined["matched_spend"], pd.NA)
    recalc_ctr = joined["clicks"] / joined["impressions"]
    joined["ctr"] = recalc_ctr.where((joined["impressions"] > 0) & joined["matched_spend"], joined["spend_ctr"])
    joined["ctr"] = joined["ctr"].where(joined["matched_spend"], pd.NA)

    unique_urls = {clean_text(url) for url in joined["cover_url"] if clean_text(url)}
    url_status: dict[str, tuple[bool, str]] = {}
    cover_cache_path = INTERIM_DIR / "cover_check.csv"
    if cover_cache_path.exists():
        try:
            cached_cover = pd.read_csv(cover_cache_path, dtype=object).fillna("")
            for _, row in cached_cover.iterrows():
                cached_url = clean_text(row.get("cover_url", ""))
                if cached_url:
                    url_status[cached_url] = (str(row.get("cover_available", "")).lower() in {"true", "1", "是"}, clean_text(row.get("cover_parse_note", "")))
        except Exception:
            url_status = {}
    urls_to_check = unique_urls - set(url_status)
    with ThreadPoolExecutor(max_workers=128) as pool:
        future_map = {pool.submit(check_cover_url, url): url for url in urls_to_check}
        for future in as_completed(future_map):
            url = future_map[future]
            try:
                url_status[url] = future.result()
            except Exception as exc:
                url_status[url] = (False, f"封面 URL 不可访问：{type(exc).__name__}")
    cover_checks = []
    for note_id, url in zip(joined["note_id"], joined["cover_url"]):
        url = clean_text(url)
        available, note = url_status.get(url, (False, "封面 URL 缺失"))
        cover_checks.append({"note_id": note_id, "cover_url": url, "cover_available": available, "cover_parse_note": note})
    cover_df = pd.DataFrame(cover_checks)
    write_csv(cover_df, INTERIM_DIR / "cover_check.csv")
    joined = joined.merge(cover_df[["note_id", "cover_available", "cover_parse_note"]], on="note_id", how="left")

    output_cols = [
        "note_id",
        "note_segment",
        "title",
        "body",
        "note_type",
        "cover_url",
        "cover_available",
        "cover_parse_note",
        "note_url",
        "publish_time",
        "bid_spend",
        "impressions",
        "clicks",
        "ctr",
        "data_quality_note",
    ]
    write_csv(joined[output_cols], OUTPUT_DIR / "joined_notes.csv")

    spend_only = set(spend_agg["note_id"]) - set(content["note_id"])
    matched_count = int(joined["matched_spend"].sum())
    ignored_unmatched_count = int((~ignored_unmatched_or_unsegmented["matched_spend"]).sum())
    ignored_unsegmented_count = int((ignored_unmatched_or_unsegmented["matched_spend"] & ~ignored_unmatched_or_unsegmented["has_segment"]).sum())
    kos_count = int(joined["note_segment"].eq("kos").sum())
    non_kos_count = int(joined["note_segment"].eq("non_kos").sum())
    missing_fields = {
        "content_table": [k for k, v in content_mapping.items() if v.get("column") is None],
        "spend_table": [k for k, v in spend_mapping.items() if v.get("column") is None],
    }
    report = f"""# 数据质量报告

## 1. 字段识别结果

### 笔记内容表

```json
{json.dumps(content_mapping, ensure_ascii=False, indent=2)}
```

### 投放表现表

```json
{json.dumps(spend_mapping, ensure_ascii=False, indent=2)}
```

## 2. Join 前后数据量

- 内容表原始行数：{raw_content_rows}
- 内容表去除空笔记 ID 后：{after_content_id_rows}
- 内容表按笔记 ID 去重后：{after_content_dedupe_rows}
- 投放表原始行数：{raw_spend_rows}
- 投放表去除空笔记 ID 后：{after_spend_id_rows}
- 投放表按笔记 ID 聚合后：{len(spend_agg)}
- Join 后进入分析主表行数：{len(joined)}

## 3. Join 匹配情况

- 成功匹配新消耗表且有明确 KOS 标记的笔记数量：{matched_count}
- 其中 KOS 笔记数量：{kos_count}
- 其中非KOS 笔记数量：{non_kos_count}
- 内容表存在但新消耗表未匹配、按要求忽略的笔记数量：{ignored_unmatched_count}
- 新消耗表匹配但 KOS 标记缺失或冲突、按要求忽略的笔记数量：{ignored_unsegmented_count}
- 只存在于投放表现表、已剔除的笔记 ID 数量：{len(spend_only)}

## 4. 关键字段状态

- 竞价运营消耗字段是否存在：{'是' if spend_mapping.get('bid_spend', {}).get('column') else '否'}
- CTR 字段是否存在：{'是' if spend_mapping.get('ctr', {}).get('column') else '否'}
- 是否KOS笔记字段是否存在：{'是' if spend_mapping.get('kos_flag', {}).get('column') else '否'}
- 投放表曝光字段是否存在：{'是' if has_spend_impressions else '否'}
- 投放表点击字段是否存在：{'是' if has_spend_clicks else '否'}
- 曝光/点击输出来源：{'内容表累计曝光/点击，仅在投放表匹配时保留' if use_content_perf else '投放表现表'}

## 5. 封面 URL 可用率

- 有可访问封面 URL 的笔记数：{int(cover_df['cover_available'].sum())}
- 封面 URL 可用率：{round(float(cover_df['cover_available'].mean() * 100), 2) if len(cover_df) else 0}%

## 6. 主要缺失字段说明

```json
{json.dumps(missing_fields, ensure_ascii=False, indent=2)}
```

## 7. 不确定字段说明

- 如果字段识别置信度低于 0.68，脚本不会映射该字段。
- 当前新消耗表未识别到曝光和点击字段，因此 CTR 优先使用内容表累计点击/累计曝光重新计算；没有新消耗表匹配或没有明确 KOS 标记的笔记按要求忽略。
- 封面仅检测 URL 可访问性，不爬取小红书页面，不绕反爬。
"""
    (OUTPUT_DIR / "data_quality_report.md").write_text(report, encoding="utf-8")


if __name__ == "__main__":
    main()
