import { describe, expect, it } from "vitest";
import { getPublishChecks, hasBlockingPublishChecks } from "./publish-checks";
import { mockResumeData } from "../mock-data";

describe("publish checks", () => {
  it("passes baseline checks for a complete profile", () => {
    const checks = getPublishChecks(mockResumeData);

    expect(hasBlockingPublishChecks(checks)).toBe(false);
    expect(checks.find((item) => item.id === "highlight-support")?.severity).toBe("passed");
  });

  it("blocks publish when identity and timeline are missing", () => {
    const data = structuredClone(mockResumeData);
    data.profile.name = "";
    data.timeline = [];

    const checks = getPublishChecks(data);

    expect(hasBlockingPublishChecks(checks)).toBe(true);
    expect(checks.find((item) => item.id === "profile-name")?.severity).toBe("blocker");
    expect(checks.find((item) => item.id === "core-experience")?.severity).toBe("blocker");
  });
});
