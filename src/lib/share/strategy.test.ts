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

  it("does not downgrade an oversized portable link to a local-only share link", () => {
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
    expect(artifacts.localPreviewLink.capability).toBe("localOnly");
    expect(primary.capability).toBe("unavailable");
  });

  it("prefers a server link when it is ready and accessible", () => {
    const artifacts = buildShareArtifacts("https://example.com", "demo", smallResumeData);

    const primary = choosePrimaryShareLink({
      serverUrl: "https://example.com/p/demo",
      serverReady: true,
      serverAccessible: true,
      portableLink: artifacts.portableLink,
    });

    expect(primary.capability).toBe("server");
    expect(primary.url).toBe("https://example.com/p/demo");
  });
});
