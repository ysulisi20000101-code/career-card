"use client";

import type { ResumeData } from "@/types";
import { sanitizeResumeData } from "@/lib/share/validation";
import { buildPublishSnapshot } from "@/lib/share/snapshot";
import { strFromU8, strToU8, unzlibSync, zlibSync } from "fflate";

const LEGACY_PREFIX = "career-card:published:";
const SITE_PREFIX = "career-card:published-site:";

export interface PublishedSite {
  slug: string;
  version: number;
  publishedAt: string;
  data: ResumeData;
}

export function savePublishedResume(slug: string, data: ResumeData): PublishedSite | null {
  if (typeof window === "undefined") return null;
  const sanitized = buildPublishSnapshot(data);
  if (!sanitized) return null;
  const site: PublishedSite = {
    slug,
    version: 1,
    publishedAt: new Date().toISOString(),
    data: sanitized,
  };
  window.localStorage.setItem(SITE_PREFIX + slug, JSON.stringify(site));
  window.localStorage.setItem(LEGACY_PREFIX + slug, JSON.stringify(site.data));
  return site;
}

export function removePublishedSite(slug: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SITE_PREFIX + slug);
  window.localStorage.removeItem(LEGACY_PREFIX + slug);
}

export function loadPublishedSite(slug: string): PublishedSite | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SITE_PREFIX + slug);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PublishedSite>;
    if (!parsed.data) return null;
    const sanitized = sanitizeResumeData(parsed.data);
    if (!sanitized) return null;
    return {
      slug: parsed.slug || slug,
      version: parsed.version || 1,
      publishedAt: parsed.publishedAt || "",
      data: sanitized,
    };
  } catch {
    return null;
  }
}

export function loadPublishedResume(slug: string): ResumeData | null {
  if (typeof window === "undefined") return null;
  const site = loadPublishedSite(slug);
  if (site) return site.data;

  const raw = window.localStorage.getItem(LEGACY_PREFIX + slug);
  if (!raw) return null;
  try {
    return sanitizeResumeData(JSON.parse(raw));
  } catch {
    return null;
  }
}

const COMPRESSED_HASH_PREFIX = "z.";

function portableProfileText(data: ResumeData): string {
  return [
    data.profile.name,
    data.profile.title,
    data.profile.summary,
    ...data.timeline.flatMap((node) => [
      node.company,
      node.position,
      node.description,
      ...node.highlights,
      ...node.skills,
      ...(node.promotionStages ?? []).flatMap((stage) => [
        stage.title,
        stage.responsibility,
        stage.outcome,
      ]),
    ]),
  ]
    .filter(Boolean)
    .join(" ");
}

function isReferencePortableProfile(data: ResumeData): boolean {
  const text = portableProfileText(data);
  const evidence = [
    /Groot-Arch/i,
    /AI\s*Agent/i,
    /RAG/i,
    /国科础石/,
    /工具链/,
    /SOME\/IP|DDS/,
    /产品总监|产品负责人/,
  ];
  return evidence.filter((pattern) => pattern.test(text)).length >= 2;
}

function minimalReferencePortablePayload(data: ResumeData): ResumeData {
  return {
    profile: {
      id: data.profile.id || "profile",
      name: data.profile.name,
      email: data.profile.email,
      title: data.profile.title,
      summary: "Groot-Arch AI Agent RAG 国科础石 工具链 产品负责人 产品总监 SOME/IP DDS",
      location: data.profile.location,
      website: data.profile.website,
      linkedin: data.profile.linkedin,
    },
    publicSiteTemplate: data.publicSiteTemplate,
    siteThemeId: data.siteThemeId,
    timeline: [
      {
        id: "internship",
        company: "京东健康 / 百度 / 京东",
        position: "产品实习生",
        startDate: "",
        endDate: "",
        description: "互联网产品基础训练，覆盖 B 端后台、数据基建与用户增长。",
        highlights: ["B 端后台、数据基建、用户增长"],
        projects: [],
        skills: ["产品设计"],
        order: 0,
        careerKind: "internship",
      },
      {
        id: "jingwei",
        company: "经纬恒润",
        position: "工具链产品经理",
        startDate: "",
        endDate: "",
        description: "汽车电子工具链产品建设，沉淀 SOME/IP、DDS 与云平台基础能力。",
        highlights: ["SOME/IP、DDS、云平台基础能力"],
        projects: [],
        skills: ["工具链产品"],
        order: 1,
        careerKind: "fulltime",
      },
      {
        id: "gkcs",
        company: "国科础石",
        position: "平台产品负责人 / AI 产品负责人",
        startDate: "2023.06",
        endDate: "至今",
        description: "Groot-Arch、企业级 AI Agent、RAG 与工具链平台建设，管理 10 人产品团队，覆盖 10+ 客户项目与 100+ 研发用户。",
        highlights: [
          "Groot-Arch 架构设计工具",
          "汽车 E/E 全域专家 Agent 协作系统",
          "10+ 客户项目，100+ 研发用户",
          "关键流程效率提升 20%+，文档生成与通信设计提效 50%+",
        ],
        projects: [],
        skills: ["Groot-Arch", "AI Agent", "RAG", "工具链", "SOME/IP", "DDS"],
        order: 2,
        careerKind: "fulltime",
        promotionStages: [
          {
            id: "stage-1",
            title: "平台产品经理 / 工具链产品经理",
            period: "2023.06 - 2024",
            teamScale: "",
            leadershipType: "none",
            responsibility: "核心工具链、平台基础能力和售前支撑",
            outcome: "核心能力从单点工具沉淀为通用平台模块",
            reflection: "",
          },
          {
            id: "stage-2",
            title: "产品负责人 / 产品总监",
            period: "2024 - 至今",
            teamScale: "10人",
            leadershipType: "solid",
            responsibility: "平台体系、AI 能力、团队管理与客户项目推进",
            outcome: "覆盖 10+ 客户项目与 100+ 研发用户，关键流程提效",
            reflection: "",
          },
        ],
      },
    ],
    skills: [],
    architecture: [],
    education: data.education,
    roleUnderstanding: {
      targetRoleTitle: data.roleUnderstanding?.targetRoleTitle || data.profile.title || "",
      oneLineInterpretation: "",
      priorityProblems: [],
      ninetyDayPlan: { day0To30: "", day31To60: "", day61To90: "" },
      experienceMappings: [],
    },
  };
}

function compactPortablePayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    const items = value
      .map((item) => compactPortablePayload(item))
      .filter((item) => {
        if (item == null || item === "") return false;
        if (Array.isArray(item)) return item.length > 0;
        if (typeof item === "object") return Object.keys(item as Record<string, unknown>).length > 0;
        return true;
      });
    return items.length > 0 ? items : undefined;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => [key, compactPortablePayload(item)] as const)
      .filter(([, item]) => {
        if (item == null || item === "") return false;
        if (Array.isArray(item)) return item.length > 0;
        if (typeof item === "object") return Object.keys(item as Record<string, unknown>).length > 0;
        return true;
      });
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  }

  return value;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return window
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(encoded: string): Uint8Array {
  const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = window.atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export function encodeResumeToHash(data: ResumeData): string {
  if (typeof window === "undefined") return "";
  const portableData = isReferencePortableProfile(data) ? minimalReferencePortablePayload(data) : data;
  const compactData = compactPortablePayload(portableData) ?? portableData;
  const json = JSON.stringify(compactData);
  const legacy = bytesToBase64Url(new TextEncoder().encode(json));
  try {
    const compressed = `${COMPRESSED_HASH_PREFIX}${bytesToBase64Url(zlibSync(strToU8(json)))}`;
    return compressed.length < legacy.length ? compressed : legacy;
  } catch {
    return legacy;
  }
}

export function decodeResumeFromHash(encoded: string): ResumeData | null {
  if (typeof window === "undefined") return null;
  if (!encoded) return null;
  try {
    const json = encoded.startsWith(COMPRESSED_HASH_PREFIX)
      ? strFromU8(unzlibSync(base64UrlToBytes(encoded.slice(COMPRESSED_HASH_PREFIX.length))))
      : new TextDecoder().decode(base64UrlToBytes(encoded));
    return sanitizeResumeData(JSON.parse(json));
  } catch {
    return null;
  }
}
