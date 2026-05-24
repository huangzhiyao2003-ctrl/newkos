from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass, field


ORG_RE = re.compile(r"[\u4e00-\u9fa5A-Za-z0-9]{2,18}(?:口腔|齿科|牙科|牙科医院|口腔医院|门诊部|门诊|诊所|医疗|集团|医院)")
SHOP_RE = re.compile(r"[\u4e00-\u9fa5A-Za-z0-9]{2,18}(?:店|院区|分院|中心)")
DOCTOR_RE = re.compile(r"[\u4e00-\u9fa5]{2,4}(?:医生|主任|院长|博士|牙医|正畸医生|种植医生)")


@dataclass
class DesensitizationStats:
    org_count: int = 0
    doctor_count: int = 0
    shop_count: int = 0
    brand_count: int = 0
    uncertain_count: int = 0
    hashes: set[str] = field(default_factory=set)

    def record(self, label: str, value: str) -> None:
        if not value:
            return
        digest = hashlib.sha256(value.encode("utf-8")).hexdigest()[:10]
        self.hashes.add(f"{label}:{digest}")
        if label == "org":
            self.org_count += 1
        elif label == "doctor":
            self.doctor_count += 1
        elif label == "shop":
            self.shop_count += 1
        elif label == "brand":
            self.brand_count += 1
        else:
            self.uncertain_count += 1


PLACEHOLDERS = {
    "【某口腔机构】": "__ORG_PLACEHOLDER__",
    "【某医生】": "__DOCTOR_PLACEHOLDER__",
    "【某门店】": "__SHOP_PLACEHOLDER__",
    "【某品牌】": "__BRAND_PLACEHOLDER__",
    "【某材料品牌】": "__MATERIAL_BRAND_PLACEHOLDER__",
}

PROTECTED_DENTAL_TERMS = {
    "牙贴面",
    "贴面",
    "瓷贴面",
    "牙齿贴面",
    "牙齿",
    "正畸",
    "矫正",
    "牙套",
    "隐形牙套",
    "种植牙",
    "种牙",
    "补牙",
    "洗牙",
    "根管",
    "儿牙",
    "早矫",
    "美学修复",
    "美学",
    "前牙美学",
    "年轻人",
    "人群",
}

DEFAULT_BRAND_TERMS = {
    "唯刻美",
    "灵犀瓷",
    "爱尔创",
    "时代天使",
    "隐适美",
    "登士柏",
    "emax",
    "Emax",
    "vita",
    "VITA",
    "MBT",
    "诺贝尔",
    "士卓曼",
    "ITI",
    "奥齿泰",
    "登腾",
    "安卓健",
    "皓圣",
    "百康",
    "爱马仕",
}


def normalize_placeholders(text: str) -> str:
    result = str(text or "")
    replacements = {
        "【【某口腔机构】】": "【某口腔机构】",
        "【【某医生】】": "【某医生】",
        "【【某品牌】】": "【某品牌】",
        "【某【某口腔机构】机构】": "【某口腔机构】",
        "【某口腔机构】机构】": "【某口腔机构】",
        "某【某口腔机构】机构": "【某口腔机构】",
        "【某【某医生】】": "【某医生】",
        "【某医生】医生】": "【某医生】",
        "某【某医生】": "【某医生】",
        "【某【某品牌】】": "【某品牌】",
        "【某品牌】品牌】": "【某品牌】",
    }
    for old, new in replacements.items():
        result = result.replace(old, new)
    result = re.sub(r"【[^】]{0,12}【某口腔机构】】", "【某口腔机构】", result)
    result = re.sub(r"【[^】]{0,8}【某医生】】", "【某医生】", result)
    result = re.sub(r"【某\s*【某口腔机构】\s*机构】", "【某口腔机构】", result)
    result = re.sub(r"【某\s*【某医生】\s*】", "【某医生】", result)
    result = re.sub(r"【{2,}\s*(某口腔机构|某医生|某品牌|某材料品牌)\s*】{2,}", r"【\1】", result)
    return result


def protect_placeholders(text: str) -> str:
    result = normalize_placeholders(text)
    for placeholder, marker in PLACEHOLDERS.items():
        result = result.replace(placeholder, marker)
    return result


def restore_placeholders(text: str) -> str:
    result = text
    for placeholder, marker in PLACEHOLDERS.items():
        result = result.replace(marker, placeholder)
    return normalize_placeholders(result)


def is_protected_term(term: str) -> bool:
    clean = str(term or "").strip()
    return not clean or clean in PROTECTED_DENTAL_TERMS


def replace_terms(text: str, terms: set[str], replacement: str, label: str, stats: DesensitizationStats | None = None) -> str:
    result = protect_placeholders(text)
    for term in sorted(terms, key=len, reverse=True):
        if is_protected_term(term):
            continue
        if term and term in result:
            if stats:
                stats.record(label, term)
            result = result.replace(term, replacement)
    return restore_placeholders(result)


def desensitize_text(text: str, stats: DesensitizationStats | None = None) -> str:
    if not text:
        return ""
    result = protect_placeholders(str(text))

    def repl_org(match: re.Match[str]) -> str:
        if stats:
            stats.record("org", match.group(0))
        return "【某口腔机构】"

    def repl_doc(match: re.Match[str]) -> str:
        if stats:
            stats.record("doctor", match.group(0))
        return "【某医生】"

    def repl_shop(match: re.Match[str]) -> str:
        if stats:
            stats.record("shop", match.group(0))
        return "【某门店】"

    result = ORG_RE.sub(repl_org, result)
    result = DOCTOR_RE.sub(repl_doc, result)
    result = SHOP_RE.sub(repl_shop, result)
    return restore_placeholders(result)


def desensitize_with_terms(
    text: str,
    org_terms: set[str],
    doctor_terms: set[str],
    stats: DesensitizationStats | None = None,
    brand_terms: set[str] | None = None,
) -> str:
    result = str(text or "")
    result = replace_terms(result, brand_terms or DEFAULT_BRAND_TERMS, "【某品牌】", "brand", stats)
    result = replace_terms(result, doctor_terms, "【某医生】", "doctor", stats)
    result = replace_terms(result, org_terms, "【某口腔机构】", "org", stats)
    return desensitize_text(result, stats)


def has_high_risk_text(text: str) -> bool:
    if not text:
        return False
    clean = protect_placeholders(text)
    return bool(ORG_RE.search(clean) or DOCTOR_RE.search(clean))
