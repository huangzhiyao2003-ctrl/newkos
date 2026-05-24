import { BookOpen, ChevronDown, ExternalLink, ImageOff } from "lucide-react";
import { useState } from "react";
import type { GoodCase } from "../types/content";

export function CaseCard({ item }: { item: GoodCase }) {
  const [expanded, setExpanded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const detailText = item.desensitized_body || item.desensitized_body_summary;
  const canExpand = detailText.length > item.desensitized_body_summary.length + 12;
  const displayText = expanded ? detailText : item.desensitized_body_summary;
  const hasCover = Boolean(item.cover_url) && !imageFailed;

  return (
    <article className="overflow-hidden rounded-lg border border-white bg-white shadow-soft">
      <div className="relative bg-clinical-mist">
        {hasCover ? (
          <img
            src={item.cover_url}
            alt={item.desensitized_title}
            className="aspect-[3/4] w-full bg-clinical-mist object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="grid aspect-[3/4] place-items-center bg-[linear-gradient(135deg,#edf9f8,#f8ffff)] text-center text-sm font-semibold text-slate-500">
            <div>
              <ImageOff className="mx-auto mb-2 text-clinical-teal" size={26} />
              封面暂不可用
            </div>
          </div>
        )}
        <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-clinical-ink shadow-sm backdrop-blur">
          真实案例
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <h3 className="text-lg font-extrabold leading-7 text-clinical-ink">{item.desensitized_title}</h3>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{displayText}</p>
          {canExpand ? (
            <button onClick={() => setExpanded((value) => !value)} className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-clinical-teal">
              {expanded ? "收起" : "展开全文"}
              <ChevronDown size={15} className={expanded ? "rotate-180 transition" : "transition"} />
            </button>
          ) : null}
        </div>

        <PointChips title="内容可复用点" points={item.content_reusable_points} />
        <PointChips title="封面可复用点" points={item.cover_reusable_points} />

        <div className="rounded-lg bg-clinical-mist p-3 text-sm leading-6 text-clinical-ink">
          <div className="mb-1 inline-flex items-center gap-1 font-bold">
            <BookOpen size={15} />
            为什么值得参考
          </div>
          <p>{item.why_reference}</p>
        </div>

        <div className="flex items-center justify-between border-t border-clinical-line pt-3">
          <span className="text-xs font-semibold text-slate-400">笔记 ID：{item.note_id}</span>
          {item.note_url ? (
            <a
              href={item.note_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-clinical-ink px-3 py-2 text-xs font-bold text-white"
            >
              打开原笔记
              <ExternalLink size={13} />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function PointChips({ title, points }: { title: string; points: string[] }) {
  return (
    <div>
      <div className="mb-2 text-xs font-bold text-clinical-teal">{title}</div>
      <div className="flex flex-wrap gap-2">
        {points.map((point) => (
          <span key={point} className="rounded-full border border-clinical-line bg-white px-3 py-1.5 text-xs font-semibold leading-5 text-slate-600">
            {point}
          </span>
        ))}
      </div>
    </div>
  );
}
