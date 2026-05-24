from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

import pandas as pd

from shared.io_utils import OUTPUT_DIR, ensure_dirs, write_json


DOWNLOADS = Path("/Users/huangzhiyao1/Downloads")

CHILD_KEYWORDS = re.compile("儿童|孩子|家长|早矫|早期|乳牙|换牙|替牙|青少年|发育|颌骨|下巴后缩|下颌后缩|小下巴|口呼吸|地包天|龅牙")

SOURCE_SETS = {
    "种植牙": {
        "suffix": "",
        "script_file": None,
        "language_file": "整体分析-语言情绪 (1).xlsx",
    },
    "牙贴面/美学修复": {
        "suffix": " (1)",
        "script_file": "脚本文案.xlsx",
        "language_file": "整体分析-语言情绪 (2).xlsx",
    },
    "正畸": {
        "suffix": " (2)",
        "script_file": "脚本文案 (1).xlsx",
        "language_file": "整体分析-语言情绪 (3).xlsx",
    },
}


def source_name(base: str, suffix: str) -> Path:
    return DOWNLOADS / f"{base}{suffix}.xlsx"


def read_sheet(path: Path, sheet: str, limit: int = 8) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    try:
        df = pd.read_excel(path, sheet_name=sheet).fillna("")
    except Exception:
        return []
    rows: list[dict[str, Any]] = []
    for _, row in df.head(limit).iterrows():
        item = {str(key): clean_value(value) for key, value in row.to_dict().items()}
        rows.append(item)
    return rows


def read_all_sheet(path: Path, sheet: str) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    try:
        df = pd.read_excel(path, sheet_name=sheet).fillna("")
    except Exception:
        return []
    return [{str(key): clean_value(value) for key, value in row.to_dict().items()} for _, row in df.iterrows()]


def clean_value(value: Any) -> Any:
    if isinstance(value, float) and value.is_integer():
        return int(value)
    return value


def filter_child_rows(rows: list[dict[str, Any]], keep_child: bool) -> list[dict[str, Any]]:
    filtered: list[dict[str, Any]] = []
    for row in rows:
        text = " ".join(str(value) for value in row.values())
        matched = bool(CHILD_KEYWORDS.search(text))
        if matched == keep_child:
            filtered.append(row)
    return filtered


def top_names(rows: list[dict[str, Any]], name_key: str, limit: int = 4) -> list[str]:
    names = []
    for row in rows:
        value = str(row.get(name_key, "")).strip()
        if value and value not in names:
            names.append(value)
    return names[:limit]


def build_strategy(spu: str, config: dict[str, Any], child_mode: bool | None = None) -> dict[str, Any]:
    suffix = config["suffix"]
    title_path = source_name("封面图分析-标题特点", suffix)
    visual_path = source_name("封面图分析-图像构成", suffix)
    emboss_path = source_name("封面图分析-压花字", suffix)
    scene_path = source_name("前5秒分析-场景元素分析", suffix)
    first5_path = source_name("前5秒分析-脚本文案", suffix)
    identity_path = source_name("整体分析-人物身份", suffix)
    topic_path = source_name("整体分析-主题类型", suffix)
    language_path = DOWNLOADS / config["language_file"]
    duration_path = source_name("整体分析-时长分布", "")
    script_path = DOWNLOADS / config["script_file"] if config.get("script_file") else None

    title_patterns = read_sheet(title_path, "标题特点", 8)
    cover_scene = read_sheet(visual_path, "场景元素", 6)
    cover_style = read_sheet(visual_path, "风格", 5)
    cover_composition = read_sheet(visual_path, "构图", 4)
    cover_colors = read_sheet(visual_path, "色彩", 6)
    embossed_words = read_sheet(emboss_path, "压花字高频词", 10)
    embossed_lengths = read_sheet(emboss_path, "压花字字数", 6)
    first5_scene = read_sheet(scene_path, "场景元素", 8)
    first5_steps = {
        "step_1": read_sheet(first5_path, "第一步", 6),
        "step_2": read_sheet(first5_path, "第二步", 6),
        "step_3": read_sheet(first5_path, "第三步", 6),
    }
    topic_directions = read_all_sheet(topic_path, "话题方向")
    roles = read_all_sheet(identity_path, "职业身份")
    audiences: list[dict[str, Any]] = []
    selling_points: list[dict[str, Any]] = []
    persuasion: list[dict[str, Any]] = []
    communication: list[dict[str, Any]] = []
    hot_words: list[dict[str, Any]] = []
    if script_path:
        hot_words = read_all_sheet(script_path, "热词")
        selling_points = read_all_sheet(script_path, "卖点呈现")
        persuasion = read_all_sheet(script_path, "说服方式")
        audiences = read_all_sheet(script_path, "提及人群")
        communication = read_all_sheet(script_path, "沟通场景")

    if child_mode is not None:
        topic_directions = filter_child_rows(topic_directions, child_mode)
        roles = filter_child_rows(roles, child_mode) or roles
        hot_words = filter_child_rows(hot_words, child_mode) or hot_words
        selling_points = filter_child_rows(selling_points, child_mode) or selling_points
        persuasion = filter_child_rows(persuasion, child_mode) or persuasion
        audiences = filter_child_rows(audiences, child_mode)
        communication = filter_child_rows(communication, child_mode)

    topic_directions = topic_directions[:8]
    roles = roles[:5]
    hot_words = hot_words[:10]
    selling_points = selling_points[:8]
    persuasion = persuasion[:8]
    audiences = audiences[:8]
    communication = communication[:8]

    guidance = build_guidance(spu, title_patterns, first5_steps, selling_points, persuasion, audiences, communication, child_mode)
    return {
        "spu": spu,
        "source_scope": "从正畸混合分析中剥离出的儿牙/早矫规律" if child_mode is True else "对应品项视频聚合分析",
        "cover_title_patterns": title_patterns,
        "cover_visual": {
            "scene_elements": cover_scene,
            "styles": cover_style,
            "composition": cover_composition,
            "colors": cover_colors,
        },
        "embossed_text": {
            "top_words": embossed_words,
            "length_ranges": embossed_lengths,
        },
        "first_5_seconds": {
            "scene_elements": first5_scene,
            "script_steps": first5_steps,
        },
        "overall_video": {
            "person_count": read_sheet(identity_path, "人物数量", 4),
            "age_ranges": read_sheet(identity_path, "年龄段", 8),
            "roles": roles,
            "duration": {
                "coarse": read_sheet(duration_path, "粗粒度时长分布", 6),
                "fine": read_sheet(duration_path, "细粒度时长分布", 8),
            },
            "language": read_sheet(language_path, "语言类型", 3),
            "emotions": read_sheet(language_path, "情绪", 8),
            "video_format": read_sheet(topic_path, "视频形式", 5),
            "topic_directions": topic_directions,
        },
        "script_copy": {
            "hot_words": hot_words,
            "selling_points": selling_points,
            "persuasion_methods": persuasion,
            "audience_groups": audiences,
            "communication_scenarios": communication,
        },
        "generation_guidance": guidance,
    }


def build_guidance(
    spu: str,
    title_patterns: list[dict[str, Any]],
    first5_steps: dict[str, list[dict[str, Any]]],
    selling_points: list[dict[str, Any]],
    persuasion: list[dict[str, Any]],
    audiences: list[dict[str, Any]],
    communication: list[dict[str, Any]],
    child_mode: bool | None,
) -> list[str]:
    first_steps = []
    for key in ["step_1", "step_2", "step_3"]:
        rows = first5_steps.get(key) or []
        if rows:
            first_steps.append(str(next(iter(rows[0].values()))))
    title_names = top_names(title_patterns, "标题特点", 3)
    selling_names = top_names(selling_points, "卖点呈现", 3)
    persuasion_names = top_names(persuasion, "说服方式", 3)
    audience_names = top_names(audiences, "提及人群", 3)
    communication_names = top_names(communication, "沟通场景", 3)
    guidance = [
        f"封面标题优先参考：{'、'.join(title_names) if title_names else '痛点直击、疑问引导、精准人群'}。",
        f"前5秒脚本可按：{' -> '.join(first_steps) if first_steps else '痛点/健康问题 -> 兴趣刺激 -> 技术或方案细节'}。",
    ]
    if selling_names:
        guidance.append(f"卖点呈现优先参考：{'、'.join(selling_names)}。")
    if persuasion_names:
        guidance.append(f"说服方式优先参考：{'、'.join(persuasion_names)}，但不得编造资质、奖项、真实案例或疗效。")
    if audience_names:
        guidance.append(f"目标人群可优先围绕：{'、'.join(audience_names)}。")
    if communication_names:
        guidance.append(f"沟通场景可优先围绕：{'、'.join(communication_names)}。")
    if child_mode:
        guidance.append("儿牙/早矫内容必须面向家长，用观察点、面诊评估和日常习惯提醒表达；避免写确定发育结论、颜值承诺或恐吓式黄金期。")
    elif spu == "正畸":
        guidance.append("正畸内容排除儿童早矫专属表达，重点写成人/青少年正畸的面型、咬合、方案决策和面诊沟通。")
    return guidance


def main() -> None:
    ensure_dirs()
    strategies = [
        build_strategy("种植牙", SOURCE_SETS["种植牙"]),
        build_strategy("牙贴面/美学修复", SOURCE_SETS["牙贴面/美学修复"]),
        build_strategy("正畸", SOURCE_SETS["正畸"], child_mode=False),
        build_strategy("儿牙/早矫", SOURCE_SETS["正畸"], child_mode=True),
    ]
    data = {
        "source_note": "基于用户提供的视频/封面聚合分析 Excel 生成；非逐条笔记 join。",
        "strategies": strategies,
    }
    write_json(data, OUTPUT_DIR / "video_strategy_library.json")


if __name__ == "__main__":
    main()
