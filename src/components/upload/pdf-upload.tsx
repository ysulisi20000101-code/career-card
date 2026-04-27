"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PDFUploadProps {
  onUpload: (file: File) => void;
  isProcessing?: boolean;
  progress?: number;
}

type UploadState = "idle" | "dragging" | "uploading" | "success" | "error";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

export function PDFUpload({
  onUpload,
  isProcessing = false,
  progress = 0,
}: PDFUploadProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadState: UploadState = isProcessing ? "uploading" : state;

  const validateAndUpload = useCallback(
    (file: File) => {
      if (!isPdfFile(file)) {
        setState("error");
        setErrorMessage("请上传PDF格式文件");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setState("error");
        setErrorMessage("文件大小不能超过10MB");
        return;
      }

      setSelectedFile(file);
      setState("success");
      setErrorMessage("");
      onUpload(file);
    },
    [onUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files[0];
      if (file) validateAndUpload(file);
    },
    [validateAndUpload],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setState("dragging");
    },
    [],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setState((prev) => (prev === "dragging" ? "idle" : prev));
    },
    [],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndUpload(file);
    },
    [validateAndUpload],
  );

  const reset = useCallback(() => {
    setState("idle");
    setErrorMessage("");
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto">
      <motion.div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => uploadState === "idle" && inputRef.current?.click()}
        className={cn(
          "relative overflow-hidden rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
          "cursor-pointer select-none",
          uploadState === "idle" &&
            "border-zinc-300 bg-zinc-50/50 hover:border-indigo-400 hover:bg-indigo-50/40 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/30",
          uploadState === "dragging" &&
            "border-indigo-500 bg-indigo-50/60 dark:border-indigo-400 dark:bg-indigo-950/40",
          uploadState === "uploading" &&
            "pointer-events-none border-indigo-400 bg-indigo-50/30 dark:border-indigo-500 dark:bg-indigo-950/20",
          uploadState === "success" &&
            "border-emerald-400 bg-emerald-50/40 dark:border-emerald-500 dark:bg-emerald-950/30",
          uploadState === "error" &&
            "border-red-400 bg-red-50/40 dark:border-red-500 dark:bg-red-950/30",
        )}
        whileHover={uploadState === "idle" ? { scale: 1.01 } : undefined}
        whileTap={uploadState === "idle" ? { scale: 0.99 } : undefined}
      >
        {/* Progress bar background fill */}
        {uploadState === "uploading" && (
          <motion.div
            className="absolute inset-0 origin-left bg-indigo-100/60 dark:bg-indigo-900/30"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress / 100 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        <AnimatePresence mode="wait">
          {/* Idle state */}
          {uploadState === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div
                className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-400"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Upload className="h-6 w-6" />
              </motion.div>
              <div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  拖拽PDF文件到此处，或
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {" "}点击上传
                  </span>
                </p>
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                  仅支持 PDF 格式，最大 10MB
                </p>
              </div>
            </motion.div>
          )}

          {/* Dragging state */}
          {uploadState === "dragging" && (
            <motion.div
              key="dragging"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div
                className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-200 text-indigo-700 dark:bg-indigo-800/60 dark:text-indigo-300"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                <Upload className="h-6 w-6" />
              </motion.div>
              <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                松开以上传文件
              </p>
            </motion.div>
          )}

          {/* Uploading state */}
          {uploadState === "uploading" && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 flex flex-col items-center gap-4"
            >
              <motion.div
                className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-400"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <FileText className="h-6 w-6" />
              </motion.div>
              {selectedFile && (
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {selectedFile.name}
                  <span className="ml-2 text-xs text-zinc-400">
                    ({formatFileSize(selectedFile.size)})
                  </span>
                </p>
              )}
              <div className="w-full max-w-xs">
                <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  正在解析简历... {Math.round(progress)}%
                </p>
              </div>
            </motion.div>
          )}

          {/* Success state */}
          {uploadState === "success" && !isProcessing && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div
                className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-400"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <CheckCircle className="h-6 w-6" />
              </motion.div>
              {selectedFile && (
                <div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              )}
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                文件已就绪
              </p>
            </motion.div>
          )}

          {/* Error state */}
          {uploadState === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div
                className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/60 dark:text-red-400"
                initial={{ x: 0 }}
                animate={{ x: [0, -4, 4, -4, 4, 0] }}
                transition={{ duration: 0.4 }}
              >
                <AlertCircle className="h-6 w-6" />
              </motion.div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                {errorMessage}
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  reset();
                }}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <X className="h-3.5 w-3.5" />
                重新选择
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
