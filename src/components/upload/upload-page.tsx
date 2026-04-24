"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, AlertCircle, RotateCcw, FileWarning } from "lucide-react";
import { PDFUpload } from "./pdf-upload";
import { useResumeStore } from "@/store/resume-store";
import { extractPdfText, ParseError } from "@/lib/parser/pdf-parser";
import { parseResumeText } from "@/lib/parser/resume-parser";
import { Button } from "@/components/ui/button";
import type { ParseStats } from "@/types";

interface FailureInfo {
  message: string;
  code: ParseError["code"] | "PARSE_INSUFFICIENT" | "UNKNOWN";
}

export function UploadPage() {
  const setResumeData = useResumeStore((s) => s.setResumeData);
  const setParseMeta = useResumeStore((s) => s.setParseMeta);
  const setCurrentStep = useResumeStore((s) => s.setCurrentStep);

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
        tickProgress(15);
        const text = await extractPdfText(file);
        if (cancelRef.current) return;
        tickProgress(70);

        const { data, stats, confidence } = parseResumeText(text, file.name);
        if (cancelRef.current) return;
        tickProgress(95);

        if (
          stats.detectedTimelineCount === 0 &&
          stats.detectedEducationCount === 0 &&
          stats.detectedSkillCount === 0
        ) {
          throw new ParseError(
            "EMPTY_TEXT",
            "未识别到结构化的工作经历/教育/技能信息，请确认 PDF 是文本型简历",
          );
        }

        setResumeData(data);
        setParseMeta({ stats, confidence });
        setLastStats(stats);
        tickProgress(100);
        setTimeout(() => {
          setIsProcessing(false);
          setCurrentStep("confirm");
        }, 250);
      } catch (err) {
        const code: FailureInfo["code"] =
          err instanceof ParseError ? err.code : "UNKNOWN";
        const message =
          err instanceof Error ? err.message : "未知错误，请重试";
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
            真实解析 · 文本型 PDF
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
            上传你的简历 PDF，自动抽取文本并构建结构化职业名片
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
                {failure.code === "EMPTY_TEXT" ? (
                  <FileWarning className="h-6 w-6" />
                ) : (
                  <AlertCircle className="h-6 w-6" />
                )}
              </div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                解析失败
              </p>
              <p className="mt-1 text-xs text-red-600/80 dark:text-red-400/80">
                {failure.message}
              </p>
              <p className="mt-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                建议：使用文本型 PDF（非扫描件/截图），或导出 Word 后重新打印为 PDF
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4 gap-1.5"
                onClick={handleRetry}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                重新选择文件
              </Button>
            </div>
          ) : (
            <PDFUpload
              onUpload={handleUpload}
              isProcessing={isProcessing}
              progress={progress}
            />
          )}
        </motion.div>

        {lastStats && (
          <motion.p
            className="mt-6 text-xs text-emerald-600 dark:text-emerald-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            已识别：{lastStats.detectedTimelineCount} 段工作经历 ·{" "}
            {lastStats.detectedEducationCount} 项教育背景 ·{" "}
            {lastStats.detectedSkillCount} 个技能 · 文本 {lastStats.textLength} 字
          </motion.p>
        )}

        <motion.p
          className="mt-10 text-xs text-zinc-400 dark:text-zinc-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          解析全程在浏览器本地执行，文件不会上传服务器
        </motion.p>
      </div>
    </div>
  );
}
