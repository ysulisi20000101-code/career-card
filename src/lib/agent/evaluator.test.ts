import { describe, expect, it } from "vitest";
import { agentEvalCases } from "./eval-cases";
import { evaluateCareerAgentCases } from "./evaluator";

describe("career agent golden-case evals", () => {
  it("passes the current deterministic baseline cases", async () => {
    const results = await evaluateCareerAgentCases(agentEvalCases);
    const failed = results.filter((result) => !result.passed);

    expect(failed).toEqual([]);
  });
});
