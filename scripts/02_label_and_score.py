from __future__ import annotations

import re

import pandas as pd

from shared.io_utils import OUTPUT_DIR, ensure_dirs, read_csv, write_csv
from shared.scoring import summarize


SPU_RULES = [
    ("儿牙/早矫", ["儿牙", "儿童", "孩子", "小朋友", "乳牙", "早矫", "窝沟", "涂氟"]),
    ("种植牙", ["种植牙", "种牙", "种植", "缺牙", "半口", "全口"]),
    ("正畸", ["正畸", "矫正", "牙套", "隐形牙套", "时代天使", "隐适美", "托槽", "嘴凸", "龅牙", "深覆合", "地包天"]),
    ("牙贴面/美学修复", ["贴面", "牙贴面", "美学修复", "全瓷", "牙冠", "瓷贴面", "美白"]),
    ("洗牙/补牙/根管", ["洗牙", "补牙", "根管", "蛀牙", "龋齿", "拔牙", "智齿", "牙周", "牙疼"]),
    ("口腔综合", ["口腔", "牙科", "齿科", "牙医", "看牙", "牙齿"]),
]

CONTENT_TYPE_RULES = [
    ("价格决策类", ["价格", "多少钱", "费用", "收费", "一口价", "特惠", "优惠", "补贴", "报价", "元", "w+"]),
    ("避坑提醒类", ["避坑", "警惕", "千万", "别乱", "不要", "后悔", "注意", "坑", "被骗"]),
    ("案例效果类", ["案例", "变化", "对比", "前后", "效果", "改善", "爆改", "记录"]),
    ("预约咨询类", ["预约", "面诊", "咨询", "报名", "通道", "活动", "名额", "体验"]),
    ("项目科普类", ["科普", "适合", "区别", "怎么选", "流程", "方案", "为什么", "多久", "疼不疼", "材料"]),
    ("人群症状类", ["嘴凸", "龅牙", "深覆合", "缺牙", "牙疼", "牙黄", "牙缝", "孩子", "老人", "上班族"]),
]


def first_matches(text: str, rules: list[tuple[str, list[str]]]) -> tuple[str, list[str]]:
    found: list[tuple[str, list[str]]] = []
    for label, kws in rules:
        hits = [kw for kw in kws if kw.lower() in text.lower()]
        if hits:
            found.append((label, hits))
    if not found:
        return "无法判断", []
    found.sort(key=lambda x: len(x[1]), reverse=True)
    return found[0]


def confidence(hit_count: int, body_len: int) -> str:
    if hit_count >= 2 and body_len >= 40:
        return "high"
    if hit_count >= 1:
        return "medium"
    return "low"


def topic_for(spu: str, content_type: str, text: str) -> tuple[str, str]:
    symptoms = ["嘴凸", "龅牙", "深覆合", "地包天", "缺牙", "牙疼", "牙黄", "牙缝", "蛀牙", "儿童", "老人"]
    symptom = next((s for s in symptoms if s in text), "")
    if content_type == "价格决策类":
        return f"{spu}价格/费用", "标题或正文出现价格、费用、优惠、一口价等真实信息"
    if content_type == "避坑提醒类":
        return f"{spu}避坑提醒", "标题或正文出现避坑、警惕、注意等真实信息"
    if content_type == "案例效果类":
        return f"{spu}案例效果", "标题或正文出现案例、变化、效果、对比等真实信息"
    if content_type == "预约咨询类":
        return f"{spu}面诊预约", "标题或正文出现预约、面诊、咨询、报名等真实信息"
    if symptom:
        return f"{spu}{symptom}人群", f"标题或正文出现“{symptom}”等真实人群/症状信息"
    if content_type == "项目科普类":
        return f"{spu}项目科普", "标题或正文出现适合、流程、方案、怎么选等真实信息"
    return f"{spu}综合选题", "可识别为该 SPU，但具体选题信号较弱"


def main() -> None:
    ensure_dirs()
    df = read_csv(OUTPUT_DIR / "joined_notes.csv")
    rows = []
    for _, row in df.iterrows():
        title = str(row.get("title", ""))
        body = str(row.get("body", ""))
        cover_note = str(row.get("cover_parse_note", ""))
        text = f"{title} {body}"
        spu, spu_hits = first_matches(text, SPU_RULES)
        content_type, ct_hits = first_matches(text, CONTENT_TYPE_RULES)
        if content_type == "无法判断":
            content_type = "项目科普类" if spu != "无法判断" else "无法判断"
        topic, topic_reason = topic_for(spu, content_type, text) if spu != "无法判断" else ("无法判断", "标题、正文和封面 URL 均不足以判断选题")
        rows.append(
            {
                **row.to_dict(),
                "spu": spu,
                "spu_confidence": confidence(len(spu_hits), len(body)),
                "spu_reason": f"命中真实文本关键词：{', '.join(spu_hits)}" if spu_hits else "标题、正文和封面 URL 均不足以判断 SPU",
                "content_type": content_type,
                "content_type_confidence": confidence(len(ct_hits), len(body)),
                "content_type_reason": f"命中真实文本关键词：{', '.join(ct_hits)}" if ct_hits else "具体内容打法信号较弱，按项目信息归入科普/综合类",
                "topic": topic,
                "topic_confidence": "high" if len(ct_hits) >= 2 else ("medium" if len(ct_hits) == 1 or spu != "无法判断" else "low"),
                "topic_reason": topic_reason,
                "cover_analysis_note": cover_note or "未提供封面 URL 状态",
            }
        )
    labeled = pd.DataFrame(rows)
    labeled_cols = [
        "note_id",
        "note_segment",
        "title",
        "body",
        "note_type",
        "cover_url",
        "cover_available",
        "bid_spend",
        "ctr",
        "impressions",
        "clicks",
        "spu",
        "spu_confidence",
        "spu_reason",
        "content_type",
        "content_type_confidence",
        "content_type_reason",
        "topic",
        "topic_confidence",
        "topic_reason",
    ]
    write_csv(labeled[labeled_cols], OUTPUT_DIR / "labeled_notes.csv")

    spu_summary = summarize(labeled, ["note_segment", "spu"])
    content_type_summary = summarize(labeled, ["note_segment", "spu", "content_type"])
    topic_summary = summarize(labeled, ["note_segment", "spu", "content_type", "topic"])
    write_csv(spu_summary, OUTPUT_DIR / "spu_summary.csv")
    write_csv(content_type_summary, OUTPUT_DIR / "content_type_summary.csv")
    write_csv(topic_summary, OUTPUT_DIR / "topic_summary.csv")


if __name__ == "__main__":
    main()
