"use client";

import { useState } from "react";
import {
  Bot,
  FileText,
  Loader2,
  MessageSquareText,
  MonitorPlay,
  RefreshCw,
  Send,
  SlidersHorizontal,
  Sparkles,
  Target,
  WandSparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { ChangeReviewPanel } from "@/components/agent-workbench/change-review-panel";
import type { AgentChangeSet } from "@/lib/agent/change-diff";

interface PresentationAgentWorkbenchProps {
  disabled?: boolean;
  notice?: string | null;
  slideCount?: number;
  changeSet?: AgentChangeSet | null;
  onPrompt: (prompt: string) => void;
  onAIEnhance: () => void;
  onRegenerate: () => void;
  onEnterInterviewMode: () => void;
  onClearChangeSet?: () => void;
  onUndoChange?: () => void;
}

type WorkbenchPanel = "quick" | "chat";

const panelTabs: Array<{ id: WorkbenchPanel; label: string; icon: LucideIcon }> = [
  { id: "quick", label: "建议", icon: Zap },
  { id: "chat", label: "微调", icon: MessageSquareText },
];

const presetPrompts = [
  {
    id: "agent",
    label: "突出 AI Agent 能力",
    result: "把核心竞争力前置，让项目故事更有记忆点",
    icon: Bot,
  },
  {
    id: "six-pages",
    label: "压缩到 6 页",
    result: "适合 3-5 分钟快速自我介绍",
    icon: SlidersHorizontal,
  },
  {
    id: "pm",
    label: "更适合产品经理面试",
    result: "强调问题判断、方案设计和业务结果",
    icon: Target,
  },
  {
    id: "metrics",
    label: "强化数据成果",
    result: "补强指标、影响范围和可量化证据",
    icon: Sparkles,
  },
  {
    id: "business",
    label: "换成更商务风格",
    result: "降低技术细节密度，提升表达的管理感",
    icon: FileText,
  },
];

const primaryPrompts = presetPrompts.slice(0, 3);
const secondaryPrompts = presetPrompts.slice(3);

export function PresentationAgentWorkbench({
  disabled,
  notice,
  slideCount,
  changeSet,
  onPrompt,
  onAIEnhance,
  onRegenerate,
  onEnterInterviewMode,
  onClearChangeSet,
  onUndoChange,
}: PresentationAgentWorkbenchProps) {
  const [activePanel, setActivePanel] = useState<WorkbenchPanel>("quick");
  const [prompt, setPrompt] = useState("");

  const submitPrompt = () => {
    const clean = prompt.trim();
    if (!clean || disabled) return;
    onPrompt(clean);
    setPrompt("");
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
              <p className="text-sm font-semibold text-zinc-950">PPT 微调 Agent</p>
              <p className="text-xs text-zinc-500">
                第一版已生成{slideCount ? ` · ${slideCount} 页` : ""}，先预览再精修
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

        <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-zinc-100 p-1">
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
          准备模式下可以看 Agent；进入面试模式后会隐藏全部编辑和对话入口。
        </div>

        {notice && (
          <p className="rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1.5 text-xs leading-5 text-emerald-800">
            {notice}
          </p>
        )}

        <ChangeReviewPanel
          changeSet={changeSet ?? null}
          onClear={onClearChangeSet}
          onUndo={onUndoChange}
        />

        {activePanel === "quick" && (
          <div className="space-y-2">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
                <Sparkles className="h-3.5 w-3.5" />
                推荐先做这几步
              </div>
              <p className="mt-1 text-[11px] leading-4 text-amber-800/80">
                先从影响面最大的三处动刀：卖点、页数、表达节奏。
              </p>
            </div>

            {primaryPrompts.map((item) => (
              <button
                key={item.id}
                type="button"
                data-testid={`preset-${item.id}`}
                onClick={() => onPrompt(item.label)}
                disabled={disabled}
                className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
                  <item.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-zinc-950">{item.label}</span>
                  <span className="mt-0.5 block text-[11px] leading-4 text-zinc-500">{item.result}</span>
                </span>
              </button>
            ))}

            <div className="grid grid-cols-2 gap-2">
              {secondaryPrompts.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`preset-${item.id}`}
                  onClick={() => onPrompt(item.label)}
                  disabled={disabled}
                  className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-left text-[11px] font-semibold text-zinc-700 transition hover:border-indigo-200 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <item.icon className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                  {item.label}
                </button>
              ))}
            </div>

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
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800">
              <MessageSquareText className="h-3.5 w-3.5 text-indigo-600" />
              用一句话改这版 PPT
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {presetPrompts.slice(0, 4).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPrompt(item.label)}
                  disabled={disabled}
                  className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-[10px] font-medium text-zinc-500 transition hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-50"
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <textarea
                data-testid="presentation-agent-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="比如：把开场讲得更有冲击力，弱化早期经历，突出平台产品能力"
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

      </div>
    </aside>
  );
}
