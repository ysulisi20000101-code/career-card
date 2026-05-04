"use client";

import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

export interface StepItem<T extends string = string> {
  key: T;
  label: string;
  icon?: ComponentType<{ className?: string }>;
}

interface StepIndicatorProps<T extends string> {
  steps: StepItem<T>[];
  current: T;
  onStepClick?: (step: T) => void;
  className?: string;
}

export function StepIndicator<T extends string>({
  steps,
  current,
  onStepClick,
  className,
}: StepIndicatorProps<T>) {
  const currentIdx = steps.findIndex((s) => s.key === current);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {steps.map((step, i) => {
        const isActive = i === currentIdx;
        const isCompleted = i < currentIdx;
        const isClickable = i <= currentIdx;
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex items-center">
            <button
              onClick={() => {
                if (isClickable && onStepClick) onStepClick(step.key);
              }}
              disabled={!isClickable}
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "group flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                isActive
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-500/30"
                  : isCompleted
                    ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                    : "text-zinc-400",
                isClickable && !isActive && "cursor-pointer",
                !isClickable && "cursor-not-allowed",
              )}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{step.label}</span>
            </button>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-px w-4 transition-colors",
                  isCompleted ? "bg-indigo-200" : "bg-zinc-200",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
