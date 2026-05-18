"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Bot,
  Clock3,
  FileCheck2,
  FileWarning,
  MessageSquareText,
  Pencil,
  Presentation,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import { PDFUpload } from "./pdf-upload";
import { useResumeStore } from "@/store/resume-store";
import { extractPdfText, ParseError } from "@/lib/parser/pdf-parser";
import { parseResumeText } from "@/lib/parser/resume-parser";
import type { ResumeData } from "@/types";
import { trackEvent } from "@/lib/events/client";
import { Button } from "@/components/ui/button";
import type { ParseStats } from "@/types";

interface FailureInfo {
  message: string;
  code: ParseError["code"] | "PARSE_INSUFFICIENT" | "UNKNOWN" | "FILE_TOO_LARGE" | "INVALID_TYPE";
}

interface UploadPageProps {
  onParsed?: () => void;
  variant?: "career" | "interview";
}

const careerUploadNotes = [
  { icon: FileCheck2, label: "格式", value: "文本型 PDF，最大 10MB" },
  { icon: Clock3, label: "耗时", value: "通常 10-30 秒完成解析" },
  { icon: ShieldCheck, label: "用途", value: "仅用于生成职业档案草稿" },
  { icon: Trash2, label: "控制", value: "草稿和发布链接可删除或撤回" },
];

const interviewUploadNotes = [
  { icon: FileCheck2, label: "输入", value: "上传简历 PDF，系统直接生成演示 PPT" },
  { icon: Clock3, label: "反馈", value: "解析完成后自动进入故事演示" },
  { icon: ShieldCheck, label: "输出", value: "只生成自我介绍主线演示" },
  { icon: Trash2, label: "微调", value: "进入演示页后可用 Chat 调整风格和重点" },
];

const interviewFlow = [
  { icon: FileCheck2, title: "上传简历", body: "只需要一份 PDF" },
  { icon: Presentation, title: "自动成稿", body: "直接进入第一版 PPT" },
  { icon: MessageSquareText, title: "对话微调", body: "用指令改重点和风格" },
  { icon: Sparkles, title: "投屏演示", body: "隐藏编辑入口，专注讲述主线" },
];

const interviewPreviewSlides = [
  "开场定位",
  "项目故事",
  "能力证据",
  "收束总结",
];

function getFriendlyUploadError(err: unknown): FailureInfo {
  const rawCode: FailureInfo["code"] = err instanceof ParseError ? err.code : "UNKNOWN";
  const rawMessage = err instanceof Error ? err.message : "";
  const lower = rawMessage.toLowerCase();

  if (rawCode === "EMPTY_TEXT" || lower.includes("no text") || lower.includes("empty")) {
    return {
      code: rawCode,
      message: "这份 PDF 没有读取到可解析文字。请上传文本型 PDF，或从 Word 重新导出 PDF。",
    };
  }

  if (
    rawCode === "WORKER_INIT" ||
    lower.includes("worker") ||
    lower.includes("requested file or directory") ||
    lower.includes("could not be found")
  ) {
    return {
      code: rawCode,
      message: "PDF 解析器没有成功读取文件。请重新选择文件，或换一份文本型 PDF 再试。",
    };
  }

  return {
    code: rawCode,
    message: rawMessage || "简历解析失败，请换一份文本型 PDF 后重试。",
  };
}

export function UploadPage({ onParsed, variant = "career" }: UploadPageProps = {}) {
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

      // Validate file type
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        setFailure({ code: "INVALID_TYPE", message: "请上传 PDF 格式的简历文件。" });
        return;
      }

      // Validate file size (10MB max)
      const MAX_FILE_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        setFailure({ code: "FILE_TOO_LARGE", message: "文件大小超过 10MB 限制，请选择更小的文件。" });
        return;
      }

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

        const parseStart = performance.now();
        const { data, stats, confidence } = parseResumeText(text, file.name);
        const parseDurationMs = Math.round(performance.now() - parseStart);
        if (cancelRef.current) return;
        tickProgress(95);

        setResumeData(data);
        setParseMeta({ stats, confidence });
        setLastStats(stats);
        trackEvent("resume_parse_succeeded", "edit", {
          parse_duration_ms: parseDurationMs,
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
          if (onParsed) onParsed();
          else setCurrentStep("confirm");
        }, 250);
      } catch (err) {
        const failureInfo = getFriendlyUploadError(err);
        trackEvent("resume_parse_failed", "edit", {
          error_code: failureInfo.code,
          error_message: err instanceof Error ? err.message : failureInfo.message,
        });
        setFailure(failureInfo);
        setParseMeta(null);
        setIsProcessing(false);
        setProgress(0);
      }
    },
    [setResumeData, setParseMeta, setCurrentStep, tickProgress, onParsed],
  );

  const handleRetry = useCallback(() => {
    cancelRef.current = true;
    setFailure(null);
    setParseMeta(null);
    setProgress(0);
    setIsProcessing(false);
  }, [setParseMeta]);

  const handleManualCreate = useCallback(() => {
    const emptyData: ResumeData = {
      profile: { id: "", name: "", email: "" },
      timeline: [],
      skills: [],
      education: [],
      architecture: [],
      roleUnderstanding: {
        targetRoleTitle: "",
        oneLineInterpretation: "",
        priorityProblems: [],
        ninetyDayPlan: { day0To30: "", day31To60: "", day61To90: "" },
        experienceMappings: [],
      },
    };
    setResumeData(emptyData);
    setParseMeta(null);
    setCurrentStep(variant === "interview" ? "edit" : "confirm");
  }, [setResumeData, setParseMeta, setCurrentStep, variant]);

  const isInterview = variant === "interview";
  const uploadNotes = isInterview ? interviewUploadNotes : careerUploadNotes;
  const badgeText = isInterview ? "上传即生成 · 第一版 PPT 自动完成" : "本地解析 · 文本型 PDF";
  const title = isInterview ? "上传简历，立刻生成面试故事 PPT" : "Career Card";
  const description = isInterview
    ? "不需要先填表，也不需要再点生成。上传后我会直接提炼故事线、亮点证据和演示结构，把第一版 PPT 做出来。"
    : "上传简历 PDF，先生成职业档案草稿；下一步只需要校准关键信息和表达重点。";

  const uploadSurface = failure ? (
    <div className="rounded-lg border border-red-200 bg-red-50/80 p-6 text-center shadow-sm dark:border-red-900/40 dark:bg-red-950/30">
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
    <PDFUpload onUpload={handleUpload} isProcessing={isProcessing} progress={progress} variant={variant} />
  );

  if (isInterview) {
    return (
      <div className="min-h-screen bg-[#f7f7f4] text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
        <div className="mx-auto grid min-h-screen w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-center lg:px-8">
          <motion.section
            data-testid="interview-upload-hero"
            className="pt-8 lg:pt-0"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              <Sparkles className="h-3.5 w-3.5" />
              {badgeText}
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-zinc-950 sm:text-5xl dark:text-zinc-50">
              <span className="block">上传简历，立刻生成</span>
              <span className="block">面试故事 PPT</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
              {description}
            </p>

            <div className="mt-8 grid gap-2 sm:grid-cols-4">
              {interviewFlow.map((step, index) => (
                <div key={step.title} className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950">
                      <step.icon className="h-4 w-4" />
                    </span>
                    {index < interviewFlow.length - 1 && <ArrowRight className="hidden h-4 w-4 text-zinc-300 sm:block" />}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-zinc-950 dark:text-zinc-50">{step.title}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{step.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_220px]">
              <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                  <Presentation className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                  第一版会先完整生成
                </div>
                <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                  先给你一套可以翻页演示的成稿；后续再把重点、页数和表达节奏调准。
                </p>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {interviewPreviewSlides.map((slide, index) => (
                    <div key={slide} className="aspect-[4/3] rounded-md border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-950">
                      <div className="h-1.5 w-8 rounded-full bg-indigo-500/80" />
                      <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-700" />
                      <div className="mt-1.5 h-1.5 w-2/3 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                      <p className="mt-3 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                        {index + 1}. {slide}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                  <Bot className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                  进入后怎么改
                </div>
                <div className="mt-3 space-y-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                  <p>“压缩到 6 页”</p>
                  <p>“更像产品经理面试”</p>
                  <p>“把开场改得更像产品负责人面试”</p>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            className="pb-8 lg:pb-0"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.45, ease: "easeOut" }}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">开始生成</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">上传成功后会自动进入 PPT 工作台</p>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                无需二次点击
              </span>
            </div>
            {uploadSurface}
            <div className="mt-3 flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 rounded-full text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                onClick={handleManualCreate}
                disabled={isProcessing}
              >
                <Pencil className="h-3.5 w-3.5" />
                手动创建空白项目
              </Button>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">PDF · 10MB 以内</p>
            </div>
            {lastStats && (
              <motion.p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/25 dark:text-emerald-300" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                已识别：{lastStats.detectedTimelineCount} 段经历 · {lastStats.detectedEducationCount} 项教育 ·{" "}
                {lastStats.detectedSkillCount} 个技能 · {lastStats.textLength} 字文本
              </motion.p>
            )}
          </motion.section>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white dark:bg-zinc-950">
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
            {badgeText}
          </motion.div>

          <motion.h1
            className="bg-gradient-to-r from-zinc-900 via-indigo-800 to-violet-800 bg-clip-text text-5xl font-bold text-transparent sm:text-6xl dark:from-zinc-100 dark:via-indigo-300 dark:to-violet-300"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {title}
          </motion.h1>

          <motion.p
            className="mx-auto mt-4 max-w-md text-base leading-relaxed text-zinc-500 dark:text-zinc-400"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
          >
            {description}
          </motion.p>
        </motion.div>

        <motion.div
          className="w-full max-w-lg"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {uploadSurface}
        </motion.div>

        <motion.div
          className="mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 rounded-full text-xs text-zinc-500 hover:text-zinc-700"
            onClick={handleManualCreate}
            disabled={isProcessing}
          >
            <Pencil className="h-3.5 w-3.5" />
            {isInterview ? "先手动创建，再生成演示" : "不上传，手动填写"}
          </Button>
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
          {isInterview
            ? "第一版会先快速生成；进入演示页后可以用预设指令或 Chat 继续微调。"
            : "若 PDF 模板复杂导致识别不完整，可在确认页低成本修改；原始内容不会在未确认前覆盖你的草稿。"}
        </motion.p>
      </div>
    </div>
  );
}
