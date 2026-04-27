import { describe, expect, it } from "vitest";
import { buildPublicSiteViewModel } from "./view-model";
import { mockResumeData } from "../mock-data";

describe("buildPublicSiteViewModel", () => {
  it("builds role-focused summary data from resume input", () => {
    const viewModel = buildPublicSiteViewModel(mockResumeData);

    expect(viewModel.overview.targetRole).toContain("高级产品经理");
    expect(viewModel.primarySkills.length).toBeGreaterThan(0);
    expect(viewModel.details.some((detail) => detail.meta.includes("字节跳动"))).toBe(true);
    expect(viewModel.hasArchitectureSignal).toBe(true);
  });

  it("falls back gracefully when architecture should stay hidden", () => {
    const data = structuredClone(mockResumeData);
    data.profile.title = "运营专员";
    data.roleUnderstanding.targetRoleTitle = "运营专员";
    data.skillProfile = undefined;
    data.architecture = [];

    const viewModel = buildPublicSiteViewModel(data);

    expect(viewModel.hasArchitectureSignal).toBe(false);
    expect(viewModel.overview.targetRole).toBe("运营专员");
  });
});
