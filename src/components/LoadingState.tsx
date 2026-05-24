import { Bot, CheckCircle2, ShieldCheck, Sparkles, Wand2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const steps = [
  { text: "正在读取高跑量笔记公式", icon: Sparkles },
  { text: "正在融合真实优质案例结构", icon: CheckCircle2 },
  { text: "正在调用 DeepSeek 生成真实文案", icon: Bot },
  { text: "正在校验品牌、医生、价格和疗效风险", icon: ShieldCheck },
];

export function LoadingState() {
  const [tick, setTick] = useState(0);
  const [progress, setProgress] = useState(18);
  const current = steps[tick % steps.length];
  const Icon = current.icon;
  const shimmerDots = useMemo(() => Array.from({ length: 3 }, (_, index) => index), []);

  useEffect(() => {
    const stepTimer = window.setInterval(() => setTick((value) => value + 1), 1500);
    const progressTimer = window.setInterval(() => {
      setProgress((value) => Math.min(92, value + Math.max(1, Math.round((92 - value) / 7))));
    }, 700);
    return () => {
      window.clearInterval(stepTimer);
      window.clearInterval(progressTimer);
    };
  }, []);

  return (
    <section className="overflow-hidden rounded-lg border border-clinical-line bg-white shadow-soft">
      <div className="relative p-4">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-clinical-teal via-clinical-blue to-clinical-teal opacity-80" />
        <div className="flex items-start gap-3">
          <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-clinical-mist text-clinical-teal">
            <span className="absolute inset-0 rounded-full border border-clinical-teal/30 loading-pulse" />
            <Wand2 size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm font-extrabold text-clinical-ink">
              <Icon size={17} className="text-clinical-teal" />
              {current.text}
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-500">基于历史公式、脱敏案例和你的补充要求生成，完成后会自动展示结果。</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-clinical-mist">
              <div className="h-full rounded-full bg-gradient-to-r from-clinical-teal to-clinical-blue transition-all duration-700" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span>DeepSeek 生成中</span>
              <span>{progress}%</span>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {shimmerDots.map((dot) => (
            <div key={dot} className="h-1.5 rounded-full bg-clinical-mist loading-scan" style={{ animationDelay: `${dot * 0.2}s` }} />
          ))}
        </div>
      </div>
    </section>
  );
}
