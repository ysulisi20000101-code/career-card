"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Bot,
  CheckCircle2,
  FileCheck2,
  Loader2,
  MessageSquareText,
  Palette,
  RefreshCw,
  Send,
  ShieldCheck,
  Wand2,
} from "lucide-react";
import type { ResumeData } from "@/types";
import type { CareerSiteChatResult, CareerSiteDraft } from "@/lib/agent/site-generator/types";
import { Button } from "@/components/ui/button";
import { GeneratedSitePreview } from "./generated-site-preview";

type ChatMessage = {
  id: string;
  role: "agent" | "user";
  content: string;
  changes?: string[];
};

const generationSteps = [
  "读取简历事实",
  "判断职业定位",
  "组织职业叙事",
  "生成网站区块",
  "选择视觉风格",
  "执行发布前检查",
];

const quickPrompts = [
  "更像 AI Agent 产品经理",
  "风格更高级克制",
  "把重点放在 Agent 项目",
  "这段经历太虚，改得更实在一点",
];

function storageKey(resumeData: ResumeData) {
  return `career-card:site-draft:v1:${resumeData.profile.id || resumeData.profile.email || resumeData.profile.name || "local"}`;
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

export function AgentSiteWorkbench({ resumeData }: { resumeData: ResumeData }) {
  const [draft, setDraft] = useState<CareerSiteDraft | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([initialAgentMessage()]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(true);
  const [isChatting, setIsChatting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function generate() {
      const stored = readStoredDraft(resumeData);
      if (stored) {
        setDraft(stored);
        setMessages([initialAgentMessage(stored)]);
        setIsGenerating(false);
        return;
      }

      setIsGenerating(true);
      setError(null);
      try {
        const response = await fetch("/api/agent/site-draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeData }),
        });
        if (!response.ok) throw new Error(`生成失败：${response.status}`);
        const payload = (await response.json()) as { draft?: unknown };
        if (!isCareerSiteDraft(payload.draft)) throw new Error("生成结果结构不完整。");
        if (!cancelled) {
          saveStoredDraft(resumeData, payload.draft);
          setDraft(payload.draft);
          setMessages([initialAgentMessage(payload.draft)]);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "网站初稿生成失败。");
      } finally {
        if (!cancelled) setIsGenerating(false);
      }
    }

    void generate();
    return () => {
      cancelled = true;
    };
  }, [resumeData]);

  const reviewLabel = useMemo(() => {
    if (!draft) return "生成中";
    if (draft.review.publishBlockers.length > 0) return `${draft.review.publishBlockers.length} 项阻断`;
    if (draft.review.missingFacts.length > 0) return `${draft.review.missingFacts.length} 项待确认`;
    return "可精修";
  }, [draft]);

  async function sendMessage(message: string) {
    const trimmed = message.trim();
    if (!trimmed || isChatting) return;
    setInput("");
    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: "user", content: trimmed }]);
    setIsChatting(true);
    try {
      const response = await fetch("/api/agent/site-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData, draft, message: trimmed }),
      });
      if (!response.ok) throw new Error(`改稿失败：${response.status}`);
      const result = (await response.json()) as CareerSiteChatResult;
      saveStoredDraft(resumeData, result.draft);
      setDraft(result.draft);
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

  function regenerateDraft() {
    if (typeof window !== "undefined") window.localStorage.removeItem(storageKey(resumeData));
    setDraft(null);
    setMessages([initialAgentMessage()]);
    setIsGenerating(true);
    window.location.reload();
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

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
            {generationSteps.map((step, index) => (
              <div key={step} className="flex items-center gap-3 border border-white/10 bg-white/[0.05] p-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-zinc-950">
                  {index < generationSteps.length - 1 ? <CheckCircle2 className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                <span className="text-sm text-white/80">{step}</span>
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
    <div className="grid h-full min-h-[760px] bg-zinc-100 lg:grid-cols-[minmax(0,1fr)_400px]">
      <main className="min-h-0 overflow-y-auto">
        <GeneratedSitePreview draft={draft} />
      </main>

      <aside className="flex min-h-0 flex-col border-l border-zinc-200 bg-white">
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
            <Button size="sm" variant="ghost" className="h-8 gap-1.5 rounded-full px-2.5 text-xs" onClick={regenerateDraft}>
              <RefreshCw className="h-3.5 w-3.5" />
              重生成
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="border border-zinc-100 bg-zinc-50 p-2">
              <FileCheck2 className="mx-auto mb-1 h-3.5 w-3.5 text-emerald-600" />
              已成稿
            </div>
            <div className="border border-zinc-100 bg-zinc-50 p-2">
              <Palette className="mx-auto mb-1 h-3.5 w-3.5 text-blue-600" />
              {draft.style.preset}
            </div>
            <div className="border border-zinc-100 bg-zinc-50 p-2">
              <ShieldCheck className="mx-auto mb-1 h-3.5 w-3.5 text-violet-600" />
              {reviewLabel}
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
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
        </div>

        <div className="border-t border-zinc-100 p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-950"
                onClick={() => void sendMessage(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
          <form onSubmit={onSubmit} className="flex gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={2}
              placeholder="直接说你想怎么改：更偏某个岗位、换一种风格、突出某段经历、让表达更可信..."
              className="min-h-12 flex-1 resize-none border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
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
