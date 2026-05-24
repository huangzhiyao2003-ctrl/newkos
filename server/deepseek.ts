import { parseGenerationJson } from "./jsonRepair";
import type { GenerateResponse } from "../src/types/generation";

export async function callDeepSeek(prompt: string): Promise<GenerateResponse> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("缺少 DEEPSEEK_API_KEY，请先在 .env 中配置");
  }
  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "你是严谨的口腔行业小红书内容生成助手，只返回 JSON。" },
        { role: "user", content: prompt }
      ]
    })
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`DeepSeek 请求失败：${response.status} ${body.slice(0, 160)}`);
  }
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("DeepSeek 返回缺少 message.content");
  }
  return parseGenerationJson(content);
}
