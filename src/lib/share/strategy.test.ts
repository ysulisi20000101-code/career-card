import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ResumeData } from "@/types";
import { mockResumeData } from "@/lib/mock-data";
import {
  buildShareArtifacts,
  choosePrimaryShareLink,
  resolveSharedResume,
} from "./strategy";

const smallResumeData: ResumeData = {
  profile: {
    id: "profile",
    name: "张三",
    email: "zhangsan@example.com",
    title: "高级产品经理",
    summary: "负责平台产品和 AI Agent 工作流。",
  },
  timeline: [],
  skills: [],
  architecture: [],
  education: [],
  roleUnderstanding: {
    targetRoleTitle: "高级产品经理",
    oneLineInterpretation: "",
    priorityProblems: [],
    ninetyDayPlan: { day0To30: "", day31To60: "", day61To90: "" },
    experienceMappings: [],
  },
};

beforeEach(() => {
  vi.stubGlobal("window", {
    btoa: (value: string) => Buffer.from(value, "binary").toString("base64"),
    atob: (value: string) => Buffer.from(value, "base64").toString("binary"),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("share strategy", () => {
  it("builds a portable hash link that can resolve without local storage", () => {
    const artifacts = buildShareArtifacts("https://example.com", "demo", smallResumeData);
    const encoded = artifacts.portableUrl.split("#d=")[1];

    const resolved = resolveSharedResume({
      hash: `#d=${encoded}`,
      slug: "demo",
      loadFromStorage: () => null,
    });

    expect(artifacts.portableLink.capability).toBe("portable");
    expect(resolved?.profile.name).toBe(smallResumeData.profile.name);
  });

  it("handles a malformed hash without throwing or reading local storage", () => {
    const resolved = resolveSharedResume({
      hash: "#d=not-valid-base64",
      slug: "demo",
      loadFromStorage: () => {
        throw new Error("local storage should not be read");
      },
    });

    expect(resolved).toBeNull();
  });

  it("marks oversized portable link as too-long but still ready for sharing", () => {
    const data = structuredClone(mockResumeData);
    data.profile.summary = "长期负责复杂产品规划、团队协作和客户交付。".repeat(500);

    const artifacts = buildShareArtifacts("https://example.com", "large", data);
    const primary = choosePrimaryShareLink({
      serverUrl: "",
      serverReady: false,
      serverAccessible: true,
      portableLink: artifacts.portableLink,
    });

    expect(artifacts.portableUrlTooLong).toBe(true);
    expect(artifacts.canRenderPortableQr).toBe(false);
    expect(artifacts.portableLink.ready).toBe(true);
    expect(primary.capability).toBe("portable");
  });

  it("prefers compact portable link when it fits normal sharing channels", () => {
    const artifacts = buildShareArtifacts("https://example.com", "demo", smallResumeData);

    const primary = choosePrimaryShareLink({
      serverUrl: "https://example.com/p/demo",
      serverReady: true,
      serverAccessible: true,
      portableLink: artifacts.portableLink,
    });

    expect(artifacts.portableLink.ready).toBe(true);
    expect(primary.capability).toBe("portable");
  });

  it("prefers verified server short link when portable link is too long", () => {
    const artifacts = buildShareArtifacts("https://example.com", "demo", smallResumeData);

    const primary = choosePrimaryShareLink({
      serverUrl: "https://example.com/p/demo",
      serverReady: true,
      serverAccessible: true,
      portableLink: artifacts.portableLink,
      portableUrlTooLong: true,
    });

    expect(primary.capability).toBe("server");
    expect(primary.url).toBe("https://example.com/p/demo");
  });

  it("keeps portable link primary when server link is local-only", () => {
    const artifacts = buildShareArtifacts("http://127.0.0.1:3000", "demo", smallResumeData);

    const primary = choosePrimaryShareLink({
      serverUrl: "http://127.0.0.1:3000/p/demo",
      serverReady: true,
      serverAccessible: false,
      portableLink: artifacts.portableLink,
    });

    expect(primary.capability).toBe("portable");
  });

  it("keeps reference-profile portable links short enough for WeChat sharing", () => {
    const data: ResumeData = {
      ...smallResumeData,
      profile: {
        ...smallResumeData.profile,
        name: "李锦涛",
        title: "产品负责人 / 产品总监",
        summary: "Groot-Arch、AI Agent、RAG、国科础石、工具链、SOME/IP、DDS。",
      },
      timeline: [
        {
          id: "gkcs",
          company: "国科础石",
          position: "平台产品负责人 / AI 产品负责人",
          startDate: "2023.06",
          endDate: "至今",
          description: "负责 Groot-Arch、AI Agent、RAG 与工具链平台建设。",
          highlights: ["10+ 客户项目", "100+ 研发用户"],
          projects: [],
          skills: ["Groot-Arch", "AI Agent", "RAG"],
          order: 0,
          careerKind: "fulltime",
        },
      ],
    };

    const artifacts = buildShareArtifacts("https://example.com", "lijintao", data);

    expect(artifacts.portableLink.ready).toBe(true);
    expect(artifacts.portableUrlTooLong).toBe(false);
    expect(artifacts.portableUrl.length).toBeLessThan(1800);
  });

  it("compresses portable payloads while preserving hash decoding", () => {
    const data = structuredClone(mockResumeData);
    data.profile.summary = "Agent workflow, RAG knowledge base, platform delivery. ".repeat(200);

    const artifacts = buildShareArtifacts("https://example.com", "compressed", data);
    const encoded = artifacts.portableUrl.split("#d=")[1];
    const plainEncoded = Buffer.from(JSON.stringify(data), "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
    const resolved = resolveSharedResume({
      hash: `#d=${encoded}`,
      slug: "compressed",
      loadFromStorage: () => null,
    });

    expect(encoded.length).toBeLessThan(plainEncoded.length);
    expect(resolved?.profile.name).toBe(data.profile.name);
  });
});
