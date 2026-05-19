"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Bot,
  Brain,
  CheckCircle2,
  FileText,
  Loader2,
  MessageSquareText,
  MonitorPlay,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  WandSparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { ChangeReviewPanel } from "@/components/agent-workbench/change-review-panel";
import type { AgentChangeItem, AgentChangeSet } from "@/lib/agent/change-diff";
import type {
  PresentationAgentMessage,
  PresentationAgentSuggestion,
  PresentationDiagnosis,
} from "@/lib/agent/presentation/diagnose-presentation";

interface PresentationAgentWorkbenchProps {
  disabled?: boolean;
  notice?: string | null;
  slideCount?: number;
  activeSlide?: {
    slideNumber: number;
    title: string;
    total: number;
  } | null;
  agentStatus?: {
    label: string;
    detail: string;
    tone?: "working" | "ready" | "review";
  };
  diagnosis?: PresentationDiagnosis | null;
  messages?: PresentationAgentMessage[];
  changeSet?: AgentChangeSet | null;
  onPrompt: (prompt: string) => void;
  onAIEnhance: () => void;
  onRegenerate: () => void;
  onEnterInterviewMode: () => void;
  onClearChangeSet?: () => void;
  onUndoChange?: () => void;
  onAcceptChangeItem?: (itemId: string) => void;
  onRejectChangeItem?: (item: AgentChangeItem) => void;
}

type WorkbenchPanel = "diagnosis" | "chat" | "practice";

const panelTabs: Array<{ id: WorkbenchPanel; label: string; icon: LucideIcon }> = [
  { id: "diagnosis", label: "诊断", icon: Zap },
  { id: "chat", label: "对话", icon: MessageSquareText },
  { id: "practice", label: "练习", icon: Target },
];

const fallbackSuggestions: PresentationAgentSuggestion[] = [
  {
    id: "opening-hook",
    label: "强化开场钩子",
    prompt: "把第 1 页改得更有开场钩子，30 秒内讲清定位、主线和最强证据",
    rationale: "先让面试官知道这份 PPT 为什么值得听。",
    priority: "high",
    kind: "opening",
  },
  {
    id: "agent-mainline",
    label: "突出 AI Agent 能力",
    prompt: "突出 AI Agent 能力，但不要炫技，改成场景、动作、结果的面试讲法",
    rationale: "把差异化卖点落到业务场景。",
    priority: "high",
    kind: "style",
  },
  {
    id: "metric-grounding",
    label: "补齐数据可信度",
    prompt: "强化数据成果的可信度，每个数字都补出口径、周期和个人贡献边界",
    rationale: "让数字经得起追问。",
    priority: "medium",
    kind: "evidence",
  },
];

function suggestionIcon(kind: PresentationAgentSuggestion["kind"]): LucideIcon {
  if (kind === "evidence") return ShieldCheck;
  if (kind === "practice") return MessageSquareText;
  if (kind === "structure") return FileText;
  if (kind === "opening") return Sparkles;
  return Bot;
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function PresentationAgentWorkbench({
  disabled,
  notice,
  slideCount,
  activeSlide,
  agentStatus,
  diagnosis,
  messages = [],
  changeSet,
  onPrompt,
  onAIEnhance,
  onRegenerate,
  onEnterInterviewMode,
  onClearChangeSet,
  onUndoChange,
  onAcceptChangeItem,
  onRejectChangeItem,
}: PresentationAgentWorkbenchProps) {
  const [activePanel, setActivePanel] = useState<WorkbenchPanel>("diagnosis");
  const [prompt, setPrompt] = useState("");
  const [selectedPracticeQuestion, setSelectedPracticeQuestion] = useState<string | null>(null);
  const [practiceAnswer, setPracticeAnswer] = useState("");
  const [practiceFeedback, setPracticeFeedback] = useState<string | null>(null);
  const suggestions = useMemo(
    () => (diagnosis?.suggestions.length ? diagnosis.suggestions : fallbackSuggestions),
    [diagnosis],
  );

  const submitPrompt = () => {
    const clean = prompt.trim();
    if (!clean || disabled) return;
    onPrompt(clean);
    setPrompt("");
    setActivePanel("chat");
  };

  const runSuggestion = (nextPrompt: string) => {
    if (disabled) return;
    onPrompt(nextPrompt);
    setActivePanel("chat");
  };

  const currentSlidePrompts = activeSlide
    ? [
      {
        label: "优化当前页讲法",
        prompt: `优化第 ${activeSlide.slideNumber} 页：让「${activeSlide.title}」更适合面试官听懂和追问`,
      },
      {
        label: "生成本页追问",
        prompt: `基于第 ${activeSlide.slideNumber} 页生成面试官追问和回答要点`,
      },
      {
        label: "改得更真实",
        prompt: `只改第 ${activeSlide.slideNumber} 页，让它更像真实项目复盘；不要新增事实`,
      },
      {
        label: "补事实边界",
        prompt: `只改第 ${activeSlide.slideNumber} 页，补充事实边界、数字口径和个人贡献说明；不要编造`,
      },
    ]
    : [];

  const evaluatePracticeAnswer = () => {
    const answer = practiceAnswer.trim();
    if (!selectedPracticeQuestion || !answer) return;
    const hasMetricBoundary = /口径|周期|边界|我负责|我的角色|贡献/.test(answer);
    const hasStructure = /首先|第一|其次|然后|最后|结论|问题|动作|结果/.test(answer);
    const hasExample = /例如|比如|项目|一次|具体|场景/.test(answer);
    const feedback = [
      answer.length < 60
        ? "回答偏短：建议补一个具体场景，避免像背稿。"
        : "回答长度够用，可以继续压成更有节奏的 45 秒版本。",
      hasStructure
        ? "结构感不错：已经有清晰的讲述顺序。"
        : "建议按“结论 -> 证据 -> 我的动作 -> 结果/边界”重组。",
      hasMetricBoundary
        ? "可信度较好：你提到了口径、周期或贡献边界。"
        : "如果涉及数字，请补一句口径、周期和你的贡献边界。",
      hasExample
        ? "有具体例子，面试官更容易继续追问。"
        : "再补一个真实例子，会比抽象判断更稳。",
    ];
    setPracticeFeedback(feedback.join("\n"));
  };

  return (
    <aside
      data-testid="presentation-agent-workbench"
      className="flex min-h-0 flex-col border-t border-zinc-200 bg-white lg:border-l lg:border-t-0"
    >
      <header className="border-b border-zinc-100 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-zinc-950 text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-950">面试 PPT Agent</p>
              <p className="text-xs text-zinc-500">
                {diagnosis ? `已诊断 · ${diagnosis.readinessScore}/100` : "正在准备诊断"}
                {slideCount ? ` · ${slideCount} 页` : ""}
              </p>
            </div>
          </div>
          {disabled && <Loader2 className="mt-2 h-4 w-4 animate-spin text-zinc-400" />}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            data-testid="presentation-interview-mode"
            onClick={onEnterInterviewMode}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-zinc-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800"
          >
            <MonitorPlay className="h-3.5 w-3.5" />
            面试模式
          </button>
          <button
            type="button"
            data-testid="presentation-agent-regenerate"
            onClick={onRegenerate}
            disabled={disabled}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            重新生成
          </button>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-zinc-100 p-1">
          {panelTabs.map((tab) => {
            const selected = activePanel === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-testid={`presentation-agent-tab-${tab.id}`}
                onClick={() => setActivePanel(tab.id)}
                className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition ${
                  selected ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-2 text-[11px] leading-5 text-blue-800">
          <MessageSquareText className="mr-1 inline h-3.5 w-3.5" />
          编辑区保留 Agent、对比和练习；进入面试模式后只保留干净投屏。
        </div>

        {notice && (
          <p className="rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1.5 text-xs leading-5 text-emerald-800">
            {notice}
          </p>
        )}

        {agentStatus && (
          <div
            className={`rounded-lg border p-2.5 text-[11px] leading-5 ${
              agentStatus.tone === "working"
                ? "border-violet-100 bg-violet-50 text-violet-800"
                : agentStatus.tone === "review"
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : "border-zinc-200 bg-zinc-50 text-zinc-600"
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold">
              {agentStatus.tone === "working" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
              {agentStatus.label}
            </div>
            <p className="mt-0.5">{agentStatus.detail}</p>
          </div>
        )}

        <ChangeReviewPanel
          changeSet={changeSet ?? null}
          onClear={onClearChangeSet}
          onUndo={onUndoChange}
          onAcceptItem={onAcceptChangeItem}
          onRejectItem={onRejectChangeItem}
        />

        {activePanel === "diagnosis" && (
          <div className="space-y-3">
            <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-zinc-950">
                    {diagnosis?.headline ?? "我会先读完整份 PPT，再给出优先修改建议。"}
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-zinc-500">
                    {diagnosis?.storyLine ?? "生成完成后会自动出现主线、亮点、风险和下一步动作。"}
                  </p>
                </div>
                {diagnosis && (
                  <span className="rounded-full bg-zinc-950 px-2 py-1 text-[10px] font-semibold text-white">
                    {diagnosis.readinessScore}
                  </span>
                )}
              </div>
            </section>

            {diagnosis?.strengths.length ? (
              <section className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  当前最强点
                </div>
                <div className="mt-2 space-y-1.5">
                  {diagnosis.strengths.slice(0, 3).map((item) => (
                    <p key={item} className="text-[11px] leading-5 text-emerald-800">
                      {item}
                    </p>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                建议先做
              </div>
              {suggestions.slice(0, 4).map((item) => {
                const Icon = suggestionIcon(item.kind);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => runSuggestion(item.prompt)}
                    disabled={disabled}
                    className="flex w-full items-start gap-3 rounded-lg border border-zinc-200 bg-white p-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-zinc-950">{item.label}</span>
                      <span className="mt-0.5 block text-[11px] leading-4 text-zinc-500">{item.rationale}</span>
                    </span>
                  </button>
                );
              })}
            </section>

            {activeSlide && (
              <section className="rounded-lg border border-zinc-200 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-zinc-950">当前页 Agent</p>
                    <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                      第 {activeSlide.slideNumber} / {activeSlide.total} 页 · {activeSlide.title}
                    </p>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {currentSlidePrompts.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => runSuggestion(item.prompt)}
                      disabled={disabled}
                      className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-left text-[10px] font-semibold text-zinc-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {diagnosis?.riskFlags.length ? (
              <section className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  面试前确认
                </div>
                <div className="mt-2 space-y-1.5">
                  {diagnosis.riskFlags.slice(0, 3).map((risk) => (
                    <p key={risk.id} className="text-[11px] leading-5 text-amber-800">
                      {risk.label}：{risk.detail}
                    </p>
                  ))}
                </div>
              </section>
            ) : null}

            <button
              type="button"
              data-testid="presentation-agent-ai-enhance"
              onClick={onAIEnhance}
              disabled={disabled}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50"
            >
              <WandSparkles className="h-3.5 w-3.5" />
              AI 精修整套
            </button>
          </div>
        )}

        {activePanel === "chat" && (
          <div className="space-y-3">
            <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              {messages.length === 0 ? (
                <p className="text-xs leading-5 text-zinc-500">生成完成后，我会在这里保留诊断和每次修改记录。</p>
              ) : (
                messages.slice(-10).map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-lg px-3 py-2 ${
                      message.role === "user"
                        ? "ml-6 bg-zinc-950 text-white"
                        : "mr-6 border border-zinc-200 bg-white text-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold opacity-70">
                        {message.role === "user" ? "你" : "Agent"}
                      </span>
                      <span className="text-[10px] opacity-50">{formatTime(message.createdAt)}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-xs leading-5">{message.content}</p>
                  </div>
                ))
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {currentSlidePrompts.slice(0, 2).map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setPrompt(item.prompt)}
                  disabled={disabled}
                  className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 text-[10px] font-medium text-indigo-700 transition hover:border-indigo-300 disabled:opacity-50"
                >
                  {item.label}
                </button>
              ))}
              {suggestions.slice(0, 4).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPrompt(item.prompt)}
                  disabled={disabled}
                  className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-[10px] font-medium text-zinc-500 transition hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-50"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <textarea
                data-testid="presentation-agent-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="例如：只改第 3 页，让它更像真实项目复盘；不要新增事实"
                className="min-h-24 flex-1 resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs leading-5 text-zinc-800 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                disabled={disabled}
              />
              <button
                type="button"
                onClick={submitPrompt}
                disabled={disabled || !prompt.trim()}
                className="flex w-10 items-center justify-center rounded-lg bg-zinc-950 text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                aria-label="发送微调指令"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {activePanel === "practice" && (
          <div className="space-y-3">
            <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
                <Target className="h-3.5 w-3.5 text-indigo-600" />
                面试练习
              </div>
              <p className="mt-1 text-[11px] leading-5 text-zinc-500">
                这些问题来自当前 PPT，适合在投屏前快速过一轮。
              </p>
            </section>

            {(diagnosis?.practiceQuestions ?? []).map((question, index) => (
              <button
                key={`${question}-${index}`}
                type="button"
                onClick={() => {
                  setSelectedPracticeQuestion(question);
                  setPracticeAnswer("");
                  setPracticeFeedback(null);
                }}
                disabled={disabled}
                className={`w-full rounded-lg border p-3 text-left text-xs leading-5 transition disabled:opacity-50 ${
                  selectedPracticeQuestion === question
                    ? "border-indigo-300 bg-indigo-50 text-indigo-800"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-200 hover:bg-indigo-50"
                }`}
              >
                <span className="mr-2 font-semibold text-indigo-600">{index + 1}.</span>
                {question}
              </button>
            ))}

            {selectedPracticeQuestion && (
              <section className="rounded-lg border border-indigo-100 bg-indigo-50/70 p-3">
                <p className="text-xs font-semibold text-indigo-950">模拟追问</p>
                <p className="mt-1 text-xs leading-5 text-indigo-800">{selectedPracticeQuestion}</p>
                <textarea
                  value={practiceAnswer}
                  onChange={(event) => {
                    setPracticeAnswer(event.target.value);
                    setPracticeFeedback(null);
                  }}
                  placeholder="先把你的回答写在这里，我会从结构、可信度和追问风险给反馈。"
                  className="mt-3 min-h-24 w-full resize-y rounded-lg border border-indigo-100 bg-white px-3 py-2 text-xs leading-5 text-zinc-800 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={evaluatePracticeAnswer}
                    disabled={!practiceAnswer.trim()}
                    className="rounded-lg bg-zinc-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:bg-zinc-300"
                  >
                    评价回答
                  </button>
                  <button
                    type="button"
                    onClick={() => runSuggestion(`把这个追问和回答要点写入讲稿备注：${selectedPracticeQuestion}`)}
                    disabled={disabled}
                    className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-white/80 disabled:opacity-50"
                  >
                    写入讲稿
                  </button>
                </div>
                {practiceFeedback && (
                  <p className="mt-3 whitespace-pre-wrap rounded-lg bg-white px-3 py-2 text-[11px] leading-5 text-zinc-700">
                    {practiceFeedback}
                  </p>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
