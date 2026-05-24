import { ArrowRight, Layers, Sparkles } from "lucide-react";
import { TrustBadges } from "../components/TrustBadges";
import type { NoteSegment } from "../types/content";
import { getSegments } from "../utils/dataSelectors";

const segmentCopy: Record<NoteSegment, { description: string; action: string }> = {
  kos: {
    description: "适合参考达人/KOS风格的内容结构，重点学习真实笔记里的标题、封面和正文表达。",
    action: "进入 KOS 内容库",
  },
  non_kos: {
    description: "适合参考普通账号或机构号的内容表达，用来补充更多选题角度和本地化写法。",
    action: "进入非 KOS 内容库",
  },
};

export function SegmentPage({ onSelect }: { onSelect: (segment: NoteSegment) => void }) {
  const segments = getSegments();
  return (
    <div className="space-y-4">
      <section className="rounded-lg bg-gradient-to-br from-white to-clinical-mist p-5 shadow-soft">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-clinical-teal text-white">
          <Sparkles size={22} />
        </div>
        <h2 className="text-2xl font-extrabold leading-8 text-clinical-ink">口腔 KOS 内容生文器</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">先选择笔记入口，再查看对应的 SPU、内容类型、选题和案例。</p>
        <div className="mt-4">
          <TrustBadges />
        </div>
      </section>
      {segments.map((item) => (
        <button key={item.note_segment} onClick={() => onSelect(item.note_segment)} className="w-full rounded-lg border border-white bg-white p-4 text-left shadow-soft transition active:scale-[0.99]">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-clinical-mist text-clinical-teal">
              <Layers size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-clinical-ink">{item.label}</h3>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{segmentCopy[item.note_segment].description}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-1 text-sm font-bold text-clinical-teal">
            {segmentCopy[item.note_segment].action} <ArrowRight size={16} />
          </div>
        </button>
      ))}
    </div>
  );
}
