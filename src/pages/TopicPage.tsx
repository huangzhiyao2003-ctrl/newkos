import { BookOpen, Wand2 } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { PriorityBadge } from "../components/PriorityBadge";
import { TrustBadges } from "../components/TrustBadges";
import type { NoteSegment } from "../types/content";
import { getTopics } from "../utils/dataSelectors";

export function TopicPage({
  noteSegment,
  spu,
  contentType,
  onCases,
  onGenerate
}: {
  noteSegment: NoteSegment;
  spu: string;
  contentType: string;
  onCases: (topic: string) => void;
  onGenerate: (topic: string) => void;
}) {
  const items = getTopics(noteSegment, spu, contentType);
  if (!items.length) return <EmptyState text="当前组合暂无可展示的选题。" />;
  return (
    <div className="space-y-3">
      <section className="rounded-lg border border-clinical-line bg-white/85 p-3 shadow-soft">
        <TrustBadges badges={[{ label: "真实案例可参考" }, { label: "历史公式可生文" }, { label: "封面/脚本策略已接入" }]} />
      </section>
      {items.map((item) => (
        <article key={`${item.spu}-${item.content_type}-${item.topic}`} className="rounded-lg border border-white bg-white p-4 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-clinical-ink">{item.topic}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.recommendation_reason}</p>
            </div>
            <PriorityBadge priority={item.priority} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => onCases(item.topic)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-clinical-line bg-white px-3 py-3 text-sm font-bold text-clinical-ink">
              <BookOpen size={16} /> 查看案例
            </button>
            <button onClick={() => onGenerate(item.topic)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-clinical-teal px-3 py-3 text-sm font-bold text-white">
              <Wand2 size={16} /> 生成文案
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
