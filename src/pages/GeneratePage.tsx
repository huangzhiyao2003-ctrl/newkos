import { BadgeCheck, ClipboardCheck, Sparkles, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import { CopyButton } from "../components/CopyButton";
import { LoadingState } from "../components/LoadingState";
import { TrustBadges } from "../components/TrustBadges";
import type { NoteSegment } from "../types/content";
import type { GenerateResponse } from "../types/generation";
import { generateNote } from "../utils/api";
import { getFormula } from "../utils/dataSelectors";

export function GeneratePage({ noteSegment, spu, contentType, topic }: { noteSegment: NoteSegment; spu: string; contentType: string; topic: string }) {
  const [organizationInfo, setOrganizationInfo] = useState("");
  const [extraRequirements, setExtraRequirements] = useState("");
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const formula = useMemo(() => getFormula(noteSegment, spu, contentType, topic), [noteSegment, spu, contentType, topic]);

  async function submit() {
    setError("");
    setLoading(true);
    try {
      const data = await generateNote({ note_segment: noteSegment, spu, content_type: contentType, topic, organization_info: organizationInfo, extra_requirements: extraRequirements });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg bg-white p-4 shadow-soft">
        <div className="inline-flex items-center gap-1 rounded-full bg-clinical-mist px-3 py-1 text-xs font-extrabold text-clinical-teal">
          <BadgeCheck size={14} />
          已匹配历史公式
        </div>
        <p className="mt-2 text-base font-bold text-clinical-ink">{spu} / {contentType} / {topic}</p>
        {formula ? <p className="mt-2 text-sm leading-6 text-slate-600">{formula.title_formula}</p> : null}
        <div className="mt-3">
          <TrustBadges badges={[{ label: "高跑量公式" }, { label: "脱敏案例参考" }, { label: "风险校验" }]} />
        </div>
      </section>
      <section className="space-y-3 rounded-lg bg-white p-4 shadow-soft">
        <label className="block text-sm font-bold text-clinical-ink">
          机构 / 医生信息
          <textarea value={organizationInfo} onChange={(event) => setOrganizationInfo(event.target.value)} className="mt-2 min-h-20 w-full rounded-lg border border-clinical-line bg-white p-3 text-sm outline-none focus:border-clinical-teal" placeholder="选填。不填则生成内容不会出现具体机构名或医生名。" />
        </label>
        <label className="block text-sm font-bold text-clinical-ink">
          补充要求
          <textarea value={extraRequirements} onChange={(event) => setExtraRequirements(event.target.value)} className="mt-2 min-h-20 w-full rounded-lg border border-clinical-line bg-white p-3 text-sm outline-none focus:border-clinical-teal" placeholder="选填。例如城市、人群、语气、活动信息等真实内容。" />
        </label>
        <p className="rounded-lg bg-clinical-mist px-3 py-2 text-xs font-semibold leading-5 text-slate-600">
          系统会优先围绕当前选题吸收你填写的真实素材；如果补充要求和选题不完全匹配，会合规改写。涉及“最强、保证效果、高难度手术量”等高风险表达时，会自动弱化，并在使用提醒里说明。
        </p>
        <button disabled={loading} onClick={submit} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-clinical-teal px-4 py-3 text-base font-extrabold text-white shadow-[0_12px_30px_rgba(15,159,154,0.22)] transition active:scale-[0.99] disabled:opacity-70">
          <Wand2 size={18} />
          {loading ? "DeepSeek 生成中" : "生成笔记文案"}
        </button>
      </section>
      {loading ? <LoadingState /> : null}
      {error ? <div className="rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-600">{error}</div> : null}
      {result ? <GeneratedResult result={result} /> : null}
    </div>
  );
}

function GeneratedResult({ result }: { result: GenerateResponse }) {
  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-clinical-line bg-white p-4 shadow-soft">
        <div className="inline-flex items-center gap-1 rounded-full bg-clinical-mist px-3 py-1 text-xs font-extrabold text-clinical-teal">
          <Sparkles size={14} />
          基于历史公式 + 脱敏案例 + 用户补充要求生成
        </div>
      </div>
      <TitleCards titles={result.titles} />
      <ResultBlock title="正文" text={result.body} />
      <div className="rounded-lg bg-white p-4 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold text-clinical-ink">封面文案</h3>
          <CopyButton text={result.cover_texts.map((item) => `${item.main_title}\n${item.subtitle}\n${item.layout_suggestion}`).join("\n\n")} />
        </div>
        <div className="space-y-3">
          {result.cover_texts.map((item, index) => (
            <div key={`${item.main_title}-${index}`} className="rounded-lg bg-clinical-mist p-3 text-sm leading-6 text-slate-700">
              <div className="font-bold text-clinical-ink">{item.main_title}</div>
              <div>{item.subtitle}</div>
              <div className="text-slate-500">{item.layout_suggestion}</div>
            </div>
          ))}
        </div>
      </div>
      {result.video_opening_scripts?.length ? <ResultBlock title="前 5 秒脚本参考" text={result.video_opening_scripts.join("\n\n")} /> : null}
      <ResultBlock title="评论区引导话术" text={result.comment_cta} />
      <ResultBlock title="私信引导话术" text={result.private_message_cta} />
      <ResultBlock title="内容使用提醒" text={result.usage_note} />
    </section>
  );
}

function TitleCards({ titles }: { titles: string[] }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="inline-flex items-center gap-1 font-bold text-clinical-ink">
          <ClipboardCheck size={17} className="text-clinical-teal" />
          标题候选
        </h3>
        <CopyButton text={titles.join("\n")} />
      </div>
      <div className="space-y-2">
        {titles.map((title, index) => (
          <div key={`${title}-${index}`} className="flex items-start gap-3 rounded-lg border border-clinical-line bg-white p-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-clinical-mist text-xs font-extrabold text-clinical-teal">{index + 1}</span>
            <div className="min-w-0 flex-1 text-sm font-bold leading-6 text-clinical-ink">{title}</div>
            <CopyButton text={title} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-white bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-bold text-clinical-ink">{title}</h3>
        <CopyButton text={text} />
      </div>
      <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{text}</pre>
    </div>
  );
}
