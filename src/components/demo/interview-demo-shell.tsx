"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { PresentationDraft } from "@/lib/presentation/types";
import { generatePresentationDraft } from "@/lib/presentation/generator";
import { deletePresentationDraft } from "@/lib/presentation/storage";
import { mockInterviewResumeData } from "@/lib/mock-interview-data";
import { PresentationShell } from "@/components/presentation/story-deck/presentation-shell";

export function InterviewDemoShell() {
  const router = useRouter();
  const [draft, setDraft] = useState<PresentationDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const generated = generatePresentationDraft(mockInterviewResumeData);
      setDraft(generated);
    } catch (err) {
      console.error("[career-card] Interview demo generation failed:", err);
      setError(err instanceof Error ? err.message : "生成演示稿失败，请刷新重试");
    }
  }, []);

  // Clean up demo data from localStorage on unmount
  useEffect(() => {
    return () => {
      if (draft) {
        try {
          deletePresentationDraft(draft.id);
        } catch {
          // Best-effort cleanup
        }
      }
    };
  }, [draft]);

  const handleExit = () => {
    router.push("/profile");
  };

  if (error) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fafafa",
          color: "#52525b",
          fontSize: 14,
          fontFamily: "inherit",
          gap: 12,
        }}
      >
        <AlertTriangle style={{ width: 32, height: 32, color: "#f59e0b" }} />
        <p>{error}</p>
        <button
          onClick={() => router.push("/profile")}
          style={{
            marginTop: 8,
            padding: "8px 20px",
            borderRadius: 9999,
            border: "none",
            background: "#6366f1",
            color: "#fff",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          返回样例页
        </button>
      </div>
    );
  }

  if (!draft) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fafafa",
          color: "#52525b",
          fontSize: 14,
          fontFamily: "inherit",
          gap: 12,
        }}
      >
        <Loader2
          style={{ width: 28, height: 28, animation: "spin 1s linear infinite", color: "#6366f1" }}
        />
        <span>正在生成面试演示稿…</span>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Demo mode badge */}
      <div
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 14px",
          borderRadius: 9999,
          background: "rgba(99,102,241,0.12)",
          border: "1px solid rgba(99,102,241,0.25)",
          color: "#4f46e5",
          fontSize: 12,
          fontWeight: 500,
          backdropFilter: "blur(8px)",
        }}
      >
        <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#6366f1" }} />
        演示模式 · Demo
      </div>
      <PresentationShell draft={draft} onExit={handleExit} />
    </div>
  );
}
