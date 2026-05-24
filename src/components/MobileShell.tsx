import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export function MobileShell({ title, subtitle, children, onBack }: { title: string; subtitle?: string; children: ReactNode; onBack?: () => void }) {
  return (
    <main className="mx-auto min-h-screen max-w-[480px] bg-[#f5fbfb]">
      <header className="sticky top-0 z-10 border-b border-clinical-line bg-white/90 px-5 pb-4 pt-5 backdrop-blur">
        <div className="flex items-center gap-3">
          {onBack ? (
            <button aria-label="返回" onClick={onBack} className="grid h-10 w-10 place-items-center rounded-full bg-clinical-mist text-clinical-ink">
              <ChevronLeft size={22} />
            </button>
          ) : null}
          <div>
            <h1 className="text-xl font-extrabold tracking-normal text-clinical-ink">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm leading-5 text-slate-500">{subtitle}</p> : null}
          </div>
        </div>
      </header>
      <section className="px-5 py-5">{children}</section>
      <footer className="safe-bottom px-5 pb-6 pt-1 text-center text-[11px] font-semibold tracking-[0.18em] text-slate-400">
        医疗行业-旺旺
      </footer>
    </main>
  );
}
