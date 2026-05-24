import type { Formula, GoodCase, NoteSegment, VideoStrategy, VideoStrategyRow } from "../src/types/content";

export interface PromptInput {
  note_segment: NoteSegment;
  spu: string;
  content_type: string;
  topic: string;
  organization_info?: string;
  extra_requirements?: string;
  formula: Formula;
  cases: GoodCase[];
  videoStrategy?: VideoStrategy;
}

export function buildPrompt(input: PromptInput): string {
  const segmentLabel = input.note_segment === "kos" ? "口腔 KOS 笔记" : "口腔非KOS参考笔记";
  const caseText = input.cases
    .slice(0, 3)
    .map((item, index) => {
      return `案例${index + 1}\n脱敏标题：${item.desensitized_title}\n脱敏正文摘要：${item.desensitized_body_summary}\n内容可复用点：${item.content_reusable_points.join("；")}`;
    })
    .join("\n\n");
  const videoStrategyText = formatVideoStrategy(input.videoStrategy);

  return `你是口腔行业小红书内容生成助手。

核心约束：
- 你只能基于提供的历史内容公式、优质案例摘要和用户补充信息生成文案。
- 不要编造品牌、医生、价格、治疗效果、真实案例、用户反馈或资质。
- 如果用户没有填写机构/医生信息，不要生成具体机构名或医生名。
- 如果用户填写了机构/医生信息，只能使用用户提供的信息，不要额外编造。
- 生成内容需要适合当前选择的${segmentLabel}和小红书内容场景。
- 标题需要有点击吸引力，但不能夸大承诺。
- 正文需要像真实跑量口腔笔记：开头直接戳痛点，中间用清单拆解选择标准，结尾给评论/私信引导。
- 不要写成百科词条或过度正式的科普文章；表达要短句、直接、有小红书语感。
- 不要使用“真实案例”“真实评价”“前后对比”“效果明显”等暗示真实疗效或真实案例的表达，除非用户明确提供了可核实素材。
- 如果内容类型是案例效果类，但用户没有提供真实案例素材，只能写“变化方向、判断点、面诊看点”，不能写成已发生的真实案例、前后变化或确定改善结果。
- 用户补充要求优先级最高。
- 如果没有提供具体品牌/材料型号，不要自行举例品牌、型号、产地分类、医生年限、医生职称或成功率。
- 不要写“医生资质”“真实评价”“案例数量”“经验多少年”这类无法从用户输入核实的信息。
- 价格类选题要贴近历史跑量笔记：可以使用价格锚点、费用差异、低价避坑、一口价/补贴/报价清单等表达方式，但不要把未经用户提供的数字写成机构真实报价。
- 如果用户没有提供具体价格，优先写成价格变量、价格区间感、费用构成和咨询提问清单；如果历史案例摘要或标题方向里有价格表达，可以参考其“打法”，但不要冒充当前机构真实价格。
- 不要自行生成具体年份、最新版、最新价格表等时效表达；除非用户补充要求中明确提供年份或活动时间。
- 封面文案必须输出 3 组，每组都要短、直接、适合手机端阅读。
- 如果提供了视频/封面策略参考，需要把它用于标题、封面文案和“前5秒脚本参考”；但不要生硬照抄命中词，也不要把其他 SPU 的专属内容套到当前 SPU。
- 儿牙/早矫内容必须面向家长，用观察点、面诊评估、日常习惯和就诊准备表达；不要写确定发育结论、颜值承诺或恐吓式黄金期。

用户输入使用规则：
- 用户填写的“机构 / 医生信息”和“用户补充要求”必须被显性吸收，不允许完全忽略。
- 正文、标题、封面文案或前5秒脚本里，至少要自然融入 2 个用户提供的安全信息点；如果用户输入很少，至少融入 1 个。
- 用户输入优先用于：本地城市/机构名/医生名、医生视角、人设经历、内容语气、服务场景、用户想强调的真实素材。
- 如果用户输入与当前 SPU/选题存在冲突，不要改写成另一个项目；需要围绕当前选题表达，并把用户素材转化为“医生视角、门诊观察、学习经历、服务态度、复杂问题处理意识”等可兼容角度。
- 如果用户输入包含绝对化或高风险表达，例如“技术超强”“最强”“一天完成10台高难度手术”“保证效果”“毕业即专家”，不要原样写成医疗承诺；应弱化为合规表达，例如“持续学习”“门诊节奏高”“复杂问题处理经验需要结合面诊评估”“以下内容需以真实资质和合规审核为准”。
- 不得把用户提供的手术量、门诊节奏或技术描述扩写成“上千例”“大量成功案例”“经验丰富”“效果有效”“一定改善”等没有输入依据的数量、疗效或资历结论。
- “非科班出身”“自学成才”只能作为成长经历/内容人设来表达，不要包装成比专业训练更强的卖点，也不要用“搞定复杂矫正”等夸大口吻。
- 儿童正畸可以写“建议评估、观察点、可能需要干预”，不要写“有效引导生长”“错过就多花钱/多受罪”等确定性或恐吓式表达。
- 不要编造第一人称亲身经历、家庭经历或个人案例，例如“我家孩子/我家娃也这样”“我自己亲测”等，除非用户明确提供。
- 儿童正畸引导可以让用户评论年龄、症状和疑问；不要引导用户在评论区公开发照片让医生判断，涉及照片/片子/面型判断时应引导私信或面诊评估。
- 如果某个用户输入因为不适配当前选题或医疗合规风险没有写进正文，必须在 usage_note 中说明“哪些点已弱化或未使用，以及原因”。
- 生成结果不能只复述历史公式；必须体现用户本次填写的信息，否则视为不合格。

用户选择：
笔记入口：${input.note_segment === "kos" ? "KOS笔记" : "非KOS笔记"}
SPU：${input.spu}
内容类型：${input.content_type}
选题：${input.topic}

历史公式：
标题公式：${input.formula.title_formula}
历史标题方向：${input.formula.title_examples.join("；") || "样本不足"}
正文公式：${input.formula.body_formula}
封面公式：${input.formula.cover_formula}
关键要点：${input.formula.key_points.join("；")}
避免事项：${input.formula.avoid_points.join("；")}
生成约束：${input.formula.generation_instruction}

优质案例摘要：
${caseText || "当前选题暂无足够案例，仅基于公式生成。"}

视频/封面策略参考：
${videoStrategyText || "当前 SPU 暂无额外视频策略，沿用历史内容公式。"}

用户填写的机构 / 医生信息：
${input.organization_info?.trim() || "未填写"}

用户补充要求：
${input.extra_requirements?.trim() || "未填写"}

请严格返回 JSON，不要输出 Markdown，不要输出解释。JSON 格式：
{
  "titles": ["标题1", "标题2", "标题3", "标题4", "标题5"],
  "body": "正文内容",
  "cover_texts": [
    {
      "main_title": "封面主标题",
      "subtitle": "封面副标题",
      "layout_suggestion": "封面排版建议"
    },
    {
      "main_title": "封面主标题",
      "subtitle": "封面副标题",
      "layout_suggestion": "封面排版建议"
    },
    {
      "main_title": "封面主标题",
      "subtitle": "封面副标题",
      "layout_suggestion": "封面排版建议"
    }
  ],
  "video_opening_scripts": [
    "前5秒脚本参考1",
    "前5秒脚本参考2",
    "前5秒脚本参考3"
  ],
  "comment_cta": "评论区引导话术",
  "private_message_cta": "私信引导话术",
  "usage_note": "使用提醒"
}`;
}

function formatVideoStrategy(strategy?: VideoStrategy): string {
  if (!strategy) return "";
  const scriptSteps = strategy.first_5_seconds.script_steps;
  const lines = [
    `适用品项：${strategy.spu}`,
    `来源说明：${strategy.source_scope}`,
    `封面标题特点：${formatRows(strategy.cover_title_patterns, "标题特点")}`,
    `封面画面：元素 ${formatRows(strategy.cover_visual.scene_elements, "场景元素")}；风格 ${formatRows(strategy.cover_visual.styles, "风格")}；构图 ${formatRows(strategy.cover_visual.composition, "构图")}；颜色 ${formatRows(strategy.cover_visual.colors, "色彩")}`,
    `封面压花字：高频词 ${formatRows(strategy.embossed_text.top_words, "压花字内容")}；字数 ${formatRows(strategy.embossed_text.length_ranges, "压花字字数")}`,
    `前5秒场景元素：${formatRows(strategy.first_5_seconds.scene_elements, "场景元素")}`,
    `前5秒脚本路径：第1步 ${formatRows(scriptSteps.step_1, "第一步")}；第2步 ${formatRows(scriptSteps.step_2, "第二步")}；第3步 ${formatRows(scriptSteps.step_3, "第三步")}`,
    `视频形式/情绪：形式 ${formatRows(strategy.overall_video.video_format, "视频形式")}；情绪 ${formatRows(strategy.overall_video.emotions, "情绪词")}`,
    `话题方向：${formatRows(strategy.overall_video.topic_directions, "话题方向")}`,
    `卖点呈现：${formatRows(strategy.script_copy.selling_points, "卖点呈现")}`,
    `说服方式：${formatRows(strategy.script_copy.persuasion_methods, "说服方式")}`,
    `提及人群：${formatRows(strategy.script_copy.audience_groups, "提及人群")}`,
    `沟通场景：${formatRows(strategy.script_copy.communication_scenarios, "沟通场景")}`,
    `生成建议：${strategy.generation_guidance.join("；")}`,
  ];
  return lines.filter((line) => !line.endsWith("：无") && !line.includes("：形式 无；情绪 无")).join("\n");
}

function formatRows(rows: VideoStrategyRow[] | undefined, preferredKey: string): string {
  if (!rows?.length) return "无";
  return rows
    .slice(0, 5)
    .map((row) => {
      const name = row[preferredKey] ?? Object.values(row)[0];
      const count = row["命中次数"] ?? row["占比"] ?? row["命中概率"] ?? "";
      return `${name}${count ? `(${count})` : ""}`;
    })
    .join("、");
}
