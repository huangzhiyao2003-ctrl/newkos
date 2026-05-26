import { ArrowRight, BadgeCheck, Building2, Sparkles, UserRoundCheck } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { PriorityBadge } from "../components/PriorityBadge";
import { TrustBadges } from "../components/TrustBadges";
import type { NoteSegment } from "../types/content";
import { getContentTypes, getGeneratorSpus } from "../utils/dataSelectors";

const referenceLibraries: Array<{ segment: NoteSegment; title: string; description: string; icon: typeof UserRoundCheck }> = [
  {
    segment: "kos",
    title: "KOS笔记",
    description: "参考历史 KOS 高跑量笔记，更适合学习标题、封面、正文结构和爆款表达。",
    icon: UserRoundCheck,
  },
  {
    segment: "non_kos",
    title: "企业号笔记（参考）",
    description: "参考机构号/企业号表达。",
    icon: Building2,
  },
];

const contentTypeDefinitions: Record<string, string> = {
  项目科普类: "解释项目原理、适合人群、流程和常见疑问，帮助用户先建立基础认知。",
  人群症状类: "从用户的牙齿问题、年龄阶段或典型症状切入，让用户快速判断自己是否需要关注。",
  价格决策类: "围绕费用构成、报价差异、预算选择和价格避坑展开，帮助用户做消费决策。",
  案例效果类: "用真实素材或可验证变化讲清改善方向，重点呈现问题、方案思路和参考价值。",
  避坑提醒类: "提醒用户在面诊、报价、材料、医生方案等环节容易忽略的风险点。",
  预约咨询类: "面向想进一步了解或到店面诊的用户，突出咨询入口、面诊问题和行动引导。",
};

export function ContentGeneratorPage({
  selectedSpu,
  selectedSegment,
  onSelectSpu,
  onSelectSegment,
  onSelectContentType,
}: {
  selectedSpu: string;
  selectedSegment: NoteSegment | "";
  onSelectSpu: (spu: string) => void;
  onSelectSegment: (segment: NoteSegment) => void;
  onSelectContentType: (contentType: string) => void;
}) {
  const spus = getGeneratorSpus();
  const contentTypes = selectedSpu && selectedSegment ? getContentTypes(selectedSegment, selectedSpu) : [];

  return (
    <div className="space-y-4">
      <section className="rounded-lg bg-gradient-to-br from-white to-clinical-mist p-5 shadow-soft">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-clinical-teal text-white">
          <Sparkles size={22} />
        </div>
        <h2 className="text-2xl font-extrabold leading-8 text-clinical-ink">先配置，再生成</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">先选择品项和参考库，再进入内容类型、选题、案例和 AI 生文。</p>
        <div className="mt-4">
          <TrustBadges />
        </div>
      </section>

      <section className="rounded-lg border border-white bg-white p-4 shadow-soft">
        <SectionHeader index="1" title="选择品项" />
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {spus.map((item) => {
            const active = selectedSpu === item.spu;
            return (
              <button
                key={item.spu}
                onClick={() => onSelectSpu(item.spu)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-extrabold transition active:scale-[0.98] ${
                  active ? "bg-clinical-teal text-white shadow-[0_8px_18px_rgba(15,159,154,0.2)]" : "border border-clinical-line bg-white text-clinical-ink"
                }`}
              >
                {item.spu}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-white bg-white p-4 shadow-soft">
        <SectionHeader index="2" title="选择参考库" />
        <div className="mt-3 grid gap-3">
          {referenceLibraries.map((item) => {
            const Icon = item.icon;
            const active = selectedSegment === item.segment;
            return (
              <button
                key={item.segment}
                onClick={() => onSelectSegment(item.segment)}
                className={`rounded-lg border p-4 text-left transition active:scale-[0.99] ${
                  active ? "border-clinical-teal bg-clinical-mist shadow-[0_10px_24px_rgba(15,159,154,0.12)]" : "border-clinical-line bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${active ? "bg-white text-clinical-teal" : "bg-clinical-mist text-slate-500"}`}>
                    <Icon size={19} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-base font-extrabold text-clinical-ink">
                      {item.title}
                      {active ? <BadgeCheck size={16} className="text-clinical-teal" /> : null}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-slate-600">{item.description}</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-white bg-white p-4 shadow-soft">
        <SectionHeader index="3" title="选择内容类型" />
        {!selectedSpu ? <EmptyState text="请先选择品项。" /> : null}
        {selectedSpu && !selectedSegment ? <EmptyState text="请选择参考库后查看内容类型。" /> : null}
        {selectedSpu && selectedSegment && !contentTypes.length ? <EmptyState text="当前品项和参考库暂无可展示的内容类型。" /> : null}
        {contentTypes.length ? (
          <div className="mt-3 space-y-3">
            {contentTypes.map((item) => (
              <button
                key={`${item.spu}-${item.content_type}`}
                onClick={() => onSelectContentType(item.content_type)}
                className="w-full rounded-lg border border-clinical-line bg-white p-4 text-left transition active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-clinical-ink">{item.content_type}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {contentTypeDefinitions[item.content_type] ?? "围绕该内容类型沉淀历史笔记结构，用于后续选择选题和生成文案。"}
                    </p>
                  </div>
                  <PriorityBadge priority={item.priority} />
                </div>
                <div className="mt-4 flex items-center justify-end gap-1 text-sm font-bold text-clinical-teal">
                  进入选题 <ArrowRight size={16} />
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function SectionHeader({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-clinical-mist text-xs font-extrabold text-clinical-teal">{index}</span>
      <h3 className="text-lg font-extrabold text-clinical-ink">{title}</h3>
    </div>
  );
}
