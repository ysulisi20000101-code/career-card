import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  href?: string;
  className?: string;
  size?: "sm" | "md";
}

export function BrandLogo({ href = "/", className, size = "md" }: BrandLogoProps) {
  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-bold",
        size === "md" ? "text-base" : "text-sm",
        className,
      )}
    >
      <span className="relative inline-flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/30">
        <Sparkles className="h-3.5 w-3.5" />
      </span>
      <span className="brand-gradient-text">职场名片</span>
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} className="inline-flex shrink-0">
      {content}
    </Link>
  );
}
