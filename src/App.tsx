import { useState } from "react";
import { MobileShell } from "./components/MobileShell";
import { CasesPage } from "./pages/CasesPage";
import { ContentTypePage } from "./pages/ContentTypePage";
import { GeneratePage } from "./pages/GeneratePage";
import { HomePage } from "./pages/HomePage";
import { SegmentPage } from "./pages/SegmentPage";
import { TopicPage } from "./pages/TopicPage";
import type { NoteSegment } from "./types/content";

type View = "segment" | "home" | "contentType" | "topic" | "cases" | "generate";

export default function App() {
  const [view, setView] = useState<View>("segment");
  const [noteSegment, setNoteSegment] = useState<NoteSegment>("kos");
  const [spu, setSpu] = useState("");
  const [contentType, setContentType] = useState("");
  const [topic, setTopic] = useState("");

  function back() {
    if (view === "generate" || view === "cases") setView("topic");
    else if (view === "topic") setView("contentType");
    else if (view === "contentType") setView("home");
    else if (view === "home") setView("segment");
  }

  if (view === "segment") {
    return (
      <MobileShell title="口腔 KOS 内容生文器" subtitle="选择笔记入口">
        <SegmentPage
          onSelect={(next) => {
            setNoteSegment(next);
            setSpu("");
            setContentType("");
            setTopic("");
            setView("home");
          }}
        />
      </MobileShell>
    );
  }

  if (view === "home") {
    return (
      <MobileShell title={noteSegment === "kos" ? "KOS笔记" : "非KOS笔记"} subtitle="选择 SPU" onBack={back}>
        <HomePage
          noteSegment={noteSegment}
          onSelect={(next) => {
            setSpu(next);
            setContentType("");
            setTopic("");
            setView("contentType");
          }}
        />
      </MobileShell>
    );
  }

  if (view === "contentType") {
    return (
      <MobileShell title={spu} subtitle="选择内容类型" onBack={back}>
        <ContentTypePage
          noteSegment={noteSegment}
          spu={spu}
          onSelect={(next) => {
            setContentType(next);
            setTopic("");
            setView("topic");
          }}
        />
      </MobileShell>
    );
  }

  if (view === "topic") {
    return (
      <MobileShell title={contentType} subtitle={`${spu} / 选择选题`} onBack={back}>
        <TopicPage
          noteSegment={noteSegment}
          spu={spu}
          contentType={contentType}
          onCases={(next) => {
            setTopic(next);
            setView("cases");
          }}
          onGenerate={(next) => {
            setTopic(next);
            setView("generate");
          }}
        />
      </MobileShell>
    );
  }

  if (view === "cases") {
    return (
      <MobileShell title="优质案例参考" subtitle={`${spu} / ${contentType} / ${topic}`} onBack={back}>
        <CasesPage noteSegment={noteSegment} spu={spu} contentType={contentType} topic={topic} />
      </MobileShell>
    );
  }

  return (
    <MobileShell title="AI 生文" subtitle={`${spu} / ${contentType} / ${topic}`} onBack={back}>
      <GeneratePage noteSegment={noteSegment} spu={spu} contentType={contentType} topic={topic} />
    </MobileShell>
  );
}
