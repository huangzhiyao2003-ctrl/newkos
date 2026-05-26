import { ArrowRight, CheckCircle2, Compass, FileText, Lightbulb, ShieldAlert, Sparkles, UsersRound } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { TrustBadges } from "../components/TrustBadges";
import type { StartupPlanningItem, StartupSpuId, StartupStageId, StartupTeamSize } from "../types/content";
import { getStartupSpu, getStartupSpus } from "../utils/dataSelectors";

const stageLabels: Record<StartupStageId, string> = {
  cold: "冷启动期",
  verify: "验证期",
  scale: "放量期",
};

const teamLabels: Record<StartupTeamSize, string> = {
  "2": "2人",
  "3": "3人",
  "4": "4人",
  "5": "5人+",
};

export function StartupPlanPage({
  onUsePlan,
  onSkip,
}: {
  onUsePlan: (spu: string) => void;
  onSkip: () => void;
}) {
  const spus = getStartupSpus();
  const [selectedSpuId, setSelectedSpuId] = useState<StartupSpuId>(spus[0]?.id ?? "orthodontics");
  const [teamSize, setTeamSize] = useState<StartupTeamSize>("2");
  const [stageId, setStageId] = useState<StartupStageId>("cold");
  const plan = useMemo(() => getStartupSpu(selectedSpuId), [selectedSpuId]);
  const team = plan.team_plans[teamSize];
  const stage = plan.stages[stageId];

  return (
    <div className="space-y-4">
      <section className="rounded-lg bg-gradient-to-br from-white to-clinical-mist p-5 shadow-soft">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-clinical-teal text-white">
          <Compass size={23} />
        </div>
        <h2 className="text-2xl font-extrabold leading-8 text-clinical-ink">口腔 KOS 起号助手</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">先看起号策略，再进入内容生文。</p>
        <p className="mt-2 rounded-lg bg-white/75 px-3 py-2 text-xs font-semibold leading-5 text-slate-600">
          规划用于确定起号方向，后续生文会继续匹配真实历史笔记公式。
        </p>
        <div className="mt-4">
          <TrustBadges badges={[{ label: "起号路径" }, { label: "账号矩阵" }, { label: "阶段打法" }, { label: "真实内容承接" }]} />
        </div>
      </section>

      <SegmentedControl
        label="选择品项"
        items={spus.map((item) => ({ key: item.id, label: item.label }))}
        value={selectedSpuId}
        onChange={(next) => setSelectedSpuId(next as StartupSpuId)}
      />

      <OverviewCard plan={plan} />

      <section className="rounded-lg border border-white bg-white p-4 shadow-soft">
        <SectionTitle icon={<UsersRound size={18} />} title="账号搭建建议" />
        <InlineSwitch
          items={(Object.keys(teamLabels) as StartupTeamSize[]).map((key) => ({ key, label: teamLabels[key] }))}
          value={teamSize}
          onChange={(next) => setTeamSize(next as StartupTeamSize)}
        />
        <div className="mt-4 rounded-lg bg-clinical-mist p-3">
          <p className="text-xs font-bold text-slate-500">推荐</p>
          <p className="mt-1 text-lg font-extrabold text-clinical-ink">{team.count}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {team.combo.map((item) => (
              <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-clinical-teal">
                {item}
              </span>
            ))}
          </div>
        </div>
        <ListBlock items={team.duties} />
        <MiniPanel title="搭建提醒" items={team.tips} />
      </section>

      <section className="rounded-lg border border-white bg-white p-4 shadow-soft">
        <SectionTitle icon={<FileText size={18} />} title="阶段打法" />
        <InlineSwitch
          items={(Object.keys(stageLabels) as StartupStageId[]).map((key) => ({ key, label: stageLabels[key] }))}
          value={stageId}
          onChange={(next) => setStageId(next as StartupStageId)}
        />
        <div className="mt-4 grid gap-2">
          <StageFact label="阶段目标" value={stage.goal} />
          <StageFact label="推荐时长" value={stage.duration} />
          <StageFact label="每周建议" value={stage.weekly} />
          <StageFact label="主打内容" value={stage.main.join("、")} />
          <StageFact label="补充内容" value={stage.secondary.join("、")} />
          <StageFact label="暂不主打" value={stage.avoid.join("、")} />
          <StageFact label="推荐角色" value={stage.roles.join("、")} />
        </div>
        <MiniPanel title="阶段达标参考" items={stage.benchmark} />
        <MiniPanel title="切换信号" items={stage.signals} />
        <MiniPanel title="风险提醒" items={stage.risks} tone="warning" />
      </section>

      <section className="sticky bottom-0 -mx-5 border-t border-clinical-line bg-[#f5fbfb]/95 px-5 py-4 backdrop-blur">
        <button
          onClick={() => onUsePlan(plan.spu)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-clinical-teal px-4 py-3 text-base font-extrabold text-white shadow-[0_12px_30px_rgba(15,159,154,0.2)] transition active:scale-[0.99]"
        >
          按这个品项进入生文流程 <ArrowRight size={18} />
        </button>
        <button
          onClick={onSkip}
          className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-clinical-line bg-white px-4 py-3 text-sm font-bold text-clinical-ink transition active:scale-[0.99]"
        >
          跳过规划，直接进入内容生文器
        </button>
      </section>
    </div>
  );
}

function OverviewCard({ plan }: { plan: StartupPlanningItem }) {
  return (
    <section className="rounded-lg border border-white bg-white p-4 shadow-soft">
      <SectionTitle icon={<Sparkles size={18} />} title={`${plan.label}｜起号规划`} />
      <p className="text-sm font-bold leading-6 text-clinical-ink">{plan.tagline}</p>
      {plan.tagline.includes("A+B") ? (
        <p className="mt-2 rounded-lg bg-clinical-mist px-3 py-2 text-xs font-bold leading-5 text-clinical-teal">
          A = 症状科普，B = 预约承接。
        </p>
      ) : null}
      <p className="mt-2 text-sm leading-6 text-slate-600">{plan.one_liner}</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Metric label="冷启动" value={plan.durations.cold} />
        <Metric label="验证期" value={plan.durations.verify} />
        <Metric label="放量期" value={plan.durations.scale} />
      </div>
      <ListBlock items={plan.tips} />
    </section>
  );
}

function SegmentedControl({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: Array<{ key: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <section className="rounded-lg border border-clinical-line bg-white/85 p-3 shadow-soft">
      <p className="mb-3 text-xs font-extrabold text-slate-500">{label}</p>
      <InlineSwitch items={items} value={value} onChange={onChange} />
    </section>
  );
}

function InlineSwitch({
  items,
  value,
  onChange,
}: {
  items: Array<{ key: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => {
        const active = value === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-extrabold transition active:scale-[0.98] ${
              active
                ? "bg-clinical-teal text-white shadow-[0_8px_18px_rgba(15,159,154,0.2)]"
                : "border border-clinical-line bg-white text-clinical-ink"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-clinical-mist text-clinical-teal">{icon}</span>
      <h3 className="text-lg font-extrabold text-clinical-ink">{title}</h3>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-clinical-mist p-3">
      <div className="text-[11px] font-bold text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-extrabold leading-5 text-clinical-ink">{value}</div>
    </div>
  );
}

function ListBlock({ items }: { items: string[] }) {
  return (
    <div className="mt-4 space-y-2">
      {items.map((item) => (
        <div key={item} className="flex items-start gap-2 rounded-lg border border-clinical-line bg-white px-3 py-3 text-sm leading-6 text-slate-600">
          <CheckCircle2 size={16} className="mt-1 shrink-0 text-clinical-teal" />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

function StageFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-clinical-mist p-3">
      <p className="text-xs font-extrabold text-clinical-teal">{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function MiniPanel({ title, items, tone = "normal" }: { title: string; items: string[]; tone?: "normal" | "warning" }) {
  if (!items.length) return null;
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-clinical-ink">
        {tone === "warning" ? <ShieldAlert size={16} className="text-orange-500" /> : <Lightbulb size={16} className="text-clinical-teal" />}
        {title}
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className={`rounded-lg px-3 py-3 text-sm leading-6 ${tone === "warning" ? "bg-orange-50 text-orange-900" : "bg-clinical-mist text-slate-700"}`}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
