import { BadgeCheck, Bot, FileCheck2, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const defaultBadges = [
  { label: "真实历史笔记", icon: FileCheck2 },
  { label: "高跑量公式沉淀", icon: TrendingUp },
  { label: "已脱敏案例", icon: BadgeCheck },
  { label: "DeepSeek 生文", icon: Bot },
];

export function TrustBadges({ badges = defaultBadges }: { badges?: Array<{ label: string; icon?: LucideIcon }> }) {
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => {
        const Icon = badge.icon ?? BadgeCheck;
        return (
          <span key={badge.label} className="inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/80 px-2.5 py-1 text-[11px] font-bold text-clinical-ink shadow-[0_6px_18px_rgba(15,159,154,0.08)] backdrop-blur">
            <Icon size={13} className="text-clinical-teal" />
            {badge.label}
          </span>
        );
      })}
    </div>
  );
}
