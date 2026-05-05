"use client";

import type React from "react";
import { useCallback, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Eye,
  Globe,
  PartyPopper,
  Rocket,
  ShieldCheck,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useResumeStore } from "@/store/resume-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { savePublishedResume, removePublishedSite } from "@/lib/share/storage";
import {
  buildShareArtifacts,
  choosePrimaryShareLink,
  type ShareLinkState,
} from "@/lib/share/strategy";
import { getPublishChecks, hasBlockingPublishChecks, type PublishCheck } from "@/lib/share/publish-checks";
import { trackEvent } from "@/lib/events/client";
import { cn } from "@/lib/utils";
import { updateProjectRecord, loadSite, saveSite } from "@/lib/projects/registry";
import { useIsClient } from "@/hooks/use-is-client";
import { CareerNarrativeSite } from "@/components/narrative/career-narrative-site";

interface PublishPageProps {
  projectId?: string;
  siteId?: string;
  onPublished?: (payload: {
    slug: string;
    shortUrl: string;
    shareUrl: string;
    publishedAt: string;
  }) => void;
}

interface ServerPublishState {
  url: string;
  ready: boolean;
  error: string;
}

const INITIAL_LOCAL_PREVIEW_LINK: ShareLinkState = {
  capability: "localOnly",
  url: "",
  ready: false,
};

const INITIAL_PORTABLE_LINK: ShareLinkState = {
  capability: "unavailable",
  url: "",
  ready: false,
  reason: "尚未生成可分享链接。",
};

export function PublishPage({ projectId, siteId, onPublished }: PublishPageProps) {
  const isClient = useIsClient();
  const resumeData = useResumeStore((state) => state.resumeData);
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const isLocalOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(origin);

  const [slugInput, setSlugInput] = useState("");
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [localPreviewLink, setLocalPreviewLink] =
    useState<ShareLinkState>(INITIAL_LOCAL_PREVIEW_LINK);
  const [portableLink, setPortableLink] = useState<ShareLinkState>(INITIAL_PORTABLE_LINK);
  const [publishedAt, setPublishedAt] = useState("");
  const [serverPublish, setServerPublish] = useState<ServerPublishState>({
    url: "",
    ready: false,
    error: "",
  });
  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const checks = useMemo(() => (resumeData ? getPublishChecks(resumeData) : []), [resumeData]);
  const hasBlocker = hasBlockingPublishChecks(checks);
  const slug = slugInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  const primaryShare = useMemo(
    () =>
      choosePrimaryShareLink({
        serverUrl: serverPublish.url,
        serverReady: serverPublish.ready,
        serverAccessible: !isLocalOrigin,
        portableLink,
      }),
    [isLocalOrigin, portableLink, serverPublish.ready, serverPublish.url],
  );
  const primaryShareKey = primaryShare.capability;

  const copyText = useCallback(async (value: string, key: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Fallback for insecure contexts
      const input = document.createElement("input");
      input.value = value;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    trackEvent("share_link_copied", "share", { link_type: key });
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  }, []);

  const handlePublish = useCallback(async () => {
    if (!resumeData || !slug || hasBlocker) return;
    setPublishing(true);
    setServerPublish({ url: "", ready: false, error: "" });
    setLocalPreviewLink(INITIAL_LOCAL_PREVIEW_LINK);
    setPortableLink(INITIAL_PORTABLE_LINK);

    const artifacts = buildShareArtifacts(window.location.origin, slug, resumeData);
    const publicUrl = artifacts.shortUrl;
    let serverLinkReady = false;
    let serverError = "";
    const now = new Date().toISOString();

    setLocalPreviewLink(artifacts.localPreviewLink);
    setPortableLink(artifacts.portableLink);
    setPublishedAt(now);

    try {
      const response = await fetch("/api/published-sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          data: resumeData,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(readablePublishError(payload.error));

      const verify = await fetch(`/api/published-sites/${slug}`, { cache: "no-store" });
      if (!verify.ok) throw new Error("发布快照校验失败");
      serverLinkReady = true;

      // API is source of truth; update localStorage as cache after success
      savePublishedResume(slug, resumeData);

      setServerPublish({
        url: publicUrl,
        ready: true,
        error: isLocalOrigin
          ? "当前运行在本地地址，外部设备仍无法直接访问。部署到公网域名后，这个链接会成为正式分享链接。"
          : "",
      });
      trackEvent("first_publish_completed", "share", {
        slug_length: slug.length,
      });

      if (projectId) {
        updateProjectRecord(projectId, { status: "published", publishedSlug: slug });
      }
      if (siteId) {
        const site = loadSite(siteId);
        if (site) {
          saveSite({ ...site, status: "published", slug, publishedAt: now, updatedAt: now });
        }
      }
    } catch (error) {
      serverError = error instanceof Error ? error.message : "正式发布失败";
      setServerPublish({
        url: "",
        ready: false,
        error: serverError,
      });
    }

    // If portable link available, show success view as fallback even when server fails
    if (serverLinkReady || artifacts.portableLink.ready) {
      savePublishedResume(slug, resumeData);
      if (projectId) {
        updateProjectRecord(projectId, { status: "published", publishedSlug: slug });
      }
      if (siteId) {
        const site = loadSite(siteId);
        if (site) {
          saveSite({ ...site, status: "published", slug, publishedAt: now, updatedAt: now });
        }
      }
      setPublished(true);
      onPublished?.({
        slug,
        shortUrl: publicUrl,
        shareUrl: serverLinkReady && !isLocalOrigin ? publicUrl : artifacts.recommendedLink.url,
        publishedAt: now,
      });
    }

    setPublishing(false);
  }, [hasBlocker, isLocalOrigin, onPublished, projectId, resumeData, slug]);

  const handleRevoke = useCallback(async () => {
    if (!slug || revoking) return;
    if (!window.confirm("撤回后，稳定链接将无法访问。已经复制出去的便携链接仍然可能打开。确认撤回吗？")) return;
    setRevoking(true);
    setRevokeError("");
    try {
      await fetch(`/api/published-sites/${slug}`, { method: "DELETE" });
      // Clean up localStorage published snapshot
      removePublishedSite(slug);
      setPublished(false);
      setServerPublish({ url: "", ready: false, error: "" });
      if (projectId) {
        updateProjectRecord(projectId, { status: "draft", publishedSlug: undefined });
      }
    } catch {
      setRevokeError("撤回失败，请稍后重试。");
    }
    setRevoking(false);
  }, [projectId, slug, revoking]);

  if (!isClient) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-md flex-col items-center justify-center px-6 py-10">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-indigo-500" />
      </div>
    );
  }

  if (!resumeData) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-md flex-col items-center justify-center px-6 py-10">
        <Notice tone="warning" title="尚未导入简历">
          请先回到第一步上传 PDF 简历，再发布职业档案。
        </Notice>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <AnimatePresence mode="wait">
        {!published ? (
          <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
            <div className="text-center">
              <div className="relative mx-auto mb-5 h-16 w-16">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-indigo-200/50 to-violet-200/50 blur-xl" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
                  <Rocket className="h-7 w-7" />
                </div>
              </div>
              <h2 className="text-2xl font-bold">
                发布<span className="brand-gradient-text">职业档案</span>
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                生成面向面试官阅读的公开链接。发布前会先检查身份、核心经历和亮点支撑是否完整。
              </p>
            </div>

            <div className="rounded-lg border border-zinc-100 bg-white/90 p-5 shadow-sm backdrop-blur">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <ShieldCheck className="h-4 w-4 text-indigo-500" />
                发布前检查
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {checks.map((check) => (
                  <PublishCheckItem key={check.id} check={check} />
                ))}
              </div>
              {hasBlocker && (
                <Notice tone="danger" className="mt-4" title="暂时不能发布">
                  请先补齐阻断项，再生成公开链接。
                </Notice>
              )}
            </div>

            <div className="rounded-lg border border-zinc-100 bg-white/90 p-5 shadow-sm backdrop-blur">
              <button
                type="button"
                className="flex w-full items-center justify-between text-left"
                onClick={() => setShowPreview(!showPreview)}
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                  <Eye className="h-4 w-4 text-indigo-500" />
                  发布效果预览
                </div>
                {showPreview ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
              </button>
              {showPreview && (
                <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200">
                  <div className="max-h-[500px] overflow-y-auto">
                    <CareerNarrativeSite data={resumeData} showFooter={false} />
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-zinc-100 bg-white/90 p-6 shadow-sm backdrop-blur">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-800">公开地址</label>
                  <div className="flex items-stretch gap-2">
                    <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-xs text-zinc-500">
                      <Globe className="mr-1.5 h-3.5 w-3.5" />
                      {origin || "(本机)"}/p/
                    </div>
                    <Input
                      placeholder="your-name"
                      value={slugInput}
                      onChange={(event) => setSlugInput(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      className="flex-1"
                    />
                  </div>
                </div>

                {slug && (
                  <div className="rounded-lg border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-white p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-indigo-500">发布后预览</p>
                    <p className="mt-1 break-all text-sm font-medium text-indigo-700">
                      {origin || ""}/p/{slug}
                    </p>
                  </div>
                )}

                {serverPublish.error && (
                  <Notice tone="danger" className="mt-4">{serverPublish.error}</Notice>
                )}
                <Button size="lg" variant="brand" className="w-full gap-2 rounded-full" onClick={handlePublish} disabled={!slug || publishing || hasBlocker}>
                  {publishing ? "正在发布..." : "生成可分享链接"}
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className="text-center">
              <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-lg shadow-emerald-500/30">
                <PartyPopper className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold">职业档案已发布</h2>
              <p className="mt-2 text-sm text-muted-foreground">面试官打开链接即可看到你的候选人档案。发布时间：{formatPublishedAt(publishedAt)}</p>
            </div>

            <div className="space-y-3 rounded-lg border border-zinc-100 bg-white/90 p-5 shadow-sm backdrop-blur">
              <LinkCard stripe="bg-gradient-to-b from-indigo-500 to-violet-500" title="可分享链接" hint={primaryShare.reason ?? "当前没有可跨设备访问的链接"}>
                <CopyableLink
                  value={primaryShare.url}
                  copied={copied === primaryShareKey}
                  disabled={!primaryShare.ready}
                  onCopy={() => copyText(primaryShare.url, primaryShareKey)}
                />
                {!primaryShare.ready && (
                  <Notice tone="danger" className="mt-3">
                    {primaryShare.reason ?? "正式发布和便携链接都不可用。"} 本机预览链接只放在诊断区，不会作为分享链接兜底。
                  </Notice>
                )}
                {!serverPublish.ready && serverPublish.error && (
                  <Notice tone="warning" className="mt-3">
                    服务器发布未成功（{serverPublish.error}），当前使用便携链接兜底。链接较长但功能完整，可直接复制分享。
                  </Notice>
                )}
                {isLocalOrigin && (
                  <Notice tone="warning" className="mt-3">
                    当前运行在本地地址。外部设备无法直接访问 127.0.0.1，已优先提供便携链接用于无痕窗口和同域环境校验；部署到公网域名后会默认复制正式链接。
                  </Notice>
                )}
              </LinkCard>

              <details className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-3 text-sm">
                <summary className="cursor-pointer text-xs font-medium text-zinc-600">查看发布诊断</summary>
                <div className="mt-3 space-y-3">
                  <LinkCard stripe="bg-gradient-to-b from-zinc-400 to-zinc-500" title="本机预览链接" hint={localPreviewLink.reason ?? "只保证当前浏览器可访问"}>
                    <CopyableLink
                      value={localPreviewLink.url}
                      copied={copied === "localOnly"}
                      disabled={!localPreviewLink.ready}
                      onCopy={() => copyText(localPreviewLink.url, "localOnly")}
                    />
                  </LinkCard>
                  <LinkCard stripe="bg-gradient-to-b from-rose-400 to-amber-400" title="便携链接" hint={portableLink.reason ?? "数据写入链接，无需 localStorage"}>
                    <CopyableLink
                      value={portableLink.url}
                      copied={copied === "portable"}
                      disabled={!portableLink.ready}
                      onCopy={() => copyText(portableLink.url, "portable")}
                    />
                  </LinkCard>
                  <LinkCard stripe="bg-gradient-to-b from-indigo-500 to-violet-500" title="正式链接" hint="读取服务端 publishedSite 快照">
                    <CopyableLink value={serverPublish.ready ? serverPublish.url : ""} copied={copied === "server"} disabled={!serverPublish.ready} onCopy={() => copyText(serverPublish.url, "server")} />
                    {serverPublish.error && (
                      <Notice tone={serverPublish.ready ? "warning" : "danger"} className="mt-3">
                        {serverPublish.error}
                      </Notice>
                    )}
                  </LinkCard>
                </div>
              </details>
            </div>

            {revokeError && (
              <Notice tone="danger">{revokeError}</Notice>
            )}
            <div className="flex justify-center">
              <Button
                variant="outline"
                className="gap-2 rounded-full border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                onClick={handleRevoke}
                disabled={revoking}
              >
                <Trash2 className="h-4 w-4" />
                {revoking ? "正在撤回..." : "撤回已发布链接"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function readablePublishError(error?: string): string {
  if (error === "SLUG_TAKEN") return "这个公开地址已经被占用，请换一个。";
  if (error === "PAYLOAD_TOO_LARGE") return "发布数据过大，请尝试精简简历内容后重新发布。";
  if (error === "INVALID_SITE_DATA") return "发布数据校验失败，请回到编辑页重新保存后再试。";
  if (error === "INVALID_PUBLISH_PAYLOAD") return "发布数据不完整，请刷新页面后重试。";
  if (error === "UNAUTHORIZED") return "未授权，请检查 API 密钥设置。";
  if (error === "NOT_FOUND") return "发布快照不存在，请重新发布。";
  return `正式发布失败：${error || "未知错误"}`;
}

function PublishCheckItem({ check }: { check: PublishCheck }) {
  const passed = check.severity === "passed";
  const warning = check.severity === "warning";
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        passed && "border-emerald-100 bg-emerald-50/60",
        warning && "border-amber-100 bg-amber-50/70",
        check.severity === "blocker" && "border-rose-100 bg-rose-50/70",
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        {passed ? <Check className="h-4 w-4 text-emerald-600" /> : <TriangleAlert className={cn("h-4 w-4", warning ? "text-amber-600" : "text-rose-600")} />}
        {check.label}
      </div>
      <p className="mt-1 text-xs leading-5 text-zinc-600">{check.description}</p>
    </div>
  );
}

function LinkCard({ stripe, title, hint, children }: { stripe: string; title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="relative flex gap-3 rounded-lg border border-zinc-100 bg-zinc-50/50 p-3">
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

function CopyableLink({
  value,
  copied,
  disabled,
  onCopy,
}: {
  value: string;
  copied: boolean;
  disabled?: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <ExternalLink className="h-4 w-4 shrink-0 text-indigo-500" />
      <a href={!disabled && value ? value : undefined} target="_blank" rel="noreferrer" className="flex-1 truncate text-sm font-medium text-indigo-600 hover:underline">
        {value || "暂不可用"}
      </a>
      <Button size="sm" variant="outline" className="shrink-0 gap-1.5 rounded-full" onClick={onCopy} disabled={disabled || !value}>
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "已复制" : "复制"}
      </Button>
    </div>
  );
}

function formatPublishedAt(value: string): string {
  if (!value) return "刚刚";
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}
