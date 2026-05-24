import { ArrowRight } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { PriorityBadge } from "../components/PriorityBadge";
import { TrustBadges } from "../components/TrustBadges";
import type { NoteSegment } from "../types/content";
import { getContentTypes } from "../utils/dataSelectors";

const contentTypeDefinitions: Record<string, string> = {
  项目科普类: "解释项目原理、适合人群、流程和常见疑问，帮助用户先建立基础认知。",
  人群症状类: "从用户的牙齿问题、年龄阶段或典型症状切入，让用户快速判断自己是否需要关注。",
  价格决策类: "围绕费用构成、报价差异、预算选择和价格避坑展开，帮助用户做消费决策。",
  案例效果类: "用真实素材或可验证变化讲清改善方向，重点呈现问题、方案思路和参考价值。",
  避坑提醒类: "提醒用户在面诊、报价、材料、医生方案等环节容易忽略的风险点。",
  预约咨询类: "面向想进一步了解或到店面诊的用户，突出咨询入口、面诊问题和行动引导。",
};

export function ContentTypePage({ noteSegment, spu, onSelect }: { noteSegment: NoteSegment; spu: string; onSelect: (contentType: string) => void }) {
  const items = getContentTypes(noteSegment, spu);
  if (!items.length) return <EmptyState text="当前 SPU 暂无可展示的内容类型。" />;
  return (
    <div className="space-y-3">
      <section className="rounded-lg border border-clinical-line bg-white/85 p-3 shadow-soft">
        <TrustBadges badges={[{ label: "已匹配 SPU 公式" }, { label: "基于脱敏案例" }, { label: "不展示投放数据" }]} />
      </section>
      {items.map((item) => (
        <button key={`${item.spu}-${item.content_type}`} onClick={() => onSelect(item.content_type)} className="w-full rounded-lg border border-white bg-white p-4 text-left shadow-soft transition active:scale-[0.99]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-clinical-ink">{item.content_type}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{contentTypeDefinitions[item.content_type] ?? "围绕该内容类型沉淀历史笔记结构，用于后续选择选题和生成文案。"}</p>
            </div>
            <PriorityBadge priority={item.priority} />
          </div>
          <div className="mt-4 flex items-center justify-end gap-1 text-sm font-bold text-clinical-teal">
            进入选题 <ArrowRight size={16} />
          </div>
        </button>
      ))}
    </div>
  );
}
