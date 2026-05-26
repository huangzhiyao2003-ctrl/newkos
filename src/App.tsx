import { useState } from "react";
import { MobileShell } from "./components/MobileShell";
import { ContentGeneratorPage } from "./pages/ContentGeneratorPage";
import { StartupPlanPage } from "./pages/StartupPlanPage";
import { TopicWorkspacePage } from "./pages/TopicWorkspacePage";
import { TopicPage } from "./pages/TopicPage";
import type { NoteSegment } from "./types/content";

type MainTab = "planning" | "generator";
type GeneratorStep = "setup" | "topics" | "workspace";
type WorkspaceMode = "cases" | "generate";
type SelectedSegment = NoteSegment | "";

export default function App() {
  const [mainTab, setMainTab] = useState<MainTab>("planning");
  const [generatorStep, setGeneratorStep] = useState<GeneratorStep>("setup");
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("cases");
  const [selectedSegment, setSelectedSegment] = useState<SelectedSegment>("");
  const [spu, setSpu] = useState("");
  const [contentType, setContentType] = useState("");
  const [topic, setTopic] = useState("");

  function back() {
    if (mainTab !== "generator") return;
    if (generatorStep === "workspace") setGeneratorStep("topics");
    else if (generatorStep === "topics") setGeneratorStep("setup");
  }

  const shellTabs = {
    active: mainTab === "planning" ? ("startup" as const) : ("content" as const),
    onChange: (next: "startup" | "content") => setMainTab(next === "startup" ? "planning" : "generator"),
  };

  if (mainTab === "planning") {
    return (
      <MobileShell title="口腔 KOS 起号助手" subtitle="起号规划" tabs={shellTabs}>
        <StartupPlanPage
          onUsePlan={(nextSpu) => {
            setSpu(nextSpu);
            setSelectedSegment("");
            setContentType("");
            setTopic("");
            setWorkspaceMode("cases");
            setGeneratorStep("setup");
            setMainTab("generator");
          }}
        />
      </MobileShell>
    );
  }

  if (generatorStep === "setup") {
    return (
      <MobileShell title="内容生文" subtitle="选择品项和参考库" tabs={shellTabs}>
        <ContentGeneratorPage
          selectedSpu={spu}
          selectedSegment={selectedSegment}
          onSelectSpu={(nextSpu) => {
            setSpu(nextSpu);
            setContentType("");
            setTopic("");
            setWorkspaceMode("cases");
          }}
          onSelectSegment={(nextSegment) => {
            setSelectedSegment(nextSegment);
            setContentType("");
            setTopic("");
            setWorkspaceMode("cases");
          }}
          onSelectContentType={(nextContentType) => {
            setContentType(nextContentType);
            setTopic("");
            setWorkspaceMode("cases");
            setGeneratorStep("topics");
          }}
        />
      </MobileShell>
    );
  }

  if (generatorStep === "topics" && selectedSegment) {
    return (
      <MobileShell title={contentType} subtitle={`${spu} / 选择选题`} onBack={back} tabs={shellTabs}>
        <TopicPage
          noteSegment={selectedSegment}
          spu={spu}
          contentType={contentType}
          onCases={(next) => {
            setTopic(next);
            setWorkspaceMode("cases");
            setGeneratorStep("workspace");
          }}
          onGenerate={(next) => {
            setTopic(next);
            setWorkspaceMode("generate");
            setGeneratorStep("workspace");
          }}
        />
      </MobileShell>
    );
  }

  if (generatorStep === "workspace" && selectedSegment) {
    return (
      <MobileShell title="选题工作台" subtitle={`${spu} / ${contentType}`} onBack={back} tabs={shellTabs}>
        <TopicWorkspacePage
          noteSegment={selectedSegment}
          spu={spu}
          contentType={contentType}
          topic={topic}
          mode={workspaceMode}
          onModeChange={setWorkspaceMode}
        />
      </MobileShell>
    );
  }

  return (
    <MobileShell title="内容生文" subtitle="选择品项和参考库" tabs={shellTabs}>
      <ContentGeneratorPage
        selectedSpu={spu}
        selectedSegment={selectedSegment}
        onSelectSpu={setSpu}
        onSelectSegment={setSelectedSegment}
        onSelectContentType={(nextContentType) => {
          setContentType(nextContentType);
          setTopic("");
          setWorkspaceMode("cases");
          setGeneratorStep("topics");
        }}
      />
    </MobileShell>
  );
}
