import type { Priority } from "../types/content";

const styles: Record<Priority, string> = {
  P0: "bg-[#ff6b35] text-white",
  P1: "bg-clinical-blue text-white",
  P2: "bg-clinical-teal text-white",
  P3: "bg-slate-200 text-slate-700"
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`inline-flex min-w-10 items-center justify-center rounded-full px-2.5 py-1 text-xs font-bold ${styles[priority]}`}>{priority}</span>;
}
