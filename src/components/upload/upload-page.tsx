"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Clock3, FileCheck2, FileWarning, RotateCcw, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { PDFUpload } from "./pdf-upload";
import { useResumeStore } from "@/store/resume-store";
import { extractPdfText, ParseError } from "@/lib/parser/pdf-parser";
import { parseResumeText } from "@/lib/parser/resume-parser";
import { trackEvent } from "@/lib/events/client";
import { Button } from "@/components/ui/button";
import type { ParseStats } from "@/types";

interface FailureInfo {
  message: string;
  code: ParseError["code"] | "PARSE_INSUFFICIENT" | "UNKNOWN";
}

const uploadNotes = [
  { icon: FileCheck2, label: "格式", value: "文本型 PDF，最大 10MB" },
  { icon: Clock3, label: "耗时", value: "通常 10-30 秒完成解析" },
  { icon: ShieldCheck, label: "用途", value: "仅用于生成职业档案草稿" },
  { icon: Trash2, label: "控制", value: "草稿和发布链接可删除或撤回" },
];

export function UploadPage() {
  const setResumeData = useResumeStore((state) => state.setResumeData);
  const setParseMeta = useResumeStore((state) => state.setParseMeta);
  const setCurrentStep = useResumeStore((state) => state.setCurrentStep);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failure, setFailure] = useState<FailureInfo | null>(null);
  const [lastStats, setLastStats] = useState<ParseStats | null>(null);
  const cancelRef = useRef(false);

  const tickProgress = useCallback((to: number) => {
    setProgress((prev) => Math.max(prev, to));
  }, []);

  const handleUpload = useCallback(
    async (file: File) => {
      setFailure(null);
      setLastStats(null);
      setParseMeta(null);
      setIsProcessing(true);
      setProgress(5);
      cancelRef.current = false;

      try {
        trackEvent("resume_upload_started", "edit", {
          file_size: file.size,
          file_type: file.type || "application/pdf",
        });
        tickProgress(15);
        const text = await extractPdfText(file);
        if (cancelRef.current) return;
        tickProgress(70);

        const { data, stats, confidence } = parseResumeText(text, file.name);
        if (cancelRef.current) return;
        tickProgress(95);

        setResumeData(data);
        setParseMeta({ stats, confidence });
        setLastStats(stats);
        trackEvent("resume_parse_succeeded", "edit", {
          parse_duration_ms: 0,
          timeline_count: stats.detectedTimelineCount,
          skill_count: stats.detectedSkillCount,
          education_count: stats.detectedEducationCount,
        });
        void fetch("/api/resume-sources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type || "application/pdf",
            textLength: stats.textLength,
            parseStatus: "succeeded",
          }),
        }).catch(() => undefined);
        tickProgress(100);
        setTimeout(() => {
          setIsProcessing(false);
          setCurrentStep("confirm");
        }, 250);
      } catch (err) {
        const code: FailureInfo["code"] = err instanceof ParseError ? err.code : "UNKNOWN";
        const message = err instanceof Error ? err.message : "未知错误，请重试";
        trackEvent("resume_parse_failed", "edit", {
          error_code: code,
          error_message: message,
        });
        setFailure({ code, message });
        setParseMeta(null);
        setIsProcessing(false);
        setProgress(0);
      }
    },
    [setResumeData, setParseMeta, setCurrentStep, tickProgress],
  );

  const handleRetry = useCallback(() => {
    cancelRef.current = true;
    setFailure(null);
    setParseMeta(null);
    setProgress(0);
    setIsProcessing(false);
  }, [setParseMeta]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-white dark:bg-zinc-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-1/4 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-200/40 via-violet-200/30 to-transparent blur-3xl dark:from-indigo-900/20 dark:via-violet-900/15" />
        <div className="absolute -bottom-1/4 right-0 h-[400px] w-[400px] rounded-full bg-gradient-to-tl from-rose-200/30 via-amber-200/20 to-transparent blur-3xl dark:from-rose-900/15 dark:via-amber-900/10" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-20">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-indigo-50/60 px-4 py-1.5 text-xs font-medium text-indigo-600 dark:border-indigo-800/40 dark:bg-indigo-950/40 dark:text-indigo-400"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            本地解析 · 文本型 PDF
          </motion.div>

          <motion.h1
            className="bg-gradient-to-r from-zinc-900 via-indigo-800 to-violet-800 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl dark:from-zinc-100 dark:via-indigo-300 dark:to-violet-300"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            职场名片
          </motion.h1>

          <motion.p
            className="mx-auto mt-4 max-w-md text-base leading-relaxed text-zinc-500 dark:text-zinc-400"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
          >
            上传简历 PDF，先生成职业档案草稿；下一步只需要校准关键信息和表达重点。
          </motion.p>
        </motion.div>

        <motion.div
          className="w-full max-w-lg"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {failure ? (
            <div className="rounded-2xl border border-red-200 bg-red-50/70 p-6 text-center shadow-sm dark:border-red-900/40 dark:bg-red-950/30">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300">
                {failure.code === "EMPTY_TEXT" ? <FileWarning className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
              </div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">解析失败</p>
              <p className="mt-1 text-xs text-red-600/80 dark:text-red-400/80">{failure.message}</p>
              <p className="mt-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                建议：使用文本型 PDF，避免扫描件或截图；也可以从 Word 重新导出 PDF。
              </p>
              <Button size="sm" variant="outline" className="mt-4 gap-1.5" onClick={handleRetry}>
                <RotateCcw className="h-3.5 w-3.5" />
                重新选择文件
              </Button>
            </div>
          ) : (
            <PDFUpload onUpload={handleUpload} isProcessing={isProcessing} progress={progress} />
          )}
        </motion.div>

        <div className="mt-6 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
          {uploadNotes.map((note) => (
            <div key={note.label} className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-white/75 p-3 text-left shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                <note.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">{note.label}</p>
                <p className="text-[11px] leading-5 text-zinc-500 dark:text-zinc-400">{note.value}</p>
              </div>
            </div>
          ))}
        </div>

        {lastStats && (
          <motion.p className="mt-6 text-xs text-emerald-600 dark:text-emerald-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            已识别：{lastStats.detectedTimelineCount} 段工作经历 · {lastStats.detectedEducationCount} 项教育背景 ·{" "}
            {lastStats.detectedSkillCount} 个技能 · 文本 {lastStats.textLength} 字
          </motion.p>
        )}

        <motion.p className="mt-10 text-xs text-zinc-400 dark:text-zinc-600" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.6 }}>
          若 PDF 模板复杂导致识别不完整，可在确认页低成本修改；原始内容不会在未确认前覆盖你的草稿。
        </motion.p>
      </div>
    </div>
  );
}
