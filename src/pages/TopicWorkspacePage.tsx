import { BookOpen, Wand2 } from "lucide-react";
import type { ReactNode } from "react";
import { CasesPage } from "./CasesPage";
import { GeneratePage } from "./GeneratePage";
import type { NoteSegment } from "../types/content";

export function TopicWorkspacePage({
  noteSegment,
  spu,
  contentType,
  topic,
  mode,
  onModeChange,
}: {
  noteSegment: NoteSegment;
  spu: string;
  contentType: string;
  topic: string;
  mode: "cases" | "generate";
  onModeChange: (mode: "cases" | "generate") => void;
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-white bg-white p-4 shadow-soft">
        <p className="text-xs font-extrabold text-clinical-teal">当前选题</p>
        <h2 className="mt-1 text-xl font-extrabold leading-7 text-clinical-ink">{topic}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {spu} / {noteSegment === "kos" ? "KOS笔记" : "企业号笔记（参考）"} / {contentType}
        </p>
        <div className="mt-4 grid grid-cols-2 rounded-lg border border-clinical-line bg-clinical-mist p-1">
          <WorkspaceTab active={mode === "cases"} icon={<BookOpen size={16} />} label="优质案例" onClick={() => onModeChange("cases")} />
          <WorkspaceTab active={mode === "generate"} icon={<Wand2 size={16} />} label="AI生文" onClick={() => onModeChange("generate")} />
        </div>
      </section>
      {mode === "cases" ? (
        <CasesPage noteSegment={noteSegment} spu={spu} contentType={contentType} topic={topic} />
      ) : (
        <GeneratePage noteSegment={noteSegment} spu={spu} contentType={contentType} topic={topic} />
      )}
    </div>
  );
}

function WorkspaceTab({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-extrabold transition active:scale-[0.99] ${
        active ? "bg-white text-clinical-teal shadow-[0_8px_18px_rgba(15,159,154,0.12)]" : "text-slate-500"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
