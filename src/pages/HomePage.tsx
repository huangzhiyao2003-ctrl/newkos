import { ArrowRight, Sparkles } from "lucide-react";
import { PriorityBadge } from "../components/PriorityBadge";
import { TrustBadges } from "../components/TrustBadges";
import type { NoteSegment } from "../types/content";
import { getSpus } from "../utils/dataSelectors";

export function HomePage({ noteSegment, onSelect }: { noteSegment: NoteSegment; onSelect: (spu: string) => void }) {
  const spus = getSpus(noteSegment);
  return (
    <div className="space-y-4">
      <section className="rounded-lg bg-gradient-to-br from-white to-clinical-mist p-5 shadow-soft">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-clinical-teal text-white">
          <Sparkles size={22} />
        </div>
        <h2 className="text-2xl font-extrabold leading-8 text-clinical-ink">口腔 KOS 内容生文器</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">基于历史跑量笔记，推荐高潜 SPU、内容类型和选题。</p>
        <div className="mt-4">
          <TrustBadges />
        </div>
      </section>
      {spus.map((item) => (
        <button key={item.spu} onClick={() => onSelect(item.spu)} className="w-full rounded-lg border border-white bg-white p-4 text-left shadow-soft transition active:scale-[0.99]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-clinical-ink">{item.spu}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.recommendation_reason}</p>
            </div>
            <PriorityBadge priority={item.priority} />
          </div>
          <div className="mt-4 flex items-center justify-end gap-1 text-sm font-bold text-clinical-teal">
            选择 <ArrowRight size={16} />
          </div>
        </button>
      ))}
    </div>
  );
}
