import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { callDeepSeek } from "./deepseek";
import { findCases, findFormula, findVideoStrategy } from "./dataLoader";
import { buildPrompt } from "./promptTemplate";
import type { NoteSegment } from "../src/types/content";

dotenv.config();

export const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/generate", async (req, res) => {
  try {
    const { note_segment, spu, content_type, topic, organization_info, extra_requirements } = req.body ?? {};
    if (!note_segment || !["kos", "non_kos"].includes(String(note_segment)) || !spu || !content_type || !topic) {
      res.status(400).json({ error: "笔记入口、SPU、内容类型和选题为必填项" });
      return;
    }
    const segment = String(note_segment) as NoteSegment;
    const formula = findFormula(segment, String(spu), String(content_type), String(topic));
    if (!formula) {
      res.status(404).json({ error: "未找到当前组合的内容公式" });
      return;
    }
    const cases = findCases(segment, String(spu), String(content_type), String(topic))?.cases ?? [];
    const videoStrategy = findVideoStrategy(String(spu));
    const prompt = buildPrompt({
      note_segment: segment,
      spu: String(spu),
      content_type: String(content_type),
      topic: String(topic),
      organization_info: String(organization_info ?? ""),
      extra_requirements: String(extra_requirements ?? ""),
      formula,
      cases,
      videoStrategy
    });
    let result = await callDeepSeek(prompt);
    const validation = validateGeneration(result, String(organization_info ?? ""), String(extra_requirements ?? ""));
    if (!validation.ok) {
      result = await callDeepSeek(`${prompt}

上一次输出不合格，需要重新生成。问题：
${validation.reasons.map((reason) => `- ${reason}`).join("\n")}

请严格修正以上问题，重新返回完整 JSON。不要解释，不要 Markdown。`);
    }
    result = sanitizeUnexpectedYears(result, String(extra_requirements ?? ""));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "生成失败" });
  }
});

const distPath = path.join(process.cwd(), "dist");
if (process.env.SERVE_STATIC !== "false" && fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      next();
      return;
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
}

function validateGeneration(result: unknown, organizationInfo: string, extraRequirements: string): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const text = flattenGeneration(result);
  const riskTerms = [
    "医生资质",
    "成功率",
    "职称",
    "经验多少年",
    "真实评价",
    "案例数量",
    "病例数量",
    "真实记录",
    "前后变化",
    "侧貌变好看",
    "改善鼻基底",
    "上千例",
    "大量成功案例",
    "搞定复杂",
    "有效引导",
    "一定改善",
    "错过可能要多花钱",
    "多受罪",
    "我家娃",
    "我家孩子",
    "亲身经历",
    "发张侧脸照",
    "发张照片"
  ].filter((term) => text.includes(term));
  if (riskTerms.length) {
    reasons.push(`输出中出现未经用户提供的高风险表达：${riskTerms.join("、")}。`);
  }
  const generatedYears: string[] = text.match(/20\d{2}|2[0-9]年/g) ?? [];
  const allowedYears: string[] = extraRequirements.match(/20\d{2}|2[0-9]年/g) ?? [];
  const unexpectedYears = generatedYears.filter((year) => !allowedYears.includes(year));
  if (unexpectedYears.length) {
    reasons.push(`输出中出现用户未提供的具体年份：${[...new Set(unexpectedYears)].join("、")}。`);
  }
  const organizationSignals = extractUserSignals(organizationInfo);
  if (organizationInfo.trim() && organizationSignals.length && !organizationSignals.some((signal) => text.includes(signal))) {
    reasons.push(`用户填写了机构/医生信息，但生成结果没有体现其中任何关键信息：${organizationSignals.slice(0, 6).join("、")}。`);
  }
  const requirementSignals = extractUserSignals(extraRequirements);
  if (extraRequirements.trim() && requirementSignals.length && !requirementSignals.some((signal) => text.includes(signal))) {
    reasons.push(`用户填写了补充要求，但生成结果没有体现其中任何关键信息：${requirementSignals.slice(0, 6).join("、")}。`);
  }
  return { ok: reasons.length === 0, reasons };
}

function extractUserSignals(input: string): string[] {
  const raw = input.trim();
  if (!raw) return [];
  const phrases = raw.match(/[\u4e00-\u9fa5A-Za-z0-9]{2,}/g) ?? [];
  const keywordHints = ["上海", "旺旺", "香港中文大学", "非科班", "自学", "技术", "高难度", "手术", "10台", "复杂", "医生"].filter((word) => raw.includes(word));
  return [...new Set([...keywordHints, ...phrases])]
    .filter((word) => word.length >= 2)
    .filter((word) => !["医生", "机构", "信息", "要求", "内容"].includes(word))
    .slice(0, 12);
}

function sanitizeUnexpectedYears<T>(result: T, extraRequirements: string): T {
  const allowedYears: string[] = extraRequirements.match(/20\d{2}|2[0-9]年/g) ?? [];
  const sanitizeText = (value: string) => {
    const generatedYears: string[] = value.match(/20\d{2}|2[0-9]年/g) ?? [];
    let next = value;
    for (const year of generatedYears) {
      if (!allowedYears.includes(year)) {
        next = next.split(year).join("");
      }
    }
    return next.replace(/\s{2,}/g, " ").replace(/｜\s*｜/g, "｜").trim();
  };
  const walk = (value: unknown): unknown => {
    if (typeof value === "string") return sanitizeText(value);
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, walk(item)]));
    }
    return value;
  };
  return walk(result) as T;
}

function flattenGeneration(result: unknown): string {
  if (!result || typeof result !== "object") return "";
  const data = result as {
    titles?: string[];
    body?: string;
    cover_texts?: Array<{ main_title?: string; subtitle?: string; layout_suggestion?: string }>;
    video_opening_scripts?: string[];
    comment_cta?: string;
    private_message_cta?: string;
    usage_note?: string;
  };
  return [
    ...(data.titles ?? []),
    data.body ?? "",
    ...(data.cover_texts ?? []).flatMap((item) => [item.main_title ?? "", item.subtitle ?? "", item.layout_suggestion ?? ""]),
    ...(data.video_opening_scripts ?? []),
    data.comment_cta ?? "",
    data.private_message_cta ?? "",
    data.usage_note ?? "",
  ].join("\n");
}

const port = Number(process.env.PORT || 8787);
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`API server listening on http://localhost:${port}`);
  });
}
