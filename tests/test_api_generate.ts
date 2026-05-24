import assert from "node:assert/strict";
import { parseGenerationJson } from "../server/jsonRepair";

const parsed = parseGenerationJson(`\`\`\`json
{"titles":["a","b","c","d","e"],"body":"正文","cover_texts":[{"main_title":"主","subtitle":"副","layout_suggestion":"建议"}],"comment_cta":"评论","private_message_cta":"私信","usage_note":"提醒"}
\`\`\``);
assert.equal(parsed.titles.length, 5);
assert.equal(parsed.cover_texts[0].main_title, "主");
console.log("Node JSON repair test OK");
