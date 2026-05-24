import { Copy } from "lucide-react";
import { useState } from "react";
import { copyText } from "../utils/copy";

export function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        await copyText(text);
        setDone(true);
        window.setTimeout(() => setDone(false), 1300);
      }}
      className="inline-flex items-center gap-1 rounded-full bg-clinical-mist px-3 py-1.5 text-xs font-semibold text-clinical-ink"
    >
      <Copy size={14} />
      {done ? "已复制" : "复制"}
    </button>
  );
}
