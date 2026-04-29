"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Bot, CheckCircle2, Loader2, MessageSquareText, Palette, RefreshCw, Send, Sparkles, Wand2 } from "lucide-react";
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
  "Parse resume facts",
  "Find positioning",
  "Compose career narrative",
  "Generate site sections",
  "Choose visual direction",
  "Run publish guard",
];

const quickPrompts = [
  "更像 AI Agent 产品经理",
  "风格更高级克制",
  "把重点放在 Agent 项目",
  "这段经历太虚，改得更实在一点",
];

function initialAgentMessage(): ChatMessage {
  return {
    id: "agent-welcome",
    role: "agent",
    content: "我已经根据简历生成了一个个人网站草稿。你可以直接告诉我想改定位、风格、叙事重点，或者某一段经历的表达。",
  };
}

function isCareerSiteDraft(value: unknown): value is CareerSiteDraft {
  return value !== null && typeof value === "object" && "hero" in value && "sections" in value;
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
      setIsGenerating(true);
      setError(null);
      try {
        const response = await fetch("/api/agent/site-draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeData }),
        });
        if (!response.ok) throw new Error(`Draft generation failed: ${response.status}`);
        const payload = (await response.json()) as { draft?: unknown };
        if (!isCareerSiteDraft(payload.draft)) throw new Error("Draft generation returned invalid data.");
        if (!cancelled) {
          setDraft(payload.draft);
          setMessages([initialAgentMessage()]);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to generate site draft.");
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
    if (!draft) return "Generating";
    if (draft.review.publishBlockers.length > 0) return `${draft.review.publishBlockers.length} blocker`;
    if (draft.review.missingFacts.length > 0) return `${draft.review.missingFacts.length} review item`;
    return "Ready";
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
      if (!response.ok) throw new Error(`Agent chat failed: ${response.status}`);
      const result = (await response.json()) as CareerSiteChatResult;
      setDraft(result.draft);
      setMessages((current) => [
        ...current,
        {
          id: `agent-${Date.now()}`,
          role: "agent",
          content: result.summary || result.questions[0] || "我需要更具体的方向，才能安全修改网站草稿。",
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

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  if (isGenerating) {
    return (
      <div className="flex h-full min-h-[720px] items-center justify-center bg-zinc-950 px-4 text-white">
        <div className="w-full max-w-2xl rounded-lg border border-white/10 bg-white/[0.06] p-6 shadow-2xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-400 text-zinc-950">
              <Wand2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-cyan-200">Career Agent is building your site</p>
              <h1 className="text-2xl font-semibold tracking-normal">From resume to personal website</h1>
            </div>
          </div>
          <div className="grid gap-3">
            {generationSteps.map((step, index) => (
              <div key={step} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.05] p-3">
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
        <div className="max-w-md rounded-lg border border-red-200 bg-white p-5 text-center shadow-sm">
          <p className="text-sm font-semibold text-red-700">Agent draft generation failed</p>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{error ?? "No draft was generated."}</p>
          <Button className="mt-4 gap-2" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-[760px] bg-zinc-100 lg:grid-cols-[minmax(0,1fr)_380px]">
      <main className="min-h-0 overflow-y-auto">
        <GeneratedSitePreview draft={draft} />
      </main>

      <aside className="flex min-h-0 flex-col border-l border-zinc-200 bg-white">
        <header className="border-b border-zinc-100 p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-950 text-white">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-950">Career Agent</p>
                <p className="text-xs text-zinc-500">Draft, style, narrative</p>
              </div>
            </div>
            <span className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs text-zinc-500">{reviewLabel}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-md border border-zinc-100 bg-zinc-50 p-2">
              <Sparkles className="mx-auto mb-1 h-3.5 w-3.5 text-cyan-600" />
              Generated
            </div>
            <div className="rounded-md border border-zinc-100 bg-zinc-50 p-2">
              <Palette className="mx-auto mb-1 h-3.5 w-3.5 text-blue-600" />
              {draft.style.preset}
            </div>
            <div className="rounded-md border border-zinc-100 bg-zinc-50 p-2">
              <MessageSquareText className="mx-auto mb-1 h-3.5 w-3.5 text-violet-600" />
              Chat edit
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((message) => (
            <div key={message.id} className={message.role === "user" ? "ml-8" : "mr-8"}>
              <div className={message.role === "user" ? "rounded-lg bg-zinc-950 p-3 text-sm leading-6 text-white" : "rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm leading-6 text-zinc-700"}>
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
            <div className="mr-8 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-500">
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
              Updating the site draft...
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
              placeholder="告诉我想怎么改网站，比如更偏 AI Agent、风格更克制、重点放在某段经历..."
              className="min-h-12 flex-1 resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
            />
            <Button type="submit" className="h-auto self-stretch gap-1.5" disabled={isChatting || !input.trim()}>
              <Send className="h-4 w-4" />
              Send
            </Button>
          </form>
        </div>
      </aside>
    </div>
  );
}
