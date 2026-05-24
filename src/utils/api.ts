import type { GenerateRequest, GenerateResponse } from "../types/generation";

export async function generateNote(payload: GenerateRequest): Promise<GenerateResponse> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || "生成失败，请稍后重试");
  }
  return data as GenerateResponse;
}
