"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageFooterNavProps {
  onPrev?: () => void;
  onNext?: () => void;
  prevLabel?: string;
  nextLabel?: string;
  disablePrev?: boolean;
  disableNext?: boolean;
  hint?: string;
  contained?: boolean;
}

export function PageFooterNav({
  onPrev,
  onNext,
  prevLabel = "上一步",
  nextLabel = "下一步",
  disablePrev,
  disableNext,
  hint,
  contained = false,
}: PageFooterNavProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-6 py-3",
        contained && "mx-auto w-full max-w-6xl",
      )}
    >
      <Button
        variant="ghost"
        size="sm"
        disabled={disablePrev}
        onClick={onPrev}
        className="gap-1.5 rounded-full"
      >
        <ChevronLeft className="h-4 w-4" />
        {prevLabel}
      </Button>

      {hint && (
        <div className="hidden text-xs text-muted-foreground sm:block">{hint}</div>
      )}

      <Button
        variant="brand"
        size="sm"
        disabled={disableNext}
        onClick={onNext}
        className="gap-1.5 rounded-full"
      >
        {nextLabel}
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
