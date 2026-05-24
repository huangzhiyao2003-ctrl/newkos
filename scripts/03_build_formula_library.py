from __future__ import annotations

import re
from collections import Counter

import pandas as pd

from shared.desensitizer import DEFAULT_BRAND_TERMS, DesensitizationStats, desensitize_with_terms, has_high_risk_text, normalize_placeholders
from shared.io_utils import OUTPUT_DIR, RAW_DIR, clean_text, ensure_dirs, read_csv, read_first_sheet, write_json


def safe_float(value, default=0.0) -> float:
    try:
        if value == "" or pd.isna(value):
            return default
        return float(value)
    except Exception:
        return default


def title_formula(content_type: str) -> str:
    mapping = {
        "价格决策类": "【城市/人群】+【项目】+【价格疑问或价格锚点】+【提醒/避坑】",
        "避坑提醒类": "【强提醒】+【项目】+【常见误区】+【行动建议】",
        "案例效果类": "【人群/症状】+【项目】+【变化结果】+【真实记录感表达】",
        "预约咨询类": "【城市/项目】+【面诊/咨询入口】+【适合人群】+【低门槛行动】",
        "项目科普类": "【项目】+【用户最关心的问题】+【3-5 个判断要点】",
        "人群症状类": "【症状/人群】+【项目】+【是否适合/怎么选】+【提醒】",
    }
    return mapping.get(content_type, "【项目】+【用户问题】+【关键提醒】+【行动引导】")


def body_formula(content_type: str) -> str:
    common_end = "结尾：引导用户评论或私信补充自身情况，获取更具体的建议。"
    mapping = {
        "价格决策类": "开头：直接点出用户最关心的价格差异或费用疑问。中间：拆解影响价格的 3-5 个真实因素，如项目难度、材料、方案、复诊或维护。提醒：不要只看低价，要确认医生、方案和后续服务。"
        + common_end,
        "避坑提醒类": "开头：用明确提醒指出常见误区。中间：列出 3-5 个避坑点，每一点说明为什么会影响选择。提醒：不要虚构负面案例，不做绝对化承诺。"
        + common_end,
        "案例效果类": "开头：说明适用人群或症状变化方向。中间：按问题、方案思路、注意事项拆解，不虚构真实案例和治疗结果。提醒：效果因人而异，需结合面诊。"
        + common_end,
        "预约咨询类": "开头：说明面诊或咨询适合解决什么问题。中间：解释面诊会看哪些信息、用户需要准备什么、如何判断方案。提醒：不承诺价格和效果。"
        + common_end,
        "项目科普类": "开头：提出一个常见疑问。中间：用清单拆解概念、适合人群、流程、注意事项。提醒：避免把科普写成诊断。"
        + common_end,
        "人群症状类": "开头：点出某类人群或症状的困惑。中间：说明可能原因、适合了解的项目、需要面诊确认的点。提醒：不替代医生诊断。"
        + common_end,
    }
    return mapping.get(content_type, "开头：点出用户问题。中间：按原因、选择标准、注意事项拆解。结尾：引导评论或私信。")


def key_points_for(spu: str, content_type: str, notes: pd.DataFrame) -> list[str]:
    points = [f"围绕“{spu}”展开，不跨项目泛化"]
    if content_type == "价格决策类":
        points += ["说明价格差异来自方案、材料、难度和服务差异", "价格只作为参考，避免写成确定报价"]
    elif content_type == "避坑提醒类":
        points += ["提醒用户关注方案、医生沟通和后续维护", "语气要提醒但不要制造恐慌"]
    elif content_type == "案例效果类":
        points += ["强调适合人群和变化方向", "不虚构治疗前后真实案例"]
    elif content_type == "预约咨询类":
        points += ["说明面诊能解决的问题", "引导用户带着自身情况咨询"]
    else:
        points += ["用清单式结构降低理解成本", "每个判断点都要给出解释"]
    return points[:5]


AVOID_POINTS = [
    "不要编造真实案例、用户反馈或治疗效果",
    "不要编造医生资质、机构优势或品牌背书",
    "不要编造具体价格；如需价格，只能使用用户提供或历史文本中已有的表达",
    "不要把内容写成医疗诊断或治疗承诺",
]

CITY_PREFIXES = [
    "北京",
    "上海",
    "广州",
    "深圳",
    "成都",
    "重庆",
    "杭州",
    "南京",
    "武汉",
    "西安",
    "天津",
    "青岛",
    "秦皇岛",
    "苏州",
    "佛山",
    "东莞",
]


def strip_city_prefix(term: str) -> str:
    for city in sorted(CITY_PREFIXES, key=len, reverse=True):
        if term.startswith(city) and len(term) > len(city) + 1:
            return term[len(city) :]
    return term


def build_sensitive_terms(notes: pd.DataFrame) -> tuple[set[str], set[str], set[str]]:
    org_terms: set[str] = set()
    doctor_terms: set[str] = set()
    brand_terms: set[str] = set(DEFAULT_BRAND_TERMS)
    raw_path = RAW_DIR / "所有正文.xlsx"
    if raw_path.exists():
        raw = read_first_sheet(raw_path)
        author_cols = [col for col in raw.columns if "作者" in str(col)]
        for col in author_cols:
            for value in raw[col].dropna().astype(str):
                for token in re.split(r"[｜|/\\-_\s]+", value):
                    token = strip_city_prefix(re.sub(r"(官方预约|官方|预约|助理|医生|口腔|齿科|牙科|医院|门诊|诊所)$", "", token.strip()))
                    if 2 <= len(token) <= 10 and re.search(r"[\u4e00-\u9fa5]", token):
                        if re.search(r"医生|助理|主任|院长", value):
                            doctor_terms.add(token)
                        else:
                            org_terms.add(token)
    promo_patterns = [
        r"([\u4e00-\u9fa5A-Za-z0-9]{2,12})(?:整牙补贴|大放价|最新整牙优惠|时代天使标准版|正畸专属|活动期间)",
        r"(?:上海|北京|广州|深圳|成都|青岛|杭州|南京|武汉|西安)([\u4e00-\u9fa5A-Za-z0-9]{2,10})(?:整牙|正畸|种牙|牙贴面)",
    ]
    for text in (notes["title"].fillna("") + " " + notes["body"].fillna("")).astype(str):
        for pattern in promo_patterns:
            for match in re.finditer(pattern, text):
                term = strip_city_prefix(match.group(1))
                if 2 <= len(term) <= 10:
                    org_terms.add(term)
    noisy = {
        "牙齿",
        "正畸",
        "种植牙",
        "牙贴面",
        "贴面",
        "瓷贴面",
        "牙齿贴面",
        "补牙",
        "洗牙",
        "看牙",
        "整牙",
        "隐形牙套",
        "牙套",
        "美白",
        "修复",
        "矫正",
    }
    return org_terms - noisy, doctor_terms - noisy, brand_terms


def clean_public_text(text: str) -> str:
    result = normalize_placeholders(str(text or ""))
    result = result.replace("\ufeff", " ")
    result = result.replace("年轻【某口腔机构】", "年轻人")
    result = re.sub(r"[\u4e00-\u9fa5]{1,3}医广.{0,80}?号", " ", result)
    result = re.sub(r"#?\s*[^#\n\r]{0,40}\[话题\]#?", " ", result)
    result = re.sub(r"#\s*[^#\n\r]{1,40}", " ", result)
    result = re.sub(r"\s+", " ", result).strip()
    return normalize_placeholders(result)


def summary_text(text: str, limit: int = 150) -> str:
    text = clean_public_text(text)
    return text[:limit] + ("..." if len(text) > limit else "")


def reusable_points(title: str, body: str, content_type: str) -> list[str]:
    points = [f"标题和正文围绕“{content_type}”展开，结构可复用"]
    if len(body) >= 80:
        points.append("正文信息较完整，可参考其问题拆解方式")
    if re.search(r"价格|费用|元|一口价", title + body):
        points.append("包含价格/费用沟通信号，适合做决策型内容参考")
    if re.search(r"预约|咨询|面诊", title + body):
        points.append("包含明确行动引导，可参考其转化路径")
    return points[:4]


def reference_reason(title: str, body: str, content_type: str, topic: str, has_cover: bool) -> str:
    text = f"{title} {body}"
    reasons: list[str] = []
    if re.search(r"价格|费用|多少钱|报价|补贴|一口价|预算|元|w", text, re.I):
        reasons.append("标题或正文有价格/费用钩子，适合承接用户决策前的强需求")
    if re.search(r"避坑|别乱|别踩|别被|注意|后悔|坑", text):
        reasons.append("内容带有避坑提醒，能放大用户停留和收藏动机")
    if re.search(r"面诊|预约|咨询|私信|评论|领取|报名", text):
        reasons.append("正文有明确咨询或互动引导，可参考其转化路径")
    if re.search(r"孩子|儿童|家长|年轻人|宝子|姐妹|缺牙|嘴凸|牙黄|牙缝|龅牙|地包天", text):
        reasons.append("开头能锁定具体人群或症状，用户代入感更强")
    if re.search(r"为什么|怎么|到底|区别|有哪些|如何|吗|\\?", text):
        reasons.append("标题使用疑问结构制造信息缺口，适合提升点击欲望")
    if re.search(r"清单|攻略|一篇|几点|步骤|流程|科普|指南", text):
        reasons.append("正文呈现为清单/攻略结构，方便用户快速理解和复用")
    if has_cover:
        reasons.append("保留了真实封面链接，可结合封面标题和画面做素材参考")

    type_reason = {
        "价格决策类": "与当前价格决策类选题匹配，可参考其费用拆解和疑虑消除方式",
        "避坑提醒类": "与当前避坑提醒类选题匹配，可参考其风险提醒和行动建议",
        "案例效果类": "与当前案例效果类选题匹配，可参考其问题呈现和变化方向表达",
        "预约咨询类": "与当前预约咨询类选题匹配，可参考其面诊问题和咨询引导",
        "项目科普类": "与当前项目科普类选题匹配，可参考其概念解释和判断点拆解",
        "人群症状类": "与当前人群症状类选题匹配，可参考其症状切入和人群判断方式",
    }.get(content_type, f"与“{topic}”选题方向匹配，可参考其标题和正文结构")
    reasons.insert(0, type_reason)
    return "；".join(reasons[:3]) + "。"


def main() -> None:
    ensure_dirs()
    notes = read_csv(OUTPUT_DIR / "labeled_notes.csv")
    joined_notes = read_csv(OUTPUT_DIR / "joined_notes.csv")
    spu_summary = read_csv(OUTPUT_DIR / "spu_summary.csv")
    content_summary = read_csv(OUTPUT_DIR / "content_type_summary.csv")
    topic_summary = read_csv(OUTPUT_DIR / "topic_summary.csv")
    if "note_url" in joined_notes.columns:
        note_url_map = joined_notes.set_index("note_id")["note_url"].fillna("").astype(str).to_dict()
    else:
        note_url_map = {}

    stats = DesensitizationStats()
    org_terms, doctor_terms, brand_terms = build_sensitive_terms(notes)
    notes["desensitized_title"] = notes["title"].map(lambda x: clean_public_text(desensitize_with_terms(str(x), org_terms, doctor_terms, stats, brand_terms)))
    notes["desensitized_body"] = notes["body"].map(lambda x: clean_public_text(desensitize_with_terms(str(x), org_terms, doctor_terms, stats, brand_terms)))

    segment_counts = notes["note_segment"].value_counts().to_dict()
    segment_list = [
        {
            "note_segment": "kos",
            "label": "KOS笔记",
            "note_count": int(segment_counts.get("kos", 0)),
            "description": "基于新消耗表中是否KOS笔记=1 的历史笔记生成",
        },
        {
            "note_segment": "non_kos",
            "label": "非KOS笔记",
            "note_count": int(segment_counts.get("non_kos", 0)),
            "description": "基于新消耗表中是否KOS笔记=0 的历史笔记生成",
        },
    ]
    spu_list = [
        {
            "note_segment": row["note_segment"],
            "spu": row["spu"],
            "priority": row["priority"],
            "recommendation_score": safe_float(row["recommendation_score"]),
            "recommendation_reason": row["recommendation_reason"],
        }
        for _, row in spu_summary.iterrows()
        if row.get("spu") and row["spu"] != "无法判断"
    ]
    content_type_list = [
        {
            "note_segment": row["note_segment"],
            "spu": row["spu"],
            "content_type": row["content_type"],
            "priority": row["priority"],
            "recommendation_score": safe_float(row["recommendation_score"]),
            "recommendation_reason": row["recommendation_reason"],
        }
        for _, row in content_summary.iterrows()
        if row.get("spu") and row["spu"] != "无法判断"
    ]
    topic_list = [
        {
            "note_segment": row["note_segment"],
            "spu": row["spu"],
            "content_type": row["content_type"],
            "topic": row["topic"],
            "priority": row["priority"],
            "recommendation_score": safe_float(row["recommendation_score"]),
            "recommendation_reason": row["recommendation_reason"],
        }
        for _, row in topic_summary.iterrows()
        if row.get("spu") and row["spu"] != "无法判断" and row.get("topic") and row["topic"] != "无法判断"
    ]

    formulas = []
    good_cases = []
    for topic in topic_list:
        group = notes[
            (notes["note_segment"] == topic["note_segment"])
            & (notes["spu"] == topic["spu"])
            & (notes["content_type"] == topic["content_type"])
            & (notes["topic"] == topic["topic"])
        ].copy()
        group["bid_spend_num"] = pd.to_numeric(group["bid_spend"], errors="coerce").fillna(0)
        group["ctr_num"] = pd.to_numeric(group["ctr"], errors="coerce").fillna(0)
        group["case_score"] = group["bid_spend_num"].rank(pct=True) * 0.55 + group["ctr_num"].rank(pct=True) * 0.25 + group["body"].map(lambda x: min(len(str(x)), 300) / 300) * 0.2
        group = group.sort_values("case_score", ascending=False)
        examples = group["desensitized_title"].head(3).dropna().astype(str).tolist()
        stable = len(group) >= 2
        formulas.append(
            {
                "note_segment": topic["note_segment"],
                "spu": topic["spu"],
                "content_type": topic["content_type"],
                "topic": topic["topic"],
                "title_formula": title_formula(topic["content_type"]) if stable else "样本不足，暂不提炼稳定公式",
                "title_examples": examples,
                "body_formula": body_formula(topic["content_type"]) if stable else "样本不足，暂不提炼稳定公式",
                "key_points": key_points_for(topic["spu"], topic["content_type"], group) if stable else [],
                "avoid_points": AVOID_POINTS,
                "cover_formula": "封面信息不足，无法提炼稳定公式；如封面 URL 可用，请人工查看真实画面后复用其标题长度、信息密度和素材类型。",
                "generation_instruction": "只能基于公式、脱敏案例摘要和用户补充信息生成；不得编造品牌、医生、价格、疗效、真实案例、用户反馈或资质。",
            }
        )

        cases = []
        for _, row in group.head(3).iterrows():
            cover_available = str(row.get("cover_available", "")).lower() in {"true", "1", "是"}
            cover_url = clean_text(row.get("cover_url", ""))
            title = row["desensitized_title"]
            body = row["desensitized_body"]
            cases.append(
                {
                    "note_id": row["note_id"],
                    "note_url": note_url_map.get(str(row["note_id"]), ""),
                    "cover_url": cover_url,
                    "desensitized_title": title,
                    "desensitized_body_summary": summary_text(body),
                    "desensitized_body": summary_text(body, 900),
                    "content_reusable_points": reusable_points(title, body, topic["content_type"]),
                    "cover_reusable_points": ["封面链接已保留，可在前端尝试加载真实素材"] if cover_url else ["封面暂不可用，不提炼视觉元素"],
                    "why_reference": reference_reason(title, body, topic["content_type"], topic["topic"], bool(cover_url)),
                }
            )
        good_cases.append({"note_segment": topic["note_segment"], "spu": topic["spu"], "content_type": topic["content_type"], "topic": topic["topic"], "cases": cases})

    formula_library = {
        "segment_list": segment_list,
        "spu_list": spu_list,
        "content_type_list": content_type_list,
        "topic_list": topic_list,
        "formulas": formulas,
    }
    write_json(formula_library, OUTPUT_DIR / "formula_library.json")
    write_json(good_cases, OUTPUT_DIR / "good_cases.json")

    combined = "\n".join(notes["desensitized_title"].tolist() + notes["desensitized_body"].tolist())
    high_risk = has_high_risk_text(combined)
    report = f"""# 脱敏报告

## 1. 自动识别与替换规则

- 品牌 / 机构 / 企业相关表达统一替换为：`【某口腔机构】`
- 医生相关表达统一替换为：`【某医生】`
- 门店 / 院区相关表达统一替换为：`【某门店】`
- 城市和价格表达保留，便于客户后续自行替换。

## 2. 自动脱敏统计

- 疑似品牌 / 机构 / 企业命中次数：{stats.org_count}
- 疑似医生命中次数：{stats.doctor_count}
- 疑似门店 / 院区命中次数：{stats.shop_count}
- 疑似品牌 / 材料品牌命中次数：{stats.brand_count}
- 为避免泄露，报告不列出具体原词，仅保留不可逆哈希数量：{len(stats.hashes)}
- 从作者昵称和高风险营销表达中提取的疑似机构/医生/品牌词数量：{len(org_terms) + len(doctor_terms) + len(brand_terms)}

## 3. 不确定内容处理

- 由于口腔机构、医生名和账号昵称边界可能重叠，脚本采取高敏策略：不确定时优先脱敏。
- 优质案例库只输出脱敏标题和脱敏正文摘要，不输出原始品牌、机构、医生、门店名称。

## 4. 高风险残留检查

- 脱敏后是否仍检测到高风险机构或医生表达：{'是，建议人工复核' if high_risk else '否'}
"""
    (OUTPUT_DIR / "desensitization_report.md").write_text(report, encoding="utf-8")


if __name__ == "__main__":
    main()
