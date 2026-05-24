import type { GenerateResponse } from "../src/types/generation";

const fallback: GenerateResponse = {
  titles: [],
  body: "",
  cover_texts: [],
  video_opening_scripts: [],
  comment_cta: "",
  private_message_cta: "",
  usage_note: ""
};

export function parseGenerationJson(text: string): GenerateResponse {
  const parsed = tryParse(text) ?? tryParse(extractJson(text));
  if (!parsed || typeof parsed !== "object") {
    throw new Error("DeepSeek 返回内容不是标准 JSON");
  }
  return normalize(parsed as Partial<GenerateResponse>);
}

function tryParse(text: string | null): unknown | null {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractJson(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1];
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return null;
}

function normalize(value: Partial<GenerateResponse>): GenerateResponse {
  return {
    titles: Array.isArray(value.titles) ? value.titles.slice(0, 5).map(String) : fallback.titles,
    body: typeof value.body === "string" ? value.body : "",
    cover_texts: Array.isArray(value.cover_texts)
      ? value.cover_texts.slice(0, 3).map((item) => ({
          main_title: String(item?.main_title ?? ""),
          subtitle: String(item?.subtitle ?? ""),
          layout_suggestion: String(item?.layout_suggestion ?? "")
        }))
      : fallback.cover_texts,
    video_opening_scripts: Array.isArray(value.video_opening_scripts) ? value.video_opening_scripts.slice(0, 3).map(String) : fallback.video_opening_scripts,
    comment_cta: typeof value.comment_cta === "string" ? value.comment_cta : "",
    private_message_cta: typeof value.private_message_cta === "string" ? value.private_message_cta : "",
    usage_note: typeof value.usage_note === "string" ? value.usage_note : ""
  };
}
