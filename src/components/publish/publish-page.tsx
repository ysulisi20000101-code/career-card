"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Copy,
  Check,
  Download,
  ExternalLink,
  QrCode,
  Rocket,
  PartyPopper,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useResumeStore } from "@/store/resume-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import {
  savePublishedResume,
} from "@/lib/share/storage";
import { buildShareArtifacts, QR_HASH_THRESHOLD } from "@/lib/share/strategy";

interface PublishPageProps {
  onPublished?: (payload: { slug: string; shortUrl: string; shareUrl: string }) => void;
}

export function PublishPage({ onPublished }: PublishPageProps) {
  const resumeData = useResumeStore((s) => s.resumeData);
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  const [username, setUsername] = useState("");
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shortUrl, setShortUrl] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [portableUrlReady, setPortableUrlReady] = useState(false);
  const [qrTooLarge, setQrTooLarge] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const handlePublish = useCallback(async () => {
    if (!resumeData) return;
    const slug = username.trim().toLowerCase();
    if (!slug) return;
    setPublishing(true);

    savePublishedResume(slug, resumeData);

    const artifacts = buildShareArtifacts(window.location.origin, slug, resumeData);

    setShortUrl(artifacts.shortUrl);
    setShareUrl(artifacts.portableUrl);
    setPortableUrlReady(artifacts.portableUrlReady);
    setQrTooLarge(!artifacts.canRenderPortableQr);

    await new Promise((r) => setTimeout(r, 600));
    setPublished(true);
    setPublishing(false);
    onPublished?.({
      slug,
      shortUrl: artifacts.shortUrl,
      shareUrl: artifacts.portableUrl,
    });
  }, [username, resumeData, onPublished]);

  const handleCopy = useCallback(async () => {
    if (!portableUrlReady || !shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [portableUrlReady, shareUrl]);

  const handleDownloadQR = useCallback(() => {
    const svgEl = qrRef.current?.querySelector("svg");
    if (!svgEl) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const a = document.createElement("a");
      a.download = `${username}-qrcode.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  }, [username]);

  const canRenderPortableQr = portableUrlReady && !qrTooLarge;
  const qrValue = canRenderPortableQr ? shareUrl : "";
  const qrLevel = shareUrl.length > QR_HASH_THRESHOLD ? "L" : "M";

  if (!resumeData) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-md flex-col items-center justify-center px-6 py-10">
        <Notice tone="warning" title="尚未导入简历">
          请先回到第一步上传 PDF 简历，再来发布。
        </Notice>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <AnimatePresence mode="wait">
        {!published ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="text-center">
              <div className="relative mx-auto mb-5 h-16 w-16">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-200/50 to-violet-200/50 blur-xl" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
                  <Rocket className="h-7 w-7" />
                </div>
              </div>
              <h2 className="text-2xl font-bold">
                发布你的<span className="brand-gradient-text">职场名片</span>
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                选择一个用户名，生成专属分享链接
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-100 bg-white/90 p-6 shadow-sm shadow-zinc-200/40 backdrop-blur">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-800">
                    用户名
                  </label>
                  <div className="flex items-stretch gap-2">
                    <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-xs text-zinc-500">
                      <Globe className="mr-1.5 h-3.5 w-3.5" />
                      {origin || "(本机)"}/p/
                    </div>
                    <Input
                      placeholder="your-name"
                      value={username}
                      onChange={(e) =>
                        setUsername(
                          e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                        )
                      }
                      className="flex-1"
                    />
                  </div>
                </div>

                {username && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-white p-3"
                  >
                    <p className="text-[11px] uppercase tracking-[0.18em] text-indigo-500">
                      预览链接
                    </p>
                    <p className="mt-1 break-all text-sm font-medium text-indigo-700">
                      {origin || ""}/p/{username}
                    </p>
                  </motion.div>
                )}

                <Button
                  size="lg"
                  variant="brand"
                  className="w-full gap-2 rounded-full"
                  onClick={handlePublish}
                  disabled={!username.trim() || publishing}
                >
                  {publishing ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          repeat: Infinity,
                          duration: 1,
                          ease: "linear",
                        }}
                        className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                      />
                      发布中...
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4" />
                      立即发布
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="relative mx-auto mb-4 h-16 w-16"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-200/50 to-green-200/50 blur-xl" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-lg shadow-emerald-500/30">
                  <PartyPopper className="h-8 w-8" />
                </div>
              </motion.div>
              <h2 className="text-2xl font-bold">发布成功！</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                你的职场名片已上线，可以分享了
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-zinc-100 bg-white/90 p-5 shadow-sm shadow-zinc-200/40 backdrop-blur">
              <LinkCard
                stripe="bg-gradient-to-b from-indigo-500 to-violet-500"
                title="本机短链接"
                hint="同设备打开"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 shrink-0 text-indigo-500" />
                  <a
                    href={shortUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 truncate text-sm font-medium text-indigo-600 hover:underline"
                  >
                    {shortUrl}
                  </a>
                </div>
              </LinkCard>

              <LinkCard
                stripe="bg-gradient-to-b from-rose-400 to-amber-400"
                title="便携全量链接"
                hint="含数据，跨设备可用"
              >
                <div className="flex items-center gap-2">
                  <span className="flex-1 truncate text-xs font-medium text-zinc-700">
                    {shareUrl}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 gap-1.5 rounded-full"
                    onClick={handleCopy}
                    disabled={!portableUrlReady || !shareUrl}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        复制链接
                      </>
                    )}
                  </Button>
                </div>
              </LinkCard>
            </div>

            <div className="rounded-2xl border border-zinc-100 bg-gradient-to-br from-white via-white to-indigo-50/40 p-6 shadow-sm shadow-zinc-200/40">
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-600">
                  <QrCode className="h-4 w-4 text-indigo-500" />
                  扫码访问
                </div>
                <div className="relative rounded-2xl p-[2px]">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 opacity-70 blur-[2px]" />
                  <div
                    ref={qrRef}
                    className="relative rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm"
                  >
                    {canRenderPortableQr ? (
                      <QRCodeSVG
                        value={qrValue}
                        size={200}
                        bgColor="#ffffff"
                        fgColor="#18181b"
                        level={qrLevel}
                      />
                    ) : (
                      <div className="flex h-[200px] w-[200px] items-center justify-center rounded-md bg-zinc-50 text-center text-xs text-zinc-500">
                        当前内容过大，二维码已禁用
                      </div>
                    )}
                  </div>
                </div>

                {!portableUrlReady ? (
                  <Notice tone="warning" className="w-full">
                    便携链接生成失败，请重新发布后再试。
                  </Notice>
                ) : qrTooLarge ? (
                  <Notice tone="warning" className="w-full">
                    简历内容较大，已禁止生成短链二维码，避免跨设备失效。
                    请使用上方&ldquo;便携全量链接&rdquo;分享。
                  </Notice>
                ) : (
                  <p className="max-w-xs text-center text-[11px] text-zinc-500">
                    二维码内含简历数据，扫码可直接打开（无需服务器）。
                  </p>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-full"
                  onClick={handleDownloadQR}
                  disabled={!canRenderPortableQr}
                >
                  <Download className="h-3.5 w-3.5" />
                  下载二维码
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface LinkCardProps {
  stripe: string;
  title: string;
  hint: string;
  children: React.ReactNode;
}

function LinkCard({ stripe, title, hint, children }: LinkCardProps) {
  return (
    <div className="relative flex gap-3 rounded-xl border border-zinc-100 bg-zinc-50/50 p-3">
      <span className={`w-1 shrink-0 rounded-full ${stripe}`} />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-baseline gap-2">
          <p className="text-xs font-medium text-zinc-800">{title}</p>
          <p className="text-[11px] text-zinc-500">{hint}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
