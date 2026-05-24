from __future__ import annotations

from collections import defaultdict

from shared.io_utils import OUTPUT_DIR, ensure_dirs, read_csv, read_json


SEGMENT_LABELS = {"kos": "KOS笔记", "non_kos": "非KOS笔记"}


def main() -> None:
    ensure_dirs()
    spu_summary = read_csv(OUTPUT_DIR / "spu_summary.csv")
    content_summary = read_csv(OUTPUT_DIR / "content_type_summary.csv")
    topic_summary = read_csv(OUTPUT_DIR / "topic_summary.csv")
    formula_library = read_json(OUTPUT_DIR / "formula_library.json")

    spu_by_segment = defaultdict(list)
    for _, row in spu_summary.iterrows():
        if row.get("spu") == "无法判断":
            continue
        label = SEGMENT_LABELS.get(row.get("note_segment", ""), row.get("note_segment", "未分类"))
        spu_by_segment[label].append(f"- **{row['spu']}**：{row['priority']}。{row['recommendation_reason']}")

    content_by_spu = defaultdict(list)
    for _, row in content_summary.iterrows():
        if row.get("spu") == "无法判断":
            continue
        label = SEGMENT_LABELS.get(row.get("note_segment", ""), row.get("note_segment", "未分类"))
        content_by_spu[(label, row["spu"])].append(f"- {row['priority']}：{row['content_type']}。适合原因：{row['recommendation_reason']}")

    formulas = {(f["note_segment"], f["spu"], f["content_type"], f["topic"]): f for f in formula_library.get("formulas", [])}
    topic_by_combo = defaultdict(list)
    for _, row in topic_summary.iterrows():
        if row.get("spu") == "无法判断" or row.get("topic") == "无法判断":
            continue
        label = SEGMENT_LABELS.get(row.get("note_segment", ""), row.get("note_segment", "未分类"))
        formula = formulas.get((row["note_segment"], row["spu"], row["content_type"], row["topic"]), {})
        key_points = "；".join(formula.get("key_points", [])[:2]) or "围绕真实用户问题展开，按工具中的公式生成后再人工微调"
        topic_by_combo[(label, row["spu"], row["content_type"])].append(
            f"- {row['priority']}：{row['topic']}。适合怎么写：{key_points}。适合素材：真实封面、真实服务信息、真实医生/机构资料。"
        )

    spu_sections = []
    for label, lines in spu_by_segment.items():
        spu_sections.append(f"### {label}\n" + "\n".join(lines))

    content_sections = []
    for (label, spu), lines in content_by_spu.items():
        content_sections.append(f"### {label} × {spu}\n" + "\n".join(lines))

    topic_sections = []
    for (label, spu, content_type), lines in topic_by_combo.items():
        topic_sections.append(f"### {label} × {spu} × {content_type}\n" + "\n".join(lines[:8]))

    doc = f"""# 口腔 KOS 内容生文器使用说明

## 1. 工具用途

这个工具基于历史跑量笔记，总结出更适合优先测试的 SPU、内容类型、选题和内容公式，帮助口腔 KOS 账号更快完成选题和小红书笔记初稿。

它适合用于内容生产前的方向选择、案例参考和文案初稿生成。生成内容仍需要结合真实机构、医生、服务和素材进行人工确认。

## 2. 推荐使用流程

第一步：选择入口，先区分 KOS 笔记或非KOS 笔记。

第二步：选择 SPU。

第三步：查看该 SPU 下推荐的内容类型。

第四步：选择推荐选题。

第五步：查看优质案例，参考结构和表达方式。

第六步：进入 AI 生文页，生成标题、正文和封面文案。

第七步：结合真实机构/医生信息、价格、服务内容和账号人设微调后发布。

## 3. KOS / 非KOS 入口说明

KOS 笔记和非KOS 笔记会分开展示推荐方向、公式和案例。选择不同入口后，后续的 SPU、内容类型、选题、案例和生文公式都只来自当前入口，不会混用。

## 4. SPU 优先级

{chr(10).join(spu_sections) if spu_sections else '暂无足够数据展示 SPU 优先级。'}

## 5. 内容类型优先级

{chr(10).join(content_sections) if content_sections else '暂无足够数据展示内容类型优先级。'}

## 6. 选题优先级

{chr(10).join(topic_sections) if topic_sections else '暂无足够数据展示选题优先级。'}

## 7. 优质案例怎么看

案例卡片包含封面、脱敏标题、脱敏正文摘要、内容可复用点、封面可复用点和参考理由。

案例用于参考结构，不建议直接照搬。发布前需要结合自身医生、服务、价格和真实素材调整，不要虚构治疗效果、医生资质或真实案例。

## 8. AI 生文怎么用

必填字段：

- SPU
- 内容类型
- 选题

选填字段：

- 机构 / 医生信息
- 补充要求

如果不填写机构 / 医生信息，生成内容不会出现具体品牌名或医生名。如果填写机构 / 医生信息，系统只会基于你填写的内容使用，不会额外编造。

## 9. 生成后如何修改

- 检查是否符合真实服务内容。
- 检查是否有夸大承诺。
- 检查价格是否真实。
- 检查医生信息是否准确。
- 检查是否适合当前账号人设。
- 封面文案建议控制在手机端一眼能读完。
- 正文建议保留评论或私信引导。

## 10. 发布建议

- 优先从 P0 SPU、P0 内容类型、P0 选题开始。
- 每个选题不要只发一篇，可以连续测试多个标题和封面。
- 图文优先保证封面清晰、标题直接。
- 视频如果没有口播文本，先参考标题和封面公式。
- 发布后观察内容反馈和进线表现，再决定是否复制同类选题。

## 11. 注意事项

- 工具生成内容不是医疗诊断。
- 不要虚构案例。
- 不要虚构价格。
- 不要虚构医生资质。
- 不要承诺治疗效果。
- 涉及具体价格、医生、资质、服务内容时，需要客户自行核实。
- 优质案例只用于结构参考，不代表可以完全照搬。
"""
    (OUTPUT_DIR / "客户使用文档.md").write_text(doc, encoding="utf-8")


if __name__ == "__main__":
    main()
