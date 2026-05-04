import type { ResumeData } from "@/types";
import { decodeResumeFromHash, encodeResumeToHash } from "@/lib/share/storage";

export const QR_HASH_THRESHOLD = 1500;
export const QR_MAX_URL_LENGTH = 2900;

export type ShareLinkCapability = "server" | "portable" | "localOnly" | "unavailable";

export interface ShareLinkState {
  capability: ShareLinkCapability;
  url: string;
  ready: boolean;
  reason?: string;
}

export interface ShareArtifacts {
  shortUrl: string;
  portableUrl: string;
  portableUrlReady: boolean;
  portableUrlTooLong: boolean;
  canRenderPortableQr: boolean;
  qrLevel: "L" | "M";
  localPreviewLink: ShareLinkState;
  portableLink: ShareLinkState;
  recommendedLink: ShareLinkState;
}

function unavailable(reason: string): ShareLinkState {
  return {
    capability: "unavailable",
    url: "",
    ready: false,
    reason,
  };
}

export function buildShareArtifacts(
  origin: string,
  slug: string,
  resumeData: ResumeData,
): ShareArtifacts {
  const base = `${origin}/p/${slug}`;
  const encoded = encodeResumeToHash(resumeData);
  const portableUrl = encoded ? `${base}#d=${encoded}` : "";
  const portableUrlReady = Boolean(encoded && decodeResumeFromHash(encoded));
  const portableUrlTooLong = portableUrl.length > QR_MAX_URL_LENGTH;
  const canRenderPortableQr =
    portableUrlReady && portableUrl.length > 0 && !portableUrlTooLong;
  const qrLevel = portableUrl.length > QR_HASH_THRESHOLD ? "L" : "M";
  const localPreviewLink: ShareLinkState = {
    capability: "localOnly",
    url: base,
    ready: true,
    reason: "本机预览依赖当前设备或当前开发地址，不能保证跨设备访问。",
  };
  const portableLink: ShareLinkState =
    portableUrlReady && !portableUrlTooLong
      ? {
          capability: "portable",
          url: portableUrl,
          ready: true,
          reason: "链接内携带发布快照，可在没有本机数据的浏览器中打开。",
        }
      : unavailable(
          portableUrlTooLong
            ? "便携链接超过稳定分享长度，请使用正式发布链接或减少发布内容。"
            : "便携链接生成失败，请重新发布或使用正式发布链接。",
        );

  return {
    shortUrl: base,
    portableUrl,
    portableUrlReady,
    portableUrlTooLong,
    canRenderPortableQr,
    qrLevel,
    localPreviewLink,
    portableLink,
    recommendedLink: portableLink.ready ? portableLink : unavailable(portableLink.reason ?? "暂无可分享链接。"),
  };
}

export function choosePrimaryShareLink(params: {
  serverUrl: string;
  serverReady: boolean;
  serverAccessible: boolean;
  portableLink: ShareLinkState;
}): ShareLinkState {
  if (params.serverReady && params.serverAccessible && params.serverUrl) {
    return {
      capability: "server",
      url: params.serverUrl,
      ready: true,
      reason: "服务端保存发布快照，可跨设备稳定访问。",
    };
  }
  if (params.portableLink.ready) return params.portableLink;
  return unavailable(params.portableLink.reason ?? "暂无可跨设备访问的分享链接。");
}

export function resolveSharedResume(params: {
  hash: string;
  slug: string;
  loadFromStorage: (slug: string) => ResumeData | null;
  includeStorage?: boolean;
}): ResumeData | null {
  const hashParams = new URLSearchParams(params.hash.replace(/^#/, ""));
  const encoded = hashParams.get("d") ?? "";
  const fromHash = encoded ? decodeResumeFromHash(encoded) : null;
  if (fromHash) return fromHash;
  return params.includeStorage && params.slug ? params.loadFromStorage(params.slug) : null;
}
