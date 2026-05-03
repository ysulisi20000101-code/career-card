"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Eye,
  FileCheck2,
  History,
  Lightbulb,
  Loader2,
  MessageSquareText,
  Palette,
  PenLine,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Target,
  Undo2,
  Wand2,
} from "lucide-react";
import type { ResumeData } from "@/types";
import type { AgentSection } from "@/lib/agent/types";
import type { CareerSiteChatResult, CareerSiteDraft } from "@/lib/agent/site-generator/types";
import { materializeCareerSiteDraft } from "@/lib/agent/site-generator/draft-to-resume";
import { getAllThemes, type SiteThemeId } from "@/lib/site-styles/theme-config";
import { useResumeStore } from "@/store/resume-store";
import { loadSite, saveSite } from "@/lib/projects/registry";
import { Button } from "@/components/ui/button";
import { CareerNarrativeSite } from "@/components/narrative/career-narrative-site";

type ChatMessage = {
  id: string;
  role: "agent" | "user";
  content: string;
  changes?: string[];
};

const generationStages = ["分析简历结构…", "生成网站初稿…", "执行质量检查…"];

const fallbackQuickPrompts: { icon: typeof Wand2; label: string }[] = [
  { icon: Target, label: "更像 AI Agent 产品经理" },
  { icon: Palette, label: "风格更高级克制" },
  { icon: Search, label: "把重点放在 Agent 项目" },
  { icon: PenLine, label: "这段经历太虚，改得更实在一点" },
];

function buildDynamicPrompts(draft: CareerSiteDraft | null): { icon: typeof Wand2; label: string }[] {
  if (!draft) return fallbackQuickPrompts;

  const prompts: { icon: typeof Wand2; label: string }[] = [];

  const { missingFacts, publishBlockers } = draft.review;
  const { preset } = draft.style;
  const strengths = draft.positioning.coreStrengths;

  if (missingFacts.includes("一句话职业定位") || missingFacts.includes("可验证成果")) {
    prompts.push({ icon: Target, label: "帮我写一句职业定位" });
  }
  if (publishBlockers.length > 0) {
    prompts.push({ icon: ClipboardCheck, label: `修复 ${publishBlockers[0]}` });
  }
  if (missingFacts.includes("职业故事") || missingFacts.includes("亮点支撑")) {
    prompts.push({ icon: PenLine, label: "帮我整理经历故事" });
  }
  if (preset === "technical-builder") {
    prompts.push({ icon: Palette, label: "换一种更温和的风格" });
  } else if (preset === "minimal") {
    prompts.push({ icon: Palette, label: "风格更专业有力度" });
  } else {
    prompts.push({ icon: Palette, label: "风格更高级克制" });
  }
  if (strengths.length > 0) {
    const mainSkill = strengths[0];
    prompts.push({ icon: Search, label: `突出 ${mainSkill.slice(0, 12)} 能力` });
  }

  if (prompts.length < 3) {
    prompts.push({ icon: PenLine, label: "把表达改得更可信" });
  }

  return prompts.slice(0, 4);
}

function storageKey(resumeData: ResumeData) {
  return `career-card:site-draft:v1:${resumeData.profile.id || resumeData.profile.email || resumeData.profile.name || "local"}`;
}

function historyKey(resumeData: ResumeData) {
  return `${storageKey(resumeData)}:history`;
}

function isCareerSiteDraft(value: unknown): value is CareerSiteDraft {
  return value !== null && typeof value === "object" && "hero" in value && "sections" in value && "review" in value;
}

function readStoredDraft(resumeData: ResumeData): CareerSiteDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(resumeData));
    const parsed = raw ? JSON.parse(raw) : null;
    return isCareerSiteDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function saveStoredDraft(resumeData: ResumeData, draft: CareerSiteDraft) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(resumeData), JSON.stringify(draft));
}

function readStoredHistory(resumeData: ResumeData): CareerSiteDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(historyKey(resumeData));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isCareerSiteDraft).slice(0, 12) : [];
  } catch {
    return [];
  }
}

function saveStoredHistory(resumeData: ResumeData, drafts: CareerSiteDraft[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(historyKey(resumeData), JSON.stringify(drafts.slice(0, 12)));
}

function rememberDraft(resumeData: ResumeData, draft: CareerSiteDraft) {
  const next = [draft, ...readStoredHistory(resumeData).filter((item) => item.updatedAt !== draft.updatedAt)].slice(0, 12);
  saveStoredHistory(resumeData, next);
}

function initialAgentMessage(draft?: CareerSiteDraft | null): ChatMessage {
  if (!draft) {
    return {
      id: "agent-welcome",
      role: "agent",
      content: "上传完成后我会直接生成个人网站初稿，你可以再用对话改定位、风格、叙事重点或某段经历。",
    };
  }
  const missing = draft.review.missingFacts.slice(0, 3);
  return {
    id: `agent-ready-${draft.updatedAt}`,
    role: "agent",
    content:
      missing.length > 0
        ? `我已经生成了网站初稿，但发布前建议先确认：${missing.join("、")}。你也可以直接告诉我想改哪一版风格或叙事重点。`
        : "我已经生成了一个可继续精修的网站初稿。你可以直接说：更像某个岗位、换一种风格、突出某段经历，或者让表达更可信。",
  };
}

interface AgentSiteWorkbenchProps {
  resumeData: ResumeData;
  siteId?: string;
  themeId?: SiteThemeId;
  onRenderedDataChange?: (data: ResumeData) => void;
  onThemeChange?: (themeId: SiteThemeId) => void;
  onDraftSave?: (draft: CareerSiteDraft) => void;
}

export function AgentSiteWorkbench({
  resumeData,
  siteId,
  themeId = "warm-business",
  onRenderedDataChange,
  onThemeChange,
  onDraftSave,
}: AgentSiteWorkbenchProps) {
  const storeDraftData = useResumeStore((s) => s.draftData);
  const setStoreDraftData = useResumeStore((s) => s.setDraftData);
  const [draft, setDraft] = useState<CareerSiteDraft | null>(storeDraftData);
  const [messages, setMessages] = useState<ChatMessage[]>([initialAgentMessage()]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(true);
  const [isChatting, setIsChatting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeThemeId, setActiveThemeId] = useState<SiteThemeId>(themeId);
  const [history, setHistory] = useState<CareerSiteDraft[]>([]);
  const [showIntentPanel, setShowIntentPanel] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isIntentLoading, setIsIntentLoading] = useState(false);
  const draftStorageKey = useMemo(() => storageKey(resumeData), [
    resumeData.profile.email,
    resumeData.profile.id,
    resumeData.profile.name,
  ]);

  useEffect(() => {
    setActiveThemeId(themeId);
  }, [themeId]);

  async function generateDraft(options: { force?: boolean; signal?: AbortSignal } = {}) {
    const genId = ++generationIdRef.current;
    // site-based: check site storage first
    const siteDraft = siteId ? (loadSite(siteId)?.draft ?? null) : null;
    const stored = options.force ? null : (siteDraft ?? storeDraftData ?? readStoredDraft(resumeData));
    if (stored) {
      if (genId !== generationIdRef.current) return;
      setDraft(stored);
      if (!storeDraftData) setStoreDraftData(stored);
      setHistory(readStoredHistory(resumeData));
      setMessages([initialAgentMessage(stored)]);
      setIsGenerating(false);
      setLoadingStage(3);
      setError(null);
      return;
    }

    setIsGenerating(true);
    setLoadingStage(0);
    setError(null);

    const stage1Timer = setTimeout(() => setLoadingStage(1), 400);

    // Build body with site params when available
    const site = siteId ? loadSite(siteId) : null;
    const body: Record<string, unknown> = { resumeData };
    if (site?.targetRole) body.targetRole = site.targetRole;
    if (site?.jdText) body.jdText = site.jdText;

    let lastError: unknown = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      // Check if this generation is still the current one
      if (genId !== generationIdRef.current) return;
      try {
        const response = await fetch("/api/agent/site-draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: options.signal,
        });
        clearTimeout(stage1Timer);
        if (genId !== generationIdRef.current) return;
        setLoadingStage(2);
        if (!response.ok) throw new Error(`生成失败：${response.status}`);
        const payload = (await response.json()) as { draft?: unknown };
        if (!isCareerSiteDraft(payload.draft)) throw new Error("生成结果结构不完整。");

        // Persist to site if siteId is set, otherwise use legacy storage
        if (siteId && site) {
          saveSite({ ...site, draft: payload.draft as CareerSiteDraft, updatedAt: new Date().toISOString() });
        }
        saveStoredDraft(resumeData, payload.draft);
        rememberDraft(resumeData, payload.draft);
        if (genId !== generationIdRef.current) return;
        setStoreDraftData(payload.draft);
        setDraft(payload.draft);
        setHistory(readStoredHistory(resumeData));
        setMessages([initialAgentMessage(payload.draft)]);
        lastError = null;
        break;
      } catch (err) {
        lastError = err;
        if (err instanceof DOMException && err.name === "AbortError") break;
        if (attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 800));
          if (options.signal?.aborted) break;
        }
      }
    }
    // 只允许当前代更新状态
    if (genId !== generationIdRef.current) return;
    clearTimeout(stage1Timer);
    // 请求已被取消（Strict Mode 双重挂载 / 导航离开）→ 静默退出，不修改任何状态
    if (options.signal?.aborted) return;
    if (lastError) {
      setError(lastError instanceof Error ? lastError.message : "网站初稿生成失败。");
    }
    setIsGenerating(false);
  }

  useEffect(() => {
    const controller = new AbortController();
    async function generate() {
      const stored = readStoredDraft(resumeData);
      if (stored) {
        setDraft(stored);
        setHistory(readStoredHistory(resumeData));
        setMessages([initialAgentMessage(stored)]);
        setIsGenerating(false);
        return;
      }
      await generateDraft({ signal: controller.signal });
    }

    void generate();
    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftStorageKey]);

  const renderedData = useMemo(
    () => (draft ? materializeCareerSiteDraft(resumeData, draft, activeThemeId) : resumeData),
    [activeThemeId, draft, resumeData],
  );
  const renderedSignature = draft ? `${draft.updatedAt}:${activeThemeId}` : "";

  useEffect(() => {
    if (draft) onRenderedDataChange?.(renderedData);
    // Only propagate when the Agent draft or theme changes, not on every parent store hydration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderedSignature]);

  const reviewLabel = useMemo(() => {
    if (!draft) return "生成中";
    if (draft.review.publishBlockers.length > 0) return `${draft.review.publishBlockers.length} 项阻断`;
    if (draft.review.missingFacts.length > 0) return `${draft.review.missingFacts.length} 项待确认`;
    return "可精修";
  }, [draft]);

  const quickPrompts = useMemo(() => buildDynamicPrompts(draft), [draft]);

  async function sendMessage(message: string) {
    const trimmed = message.trim();
    if (!trimmed || isChatting || isIntentLoading) return;
    setInput("");
    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: "user", content: trimmed }]);
    setIsChatting(true);
    try {
      const result = await applySiteChat(trimmed);
      commitDraftUpdate(result);
      setMessages((current) => [
        ...current,
        {
          id: `agent-${Date.now()}`,
          role: "agent",
          content: result.summary || result.questions[0] || "我需要更具体的方向，才能安全改动网站。",
          changes: result.changes,
        },
      ]);
    } catch (err) {
      setMessages((current) => [
        ...current,
        {
          id: `agent-error-${Date.now()}`,
          role: "agent",
          content: err instanceof Error ? err.message : "这次修改没有成功，可以再试一次。",
        },
      ]);
    } finally {
      setIsChatting(false);
    }
  }

  const intentConfigs: { intent: string; label: string; icon: typeof Search }[] = [
    { intent: "analyze_resume", label: "分析优势", icon: Lightbulb },
    { intent: "ask_clarifying_questions", label: "追问细节", icon: Search },
    { intent: "rewrite_experience_story", label: "整理经历", icon: PenLine },
    { intent: "map_to_target_role", label: "匹配岗位", icon: Target },
    { intent: "review_before_publish", label: "检查发布", icon: ClipboardCheck },
  ];

  async function applySiteChat(message: string): Promise<CareerSiteChatResult> {
    const recentHistory = messages
      .filter((m) => m.role === "user" || m.role === "agent")
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));
    const response = await fetch("/api/agent/site-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeData, draft, message, history: recentHistory }),
    });
    if (!response.ok) throw new Error(`改稿失败：${response.status}`);
    return (await response.json()) as CareerSiteChatResult;
  }

  function commitDraftUpdate(result: CareerSiteChatResult) {
    saveStoredDraft(resumeData, result.draft);
    rememberDraft(resumeData, result.draft);
    setStoreDraftData(result.draft);
    setDraft(result.draft);
    setHistory(readStoredHistory(resumeData));
    if (onDraftSave) onDraftSave(result.draft);
  }

  async function sendIntent(intent: string) {
    if (!draft || isIntentLoading || isChatting) return;
    setIsIntentLoading(true);
    const intentLabel = intentConfigs.find((c) => c.intent === intent)?.label ?? intent;
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", content: `[${intentLabel}]` },
    ]);
    try {
      const response = await fetch("/api/agent/career-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData, intent, currentSection: "preview" as AgentSection }),
      });
      if (!response.ok) throw new Error(`分析失败：${response.status}`);
      const payload = await response.json();
      const result = payload.response ?? payload;
      const patches = Array.isArray(result.patches) ? result.patches : [];
      const suggestions = Array.isArray(result.suggestions) ? result.suggestions : [];

      const allPatches = [
        ...patches,
        ...suggestions.flatMap((s: { patches?: unknown[] }) => (Array.isArray(s.patches) ? s.patches : [])),
      ];

      if (allPatches.length > 0) {
        const patchDescs = allPatches
          .slice(0, 6)
          .map((p: { label?: string; value?: unknown }) => {
            const val = typeof p.value === "string" ? p.value.slice(0, 80) : "";
            return val ? `${p.label ?? ""}: ${val}` : (p.label ?? "");
          })
          .filter(Boolean)
          .join("；");
        const updateMessage = `[${intentLabel}] ${patchDescs}`;
        const siteResult = await applySiteChat(updateMessage);
        commitDraftUpdate(siteResult);
        setMessages((current) => [
          ...current,
          {
            id: `agent-${Date.now()}`,
            role: "agent",
            content: siteResult.summary || "已根据分析结果更新网站。",
            changes: siteResult.changes,
          },
        ]);
      } else {
        const summary = result.summary ?? "已完成分析。";
        const questions = Array.isArray(result.questions) ? result.questions : [];
        const findings = Array.isArray(result.findings) ? result.findings : [];
        const findingText = findings.map((f: { title?: string; body?: string }) => f.title ?? "").filter(Boolean);
        setMessages((current) => [
          ...current,
          {
            id: `agent-${Date.now()}`,
            role: "agent",
            content: [summary, ...findingText, ...questions.map((q: { label?: string }) => q.label ?? q)].join("\n"),
          },
        ]);
      }
    } catch (err) {
      setMessages((current) => [
        ...current,
        {
          id: `agent-error-${Date.now()}`,
          role: "agent",
          content: err instanceof Error ? err.message : "分析失败，可以再试一次。",
        },
      ]);
    } finally {
      setIsIntentLoading(false);
    }
  }

  function regenerateDraft() {
    if (typeof window !== "undefined") window.localStorage.removeItem(storageKey(resumeData));
    setDraft(null);
    setMessages([initialAgentMessage()]);
    setIsGenerating(true);
    void generateDraft({ force: true });
  }

  function restoreDraft(nextDraft: CareerSiteDraft) {
    saveStoredDraft(resumeData, nextDraft);
    rememberDraft(resumeData, nextDraft);
    setStoreDraftData(nextDraft);
    setDraft(nextDraft);
    setHistory(readStoredHistory(resumeData));
    setMessages((current) => [
      ...current,
      {
        id: `agent-restore-${Date.now()}`,
        role: "agent",
        content: `已恢复到「${nextDraft.versionHistory.at(-1)?.summary ?? "历史版本"}」。`,
      },
    ]);
  }

  function changeTheme(nextThemeId: SiteThemeId) {
    setActiveThemeId(nextThemeId);
    onThemeChange?.(nextThemeId);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  const [loadingStage, setLoadingStage] = useState(0);
  const generationIdRef = useRef(0);

  if (isGenerating) {
    return (
      <div className="flex h-full min-h-[720px] items-center justify-center bg-zinc-950 px-4 text-white">
        <div className="w-full max-w-2xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center bg-cyan-300 text-zinc-950">
              <Wand2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-cyan-200">Career Agent 正在生成网站</p>
              <h1 className="text-2xl font-semibold tracking-normal">从简历到可预览的个人网站</h1>
            </div>
          </div>
          <div className="grid gap-3">
            {generationStages.map((stage, index) => (
              <div key={stage} className="flex items-center gap-3 border border-white/10 bg-white/[0.05] p-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-zinc-950">
                  {index < loadingStage ? <CheckCircle2 className="h-4 w-4" /> : index === loadingStage ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="text-xs">{index + 1}</span>}
                </div>
                <span className="text-sm text-white/80">{stage}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !draft) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-50 p-6">
        <div className="max-w-md border border-red-200 bg-white p-5 text-center shadow-sm">
          <p className="text-sm font-semibold text-red-700">网站初稿生成失败</p>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{error ?? "没有生成有效草稿。"}</p>
          <Button className="mt-4 gap-2" onClick={regenerateDraft}>
            <RefreshCw className="h-4 w-4" />
            重新生成
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[760px] flex-col bg-zinc-100 lg:grid lg:grid-cols-[minmax(0,1fr)_420px]">
      <main className={`relative min-h-0 overflow-y-auto ${showMobileChat ? "hidden lg:block" : ""}`}>
        <div className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-zinc-200 bg-white/95 px-4 py-2.5 backdrop-blur">
          <div className="flex items-center gap-2">
            <Eye className="h-3.5 w-3.5 text-indigo-500" />
            <span className="text-xs font-medium text-zinc-600">实时预览</span>
          </div>
          <button
            type="button"
            className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-600 lg:hidden hover:border-zinc-400"
            onClick={() => setShowMobileChat(!showMobileChat)}
          >
            {showMobileChat ? "查看预览" : "Agent 对话"}
          </button>
        </div>
        <CareerNarrativeSite data={renderedData} siteThemeId={activeThemeId} showFooter={false} />
      </main>

      <aside className={`flex min-h-0 flex-col border-t border-zinc-200 bg-white lg:max-h-none lg:border-l lg:border-t-0 ${showMobileChat ? "" : "hidden lg:flex"} max-h-[58vh] lg:max-h-none`}>
        <header className="border-b border-zinc-100 p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center bg-zinc-950 text-white">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-950">Career Agent</p>
                <p className="text-xs text-zinc-500">改定位、改风格、改叙事</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="rounded-full p-1 text-zinc-400 transition hover:text-zinc-700 lg:hidden"
                onClick={() => setShowMobileChat(false)}
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <Button size="sm" variant="ghost" className="h-8 gap-1.5 rounded-full px-2.5 text-xs" onClick={regenerateDraft}>
                <RefreshCw className="h-3.5 w-3.5" />
                重生成
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-2.5" title="AI 已生成初稿，可对话精修">
              <FileCheck2 className="mx-auto mb-1 h-3.5 w-3.5 text-emerald-600" />
              <span className="text-[11px] font-medium text-emerald-700">草稿就绪</span>
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-2.5" title="当前使用的展示模板">
              <Palette className="mx-auto mb-1 h-3.5 w-3.5 text-blue-600" />
              <span className="text-[11px] font-medium text-blue-700">{draft.style.preset}</span>
            </div>
            <div className="rounded-lg border border-violet-100 bg-violet-50/50 p-2.5" title="发布前内容检查">
              <ShieldCheck className="mx-auto mb-1 h-3.5 w-3.5 text-violet-600" />
              <span className="text-[11px] font-medium text-violet-700">{reviewLabel}</span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {getAllThemes().map((theme) => (
              <button
                key={theme.id}
                type="button"
                className={`min-w-0 rounded-md border px-2 py-1.5 text-[11px] font-medium transition ${
                  activeThemeId === theme.id
                    ? "border-zinc-950 bg-zinc-950 text-white"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
                }`}
                onClick={() => changeTheme(theme.id)}
                title={theme.description}
              >
                {theme.name}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-md border border-zinc-200 px-3 py-1.5 text-[11px] font-medium text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-700"
              onClick={() => setShowIntentPanel(!showIntentPanel)}
            >
              <span className="flex items-center gap-1.5">
                <Wand2 className="h-3 w-3" />
                Agent 深度分析
              </span>
              {showIntentPanel ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {showIntentPanel && (
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {intentConfigs.map(({ intent, label, icon: Icon }) => (
                  <button
                    key={intent}
                    type="button"
                    disabled={isIntentLoading}
                    className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2 py-1.5 text-[11px] font-medium text-zinc-600 transition hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50"
                    onClick={() => void sendIntent(intent)}
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          <div className="border border-blue-100 bg-blue-50/60 p-2 text-[11px] leading-5 text-blue-800">
            <MessageSquareText className="mr-1 inline h-3.5 w-3.5" />
            AI 驱动：修改定位、风格、叙事。不会新增简历外事实。
          </div>
          {draft.review.publishBlockers.length > 0 && (
            <div className="border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
              发布前需要处理：{draft.review.publishBlockers.join("、")}
            </div>
          )}
          {messages.map((message) => (
            <div key={message.id} className={message.role === "user" ? "ml-8" : "mr-8"}>
              <div className={message.role === "user" ? "bg-zinc-950 p-3 text-sm leading-6 text-white" : "border border-zinc-200 bg-zinc-50 p-3 text-sm leading-6 text-zinc-700"}>
                {message.content}
                {message.changes && message.changes.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-zinc-500">
                    {message.changes.map((change) => (
                      <li key={change}>- {change}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
          {isChatting && (
            <div className="mr-8 border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-500">
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
              正在改网站草稿...
            </div>
          )}
          {history.length > 1 && (
            <div className="border border-zinc-200 bg-white p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-zinc-700">
                <History className="h-3.5 w-3.5" />
                最近版本
              </div>
              <div className="space-y-1.5">
                {history.slice(1, 4).map((item) => (
                  <button
                    key={`${item.updatedAt}-${item.versionHistory.length}`}
                    type="button"
                    className="flex w-full items-start gap-2 rounded-md border border-zinc-100 px-2 py-1.5 text-left text-[11px] leading-4 text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-800"
                    onClick={() => restoreDraft(item)}
                  >
                    <Undo2 className="mt-0.5 h-3 w-3 shrink-0" />
                    <span className="line-clamp-2">{item.versionHistory.at(-1)?.summary ?? "恢复此版本"}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-zinc-100 p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt.label}
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-950"
                onClick={() => void sendMessage(prompt.label)}
              >
                <prompt.icon className="h-3 w-3" />
                {prompt.label}
              </button>
            ))}
          </div>
          <form onSubmit={onSubmit} className="flex gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage(input);
                }
              }}
              rows={3}
              placeholder="直接说你想怎么改：更偏某个岗位、换一种风格、突出某段经历、让表达更可信..."
              className="min-h-20 flex-1 resize-y border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
            />
            <Button type="submit" className="h-auto self-stretch gap-1.5" disabled={isChatting || !input.trim()}>
              <Send className="h-4 w-4" />
              发送
            </Button>
          </form>
          <div className="mt-3 flex items-center gap-2 text-[11px] leading-5 text-zinc-400">
            <MessageSquareText className="h-3.5 w-3.5" />
            Agent 会改草稿，但不会自动新增简历外事实。
          </div>
        </div>
      </aside>
    </div>
  );
}
