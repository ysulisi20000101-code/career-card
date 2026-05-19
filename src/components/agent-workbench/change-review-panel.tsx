"use client";

import { AlertTriangle, Check, GitCompareArrows, RotateCcw, Undo2, X } from "lucide-react";
import type { AgentChangeItem, AgentChangeSet } from "@/lib/agent/change-diff";

interface ChangeReviewPanelProps {
  changeSet: AgentChangeSet | null;
  onClear?: () => void;
  onUndo?: () => void;
  onAcceptItem?: (itemId: string) => void;
  onRejectItem?: (item: AgentChangeItem) => void;
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

function categoryLabel(category: AgentChangeItem["category"]): string {
  if (category === "structure") return "结构";
  if (category === "visual") return "视觉";
  if (category === "notes") return "讲稿";
  if (category === "risk") return "风险";
  return "内容";
}

export function ChangeReviewPanel({
  changeSet,
  onClear,
  onUndo,
  onAcceptItem,
  onRejectItem,
}: ChangeReviewPanelProps) {
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
          这次修改已经全部确认，当前没有待审阅的变更。
        </p>
      ) : (
        <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
          {changeSet.riskFlags && changeSet.riskFlags.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-[11px] leading-5 text-amber-900">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="h-3.5 w-3.5" />
                需要确认的事实表达
              </div>
              <ul className="mt-1 space-y-1">
                {changeSet.riskFlags.slice(0, 3).map((risk) => (
                  <li key={risk.id}>{risk.detail}</li>
                ))}
              </ul>
            </div>
          )}

          {changeSet.items.map((item) => (
            <div key={item.id} className="rounded-lg border border-indigo-100 bg-indigo-50/80 p-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold text-zinc-800">{item.label}</p>
                  {item.reason && <p className="mt-0.5 text-[10px] leading-4 text-zinc-500">{item.reason}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {item.riskLevel && item.riskLevel !== "none" && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                      需确认
                    </span>
                  )}
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-zinc-500">
                    {categoryLabel(item.category)}
                  </span>
                </div>
              </div>
              <div className="mt-2 grid gap-2">
                <ChangeText label="修改前" value={item.before} />
                <ChangeText label="修改后" value={item.after} />
              </div>
              {(onAcceptItem || onRejectItem) && (
                <div className="mt-2 flex items-center justify-end gap-1.5">
                  {onRejectItem && (
                    <button
                      type="button"
                      onClick={() => onRejectItem(item)}
                      className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 py-1 text-[10px] font-semibold text-zinc-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <Undo2 className="h-3 w-3" />
                      撤回此项
                    </button>
                  )}
                  {onAcceptItem && (
                    <button
                      type="button"
                      onClick={() => onAcceptItem(item.id)}
                      className="inline-flex items-center gap-1 rounded-full bg-zinc-950 px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-zinc-800"
                    >
                      <Check className="h-3 w-3" />
                      接受
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
