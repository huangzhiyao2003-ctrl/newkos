import { useState } from "react";
import { MobileShell } from "./components/MobileShell";
import { CasesPage } from "./pages/CasesPage";
import { ContentTypePage } from "./pages/ContentTypePage";
import { GeneratePage } from "./pages/GeneratePage";
import { HomePage } from "./pages/HomePage";
import { SegmentPage } from "./pages/SegmentPage";
import { StartupPlanPage } from "./pages/StartupPlanPage";
import { TopicPage } from "./pages/TopicPage";
import type { NoteSegment } from "./types/content";

type View = "startup" | "segment" | "home" | "contentType" | "topic" | "cases" | "generate";
type ContentView = Exclude<View, "startup">;

export default function App() {
  const [view, setView] = useState<View>("startup");
  const [lastContentView, setLastContentView] = useState<ContentView>("segment");
  const [noteSegment, setNoteSegment] = useState<NoteSegment>("kos");
  const [plannedSpu, setPlannedSpu] = useState("");
  const [spu, setSpu] = useState("");
  const [contentType, setContentType] = useState("");
  const [topic, setTopic] = useState("");

  function back() {
    if (view === "generate" || view === "cases") setView("topic");
    else if (view === "topic") setView("contentType");
    else if (view === "contentType") setView(plannedSpu ? "segment" : "home");
    else if (view === "home") setView("segment");
    else if (view === "segment" && plannedSpu) setView("startup");
  }

  function switchMainTab(next: "startup" | "content") {
    if (next === "startup") {
      if (view !== "startup") setLastContentView(view as ContentView);
      setView("startup");
      return;
    }
    if (view === "startup") {
      setView(lastContentView);
    }
  }

  const shellTabs = {
    active: view === "startup" ? ("startup" as const) : ("content" as const),
    onChange: switchMainTab,
  };

  if (view === "startup") {
    return (
      <MobileShell title="口腔 KOS 起号助手" subtitle="起号规划" tabs={shellTabs}>
        <StartupPlanPage
          onUsePlan={(nextSpu) => {
            setPlannedSpu(nextSpu);
            setSpu(nextSpu);
            setContentType("");
            setTopic("");
            setLastContentView("contentType");
            setView("segment");
          }}
          onSkip={() => {
            setPlannedSpu("");
            setSpu("");
            setContentType("");
            setTopic("");
            setLastContentView("segment");
            setView("segment");
          }}
        />
      </MobileShell>
    );
  }

  if (view === "segment") {
    return (
      <MobileShell title="内容生文器" subtitle={plannedSpu ? `${plannedSpu} / 选择参考库` : "选择参考库"} onBack={plannedSpu ? back : undefined} tabs={shellTabs}>
        <SegmentPage
          onSelect={(next) => {
            setNoteSegment(next);
            setSpu(plannedSpu);
            setContentType("");
            setTopic("");
            const nextView = plannedSpu ? "contentType" : "home";
            setLastContentView(nextView);
            setView(nextView);
          }}
        />
      </MobileShell>
    );
  }

  if (view === "home") {
    return (
      <MobileShell title={noteSegment === "kos" ? "KOS笔记" : "非KOS笔记"} subtitle="选择 SPU" onBack={back} tabs={shellTabs}>
        <HomePage
          noteSegment={noteSegment}
          onSelect={(next) => {
            setSpu(next);
            setContentType("");
            setTopic("");
            setLastContentView("contentType");
            setView("contentType");
          }}
        />
      </MobileShell>
    );
  }

  if (view === "contentType") {
    return (
      <MobileShell title={spu} subtitle="选择内容类型" onBack={back} tabs={shellTabs}>
        <ContentTypePage
          noteSegment={noteSegment}
          spu={spu}
          onSelect={(next) => {
            setContentType(next);
            setTopic("");
            setLastContentView("topic");
            setView("topic");
          }}
        />
      </MobileShell>
    );
  }

  if (view === "topic") {
    return (
      <MobileShell title={contentType} subtitle={`${spu} / 选择选题`} onBack={back} tabs={shellTabs}>
        <TopicPage
          noteSegment={noteSegment}
          spu={spu}
          contentType={contentType}
          onCases={(next) => {
            setTopic(next);
            setLastContentView("cases");
            setView("cases");
          }}
          onGenerate={(next) => {
            setTopic(next);
            setLastContentView("generate");
            setView("generate");
          }}
        />
      </MobileShell>
    );
  }

  if (view === "cases") {
    return (
      <MobileShell title="优质案例参考" subtitle={`${spu} / ${contentType} / ${topic}`} onBack={back} tabs={shellTabs}>
        <CasesPage noteSegment={noteSegment} spu={spu} contentType={contentType} topic={topic} />
      </MobileShell>
    );
  }

  return (
    <MobileShell title="AI 生文" subtitle={`${spu} / ${contentType} / ${topic}`} onBack={back} tabs={shellTabs}>
      <GeneratePage noteSegment={noteSegment} spu={spu} contentType={contentType} topic={topic} />
    </MobileShell>
  );
}
