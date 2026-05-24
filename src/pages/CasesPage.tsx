import { CaseCard } from "../components/CaseCard";
import { EmptyState } from "../components/EmptyState";
import { TrustBadges } from "../components/TrustBadges";
import type { NoteSegment } from "../types/content";
import { getCases } from "../utils/dataSelectors";

export function CasesPage({ noteSegment, spu, contentType, topic }: { noteSegment: NoteSegment; spu: string; contentType: string; topic: string }) {
  const group = getCases(noteSegment, spu, contentType, topic);
  if (!group || !group.cases.length) return <EmptyState text="当前选题暂无足够优质案例。" />;
  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-clinical-line bg-white/90 p-4 shadow-soft">
        <p className="text-sm font-bold leading-6 text-clinical-ink">案例来自真实历史笔记，已自动脱敏，仅供结构参考。</p>
        <div className="mt-3">
          <TrustBadges badges={[{ label: "真实输入笔记" }, { label: "品牌医生已脱敏" }, { label: "可打开原笔记" }]} />
        </div>
      </section>
      {group.cases.map((item) => (
        <CaseCard key={item.note_id} item={item} />
      ))}
    </div>
  );
}
