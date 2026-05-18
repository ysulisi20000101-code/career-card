"use client";

import { GitCompareArrows, RotateCcw, X } from "lucide-react";
import type { AgentChangeSet } from "@/lib/agent/change-diff";

interface ChangeReviewPanelProps {
  changeSet: AgentChangeSet | null;
  onClear?: () => void;
  onUndo?: () => void;
}

function ChangeText({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-zinc-400">{label}</p>
      <p className="mt-1 max-h-20 overflow-y-auto whitespace-pre-wrap rounded-md bg-white px-2 py-1.5 text-[11px] leading-5 text-zinc-600">
        {value}
      </p>
    </div>
  );
}

export function ChangeReviewPanel({ changeSet, onClear, onUndo }: ChangeReviewPanelProps) {
  if (!changeSet) return null;

  return (
    <section data-testid="agent-change-review" className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-white">
            <GitCompareArrows className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-xs font-semibold text-indigo-950">本次修改对比</p>
            <p className="mt-0.5 text-[11px] leading-4 text-indigo-700">{changeSet.summary}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {onUndo && (
            <button
              type="button"
              onClick={onUndo}
              className="rounded-full p-1 text-indigo-500 transition hover:bg-white hover:text-indigo-800"
              aria-label="撤回本次修改"
              title="撤回本次修改"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-full p-1 text-indigo-500 transition hover:bg-white hover:text-indigo-800"
              aria-label="收起修改对比"
              title="收起修改对比"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {changeSet.items.length === 0 ? (
        <p className="mt-3 rounded-md bg-white px-2 py-2 text-xs text-zinc-500">
          这次没有检测到结构化内容差异，可能只是重新保存或生成结果保持一致。
        </p>
      ) : (
        <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
          {changeSet.items.map((item) => (
            <div key={item.id} className="rounded-lg border border-indigo-100 bg-indigo-50/80 p-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold text-zinc-800">{item.label}</p>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-zinc-500">
                  {item.kind === "added" ? "新增" : item.kind === "removed" ? "删除" : "修改"}
                </span>
              </div>
              <div className="mt-2 grid gap-2">
                <ChangeText label="修改前" value={item.before} />
                <ChangeText label="修改后" value={item.after} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
