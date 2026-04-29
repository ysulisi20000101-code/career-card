import { runCareerCardAgentWithProvider } from "./provider";
import type { AgentEvalCase } from "./eval-cases";
import { patchMatchesPrefixes } from "./eval-cases";

export interface AgentEvalResult {
  id: string;
  title: string;
  passed: boolean;
  failures: string[];
}

function includesAll<T>(actual: T[], expected?: T[]): boolean {
  if (!expected || expected.length === 0) return true;
  return expected.every((item) => actual.includes(item));
}

export async function evaluateCareerAgentCase(testCase: AgentEvalCase): Promise<AgentEvalResult> {
  const response = await runCareerCardAgentWithProvider(testCase.input);
  const failures: string[] = [];
  const expectations = testCase.expectations;

  if (expectations.type && response.type !== expectations.type) {
    failures.push(`Expected type ${expectations.type}, got ${response.type}`);
  }
  if (expectations.minQuestions !== undefined && response.questions.length < expectations.minQuestions) {
    failures.push(`Expected at least ${expectations.minQuestions} questions, got ${response.questions.length}`);
  }
  if (!includesAll(response.questions.map((item) => item.id), expectations.questionIds)) {
    failures.push(`Missing expected question ids: ${expectations.questionIds?.join(", ")}`);
  }
  if (expectations.minPatches !== undefined && response.patches.length < expectations.minPatches) {
    failures.push(`Expected at least ${expectations.minPatches} patches, got ${response.patches.length}`);
  }
  if (expectations.patchPaths && !includesAll(response.patches.map((item) => item.path), expectations.patchPaths)) {
    failures.push(`Missing expected patch paths: ${expectations.patchPaths.join(", ")}`);
  }
  if (
    expectations.patchPathPrefixes &&
    response.patches.length > 0 &&
    !patchMatchesPrefixes(response.patches, expectations.patchPathPrefixes)
  ) {
    failures.push(`Patch paths did not all match prefixes: ${expectations.patchPathPrefixes.join(", ")}`);
  }
  if (
    expectations.findingSeverities &&
    !expectations.findingSeverities.every((severity) =>
      response.findings.some((finding) => finding.severity === severity),
    )
  ) {
    failures.push(`Missing expected finding severities: ${expectations.findingSeverities.join(", ")}`);
  }
  if (expectations.summaryIncludes && !response.summary.includes(expectations.summaryIncludes)) {
    failures.push(`Summary did not include: ${expectations.summaryIncludes}`);
  }
  if (response.patches.some((item) => !item.requiresConfirmation)) {
    failures.push("All patches must require confirmation");
  }

  return {
    id: testCase.id,
    title: testCase.title,
    passed: failures.length === 0,
    failures,
  };
}

export async function evaluateCareerAgentCases(cases: AgentEvalCase[]): Promise<AgentEvalResult[]> {
  return Promise.all(cases.map(evaluateCareerAgentCase));
}
