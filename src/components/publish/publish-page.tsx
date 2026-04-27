"use client";

import type React from "react";
import { useCallback, useMemo, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Globe,
  PartyPopper,
  Rocket,
  ShieldCheck,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useResumeStore } from "@/store/resume-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { AccountPanel } from "@/components/commercial/account-panel";
import { savePublishedResume } from "@/lib/share/storage";
import { buildShareArtifacts } from "@/lib/share/strategy";
import { getPublishChecks, hasBlockingPublishChecks, type PublishCheck } from "@/lib/share/publish-checks";
import { PLAN_LABELS } from "@/lib/commercial/plans";
import { trackEvent } from "@/lib/events/client";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types/commercial";

interface PublishPageProps {
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

export function PublishPage({ onPublished }: PublishPageProps) {
  const resumeData = useResumeStore((state) => state.resumeData);
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const isLocalOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(origin);

  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [slugInput, setSlugInput] = useState("");
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [localUrl, setLocalUrl] = useState("");
  const [portableUrl, setPortableUrl] = useState("");
  const [portableReady, setPortableReady] = useState(false);
  const [publishedAt, setPublishedAt] = useState("");
  const [serverPublish, setServerPublish] = useState<ServerPublishState>({
    url: "",
    ready: false,
    error: "",
  });

  const checks = useMemo(() => (resumeData ? getPublishChecks(resumeData) : []), [resumeData]);
  const hasBlocker = hasBlockingPublishChecks(checks);
  const isFree = !sessionUser || sessionUser.plan === "free";
  const slug = slugInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  const primaryShareUrl = serverPublish.ready && !isLocalOrigin ? serverPublish.url : portableUrl;
  const primaryShareReady = Boolean(primaryShareUrl && (serverPublish.ready || portableReady));
  const primaryShareKey = serverPublish.ready && !isLocalOrigin ? "server" : "portable";

  const copyText = useCallback(async (value: string, key: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    trackEvent("share_link_copied", "share", { link_type: key });
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  }, []);

  const upgradePlan = useCallback(async (plan: "pro" | "advanced") => {
    if (!sessionUser) return;
    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    if (response.ok) {
      trackEvent("billing_checkout_completed", "billing", { plan });
      const session = await fetch("/api/auth/session", { cache: "no-store" });
      const payload = (await session.json()) as { user: SessionUser | null };
      setSessionUser(payload.user);
    }
  }, [sessionUser]);

  const handlePublish = useCallback(async () => {
    if (!resumeData || !slug || hasBlocker) return;
    setPublishing(true);
    setServerPublish({ url: "", ready: false, error: "" });

    const site = savePublishedResume(slug, resumeData);
    const artifacts = buildShareArtifacts(window.location.origin, slug, resumeData);
    const publicUrl = artifacts.shortUrl;

    setLocalUrl(publicUrl);
    setPortableUrl(artifacts.portableUrl);
    setPortableReady(artifacts.portableUrlReady);
    setPublishedAt(site?.publishedAt ?? new Date().toISOString());

    if (!sessionUser) {
      setServerPublish({
        url: "",
        ready: false,
        error: "当前未登录。便携链接可以临时分享，正式稳定链接需要登录后生成。",
      });
    } else {
      try {
        const response = await fetch("/api/published-sites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            title: resumeData.profile.name || slug,
            data: resumeData,
          }),
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(readablePublishError(payload.error));

        const verify = await fetch(`/api/published-sites/${slug}`, { cache: "no-store" });
        if (!verify.ok) throw new Error("发布快照校验失败");

        setServerPublish({
          url: publicUrl,
          ready: true,
          error: isLocalOrigin
            ? "当前运行在本地地址，外部设备仍无法直接访问。部署到公网域名后，这个链接会成为正式分享链接。"
            : "",
        });
        trackEvent("first_publish_completed", "share", {
          slug_length: slug.length,
          plan: sessionUser.plan,
        });
      } catch (error) {
        setServerPublish({
          url: "",
          ready: false,
          error: error instanceof Error ? error.message : "正式发布失败，请使用便携链接兜底。",
        });
      }
    }

    setPublished(true);
    setPublishing(false);
    onPublished?.({
      slug,
      shortUrl: publicUrl,
      shareUrl: artifacts.portableUrl,
      publishedAt: site?.publishedAt ?? new Date().toISOString(),
    });
  }, [hasBlocker, isLocalOrigin, onPublished, resumeData, sessionUser, slug]);

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

            <AccountPanel onChange={setSessionUser} />

            <CommercialPlanBox user={sessionUser} onUpgrade={upgradePlan} />

            <div className="rounded-lg border border-zinc-100 bg-white/90 p-5 shadow-sm shadow-zinc-200/40 backdrop-blur">
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

            <div className="rounded-lg border border-zinc-100 bg-white/90 p-6 shadow-sm shadow-zinc-200/40 backdrop-blur">
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

                <Button size="lg" variant="brand" className="w-full gap-2 rounded-full" onClick={handlePublish} disabled={!slug || publishing || hasBlocker}>
                  {publishing ? "正在发布..." : isFree ? "生成可分享链接" : "生成正式发布链接"}
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
              <h2 className="text-2xl font-bold">发布完成</h2>
              <p className="mt-2 text-sm text-muted-foreground">发布时间：{formatPublishedAt(publishedAt)}</p>
            </div>

            <div className="space-y-3 rounded-lg border border-zinc-100 bg-white/90 p-5 shadow-sm shadow-zinc-200/40 backdrop-blur">
              <LinkCard stripe="bg-gradient-to-b from-indigo-500 to-violet-500" title="可分享链接" hint={primaryShareKey === "server" ? "服务端保存快照，可稳定访问" : "链接内携带数据，可在无本地数据的浏览器打开"}>
                <CopyableLink
                  value={primaryShareUrl}
                  copied={copied === primaryShareKey}
                  disabled={!primaryShareReady}
                  onCopy={() => copyText(primaryShareUrl, primaryShareKey)}
                />
                {isLocalOrigin && (
                  <Notice tone="warning" className="mt-3">
                    当前运行在本地地址。外部设备无法直接访问 127.0.0.1，已优先提供便携链接用于无痕窗口和同域环境校验；部署到公网域名后会默认复制正式链接。
                  </Notice>
                )}
              </LinkCard>

              <details className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-3 text-sm">
                <summary className="cursor-pointer text-xs font-medium text-zinc-600">查看发布诊断</summary>
                <div className="mt-3 space-y-3">
                  <LinkCard stripe="bg-gradient-to-b from-zinc-400 to-zinc-500" title="本机预览链接" hint="只保证当前浏览器可访问">
                    <CopyableLink value={localUrl} copied={copied === "local"} onCopy={() => copyText(localUrl, "local")} />
                  </LinkCard>
                  <LinkCard stripe="bg-gradient-to-b from-rose-400 to-amber-400" title="便携链接" hint="数据写入链接，无需 localStorage">
                    <CopyableLink value={portableUrl} copied={copied === "portable"} disabled={!portableReady} onCopy={() => copyText(portableUrl, "portable")} />
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CommercialPlanBox({
  user,
  onUpgrade,
}: {
  user: SessionUser | null;
  onUpgrade: (plan: "pro" | "advanced") => void;
}) {
  const plan = user?.plan ?? "free";
  return (
    <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-indigo-950">
            <Zap className="h-4 w-4 text-indigo-600" />
            当前权益：{PLAN_LABELS[plan]}
          </div>
          <p className="mt-1 text-xs leading-5 text-indigo-700">
            免费版可生成基础草稿和便携链接；个人版解锁稳定公开链接、自定义地址、多版本和更高 AI 额度。
          </p>
        </div>
        {user && plan === "free" && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="rounded-full bg-white" onClick={() => onUpgrade("pro")}>
              升级个人版
            </Button>
            <Button size="sm" variant="brand" className="rounded-full" onClick={() => onUpgrade("advanced")}>
              高级版
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function readablePublishError(error?: string): string {
  if (error === "UNAUTHENTICATED") return "请先登录后再生成正式发布链接。";
  if (error === "PUBLISH_QUOTA_EXCEEDED") return "当前版本的正式发布额度已用完，请升级后继续发布。";
  if (error === "SLUG_TAKEN") return "这个公开地址已经被占用，请换一个。";
  return "正式发布失败，请稍后重试。";
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
      <a href={value || undefined} target="_blank" rel="noreferrer" className="flex-1 truncate text-sm font-medium text-indigo-600 hover:underline">
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
