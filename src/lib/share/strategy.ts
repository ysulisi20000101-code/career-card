import type { ResumeData } from "@/types";
import { decodeResumeFromHash, encodeResumeToHash } from "@/lib/share/storage";

export const QR_HASH_THRESHOLD = 1500;
export const QR_MAX_URL_LENGTH = 2900;

export interface ShareArtifacts {
  shortUrl: string;
  portableUrl: string;
  portableUrlReady: boolean;
  canRenderPortableQr: boolean;
  qrLevel: "L" | "M";
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
  const canRenderPortableQr =
    portableUrlReady && portableUrl.length > 0 && portableUrl.length <= QR_MAX_URL_LENGTH;
  const qrLevel = portableUrl.length > QR_HASH_THRESHOLD ? "L" : "M";

  return {
    shortUrl: base,
    portableUrl,
    portableUrlReady,
    canRenderPortableQr,
    qrLevel,
  };
}

export function resolveSharedResume(params: {
  hash: string;
  slug: string;
  loadFromStorage: (slug: string) => ResumeData | null;
}): ResumeData | null {
  const hashParams = new URLSearchParams(params.hash.replace(/^#/, ""));
  const encoded = hashParams.get("d") ?? "";
  const fromHash = encoded ? decodeResumeFromHash(encoded) : null;
  const fromStore = params.slug ? params.loadFromStorage(params.slug) : null;
  return fromHash ?? fromStore;
}
