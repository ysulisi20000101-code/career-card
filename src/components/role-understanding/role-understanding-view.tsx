"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RoleUnderstanding } from "@/types";

interface RoleUnderstandingViewProps {
  roleUnderstanding: RoleUnderstanding;
  compact?: boolean;
  presentationSection?: 0 | 1 | 2 | 3;
}

function sectionHasContent(roleUnderstanding: RoleUnderstanding) {
  return {
    A:
      Boolean(roleUnderstanding.targetRoleTitle) ||
      Boolean(roleUnderstanding.companyContext) ||
      Boolean(roleUnderstanding.oneLineInterpretation),
    B: roleUnderstanding.priorityProblems.some(
      (item) => item.problem || item.impact || item.evidence,
    ),
    C:
      Boolean(roleUnderstanding.ninetyDayPlan.day0To30) ||
      Boolean(roleUnderstanding.ninetyDayPlan.day31To60) ||
      Boolean(roleUnderstanding.ninetyDayPlan.day61To90),
    D: roleUnderstanding.experienceMappings.some(
      (item) => item.requirement || item.myExperience || item.outcomeEvidence,
    ),
  };
}

export function RoleUnderstandingView({
  roleUnderstanding,
  compact = false,
  presentationSection,
}: RoleUnderstandingViewProps) {
  const hasContent = useMemo(
    () =>
      roleUnderstanding.targetRoleTitle ||
      roleUnderstanding.oneLineInterpretation ||
      roleUnderstanding.priorityProblems.some((item) => item.problem || item.impact) ||
      roleUnderstanding.ninetyDayPlan.day0To30 ||
      roleUnderstanding.ninetyDayPlan.day31To60 ||
      roleUnderstanding.ninetyDayPlan.day61To90 ||
      roleUnderstanding.experienceMappings.some(
        (item) => item.requirement || item.myExperience || item.outcomeEvidence,
      ),
    [roleUnderstanding],
  );

  const has = sectionHasContent(roleUnderstanding);
  const [expanded, setExpanded] = useState<Record<"A" | "B" | "C" | "D", boolean>>({
    A: true,
    B: !compact,
    C: !compact,
    D: !compact,
  });
  const completionScore = useMemo(() => {
    const sectionCompletion =
      [has.A, has.B, has.C, has.D].filter(Boolean).length / 4;
    const supportRows = roleUnderstanding.experienceMappings.filter(
      (row) => row.requirement && row.myExperience && row.outcomeEvidence,
    ).length;
    const supportUsage = Math.min(
      1,
      supportRows / Math.max(1, roleUnderstanding.experienceMappings.length),
    );
    const measurableTerms = [
      "提升",
      "降低",
      "增长",
      "%",
      "转化",
      "时长",
      "效率",
      "结果",
    ];
    const measurableCount = [
      roleUnderstanding.ninetyDayPlan.day0To30,
      roleUnderstanding.ninetyDayPlan.day31To60,
      roleUnderstanding.ninetyDayPlan.day61To90,
      ...roleUnderstanding.priorityProblems.map(
        (problem) => `${problem.impact} ${problem.evidence ?? ""}`,
      ),
    ]
      .join(" ")
      .split(/\s+/)
      .filter((word) => measurableTerms.some((term) => word.includes(term))).length;
    const measurable = Math.min(1, measurableCount / 3);
    return Math.round((sectionCompletion * 0.4 + supportUsage * 0.3 + measurable * 0.3) * 100);
  }, [has.A, has.B, has.C, has.D, roleUnderstanding]);

  if (!hasContent) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
        暂无岗位理解内容
      </div>
    );
  }

  if (typeof presentationSection === "number") {
    const sectionTitles = [
      "A. 目标岗位快照",
      "B. 优先问题（Top 3）",
      "C. 90 天行动计划",
      "D. 经历映射",
    ] as const;
    return (
      <div className="mx-auto flex h-full w-full max-w-4xl items-center px-10 py-10">
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{sectionTitles[presentationSection]}</CardTitle>
              <Badge variant="secondary">准备度 {completionScore}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {presentationSection === 0 && (
              <>
                <p>
                  <span className="text-muted-foreground">目标岗位：</span>
                  {roleUnderstanding.targetRoleTitle || "未填写"}
                </p>
                <p>
                  <span className="text-muted-foreground">团队背景：</span>
                  {roleUnderstanding.companyContext || "未填写"}
                </p>
                <p>
                  <span className="text-muted-foreground">一句话理解：</span>
                  {roleUnderstanding.oneLineInterpretation || "未填写"}
                </p>
              </>
            )}
            {presentationSection === 1 &&
              roleUnderstanding.priorityProblems.map((item, index) => (
                <div key={item.id} className="rounded-md border p-3">
                  <Badge variant="outline" className="mb-2">
                    问题 {index + 1}
                  </Badge>
                  <p>
                    <span className="text-muted-foreground">问题：</span>
                    {item.problem || "未填写"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">影响：</span>
                    {item.impact || "未填写"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">依据：</span>
                    {item.evidence || "未填写"}
                  </p>
                </div>
              ))}
            {presentationSection === 2 && (
              <>
                <p>
                  <span className="text-muted-foreground">0-30 天：</span>
                  {roleUnderstanding.ninetyDayPlan.day0To30 || "未填写"}
                </p>
                <p>
                  <span className="text-muted-foreground">31-60 天：</span>
                  {roleUnderstanding.ninetyDayPlan.day31To60 || "未填写"}
                </p>
                <p>
                  <span className="text-muted-foreground">61-90 天：</span>
                  {roleUnderstanding.ninetyDayPlan.day61To90 || "未填写"}
                </p>
              </>
            )}
            {presentationSection === 3 &&
              roleUnderstanding.experienceMappings.map((item) => (
                <div key={item.id} className="rounded-md border p-3">
                  <p>
                    <span className="text-muted-foreground">岗位要求：</span>
                    {item.requirement || "未填写"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">相关经历：</span>
                    {item.myExperience || "未填写"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">结果支撑：</span>
                    {item.outcomeEvidence || "未填写"}
                  </p>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">A. 目标岗位快照</CardTitle>
            <Badge variant="secondary">准备度 {completionScore}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">目标岗位：</span>
            {roleUnderstanding.targetRoleTitle || "未填写"}
          </p>
          <p>
            <span className="text-muted-foreground">团队背景：</span>
            {roleUnderstanding.companyContext || "未填写"}
          </p>
          <p>
            <span className="text-muted-foreground">一句话理解：</span>
            {roleUnderstanding.oneLineInterpretation || "未填写"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          className={compact ? "cursor-pointer" : ""}
          onClick={compact ? () => setExpanded((state) => ({ ...state, B: !state.B })) : undefined}
        >
          <CardTitle className="text-base">B. 优先问题（Top 3）</CardTitle>
        </CardHeader>
        {expanded.B && (
          <CardContent className="space-y-3">
            {roleUnderstanding.priorityProblems.map((item, index) => (
              <div key={item.id} className="rounded-md border p-3 text-sm">
                <Badge variant="outline" className="mb-2">
                  问题 {index + 1}
                </Badge>
                <p>
                  <span className="text-muted-foreground">问题：</span>
                  {item.problem || "未填写"}
                </p>
                <p>
                  <span className="text-muted-foreground">影响：</span>
                  {item.impact || "未填写"}
                </p>
                {item.evidence ? (
                  <p>
                    <span className="text-muted-foreground">依据：</span>
                    {item.evidence}
                  </p>
                ) : null}
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader
          className={compact ? "cursor-pointer" : ""}
          onClick={compact ? () => setExpanded((state) => ({ ...state, C: !state.C })) : undefined}
        >
          <CardTitle className="text-base">C. 90 天行动计划</CardTitle>
        </CardHeader>
        {expanded.C && (
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">0-30 天：</span>
              {roleUnderstanding.ninetyDayPlan.day0To30 || "未填写"}
            </p>
            <p>
              <span className="text-muted-foreground">31-60 天：</span>
              {roleUnderstanding.ninetyDayPlan.day31To60 || "未填写"}
            </p>
            <p>
              <span className="text-muted-foreground">61-90 天：</span>
              {roleUnderstanding.ninetyDayPlan.day61To90 || "未填写"}
            </p>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader
          className={compact ? "cursor-pointer" : ""}
          onClick={compact ? () => setExpanded((state) => ({ ...state, D: !state.D })) : undefined}
        >
          <CardTitle className="text-base">D. 经历映射</CardTitle>
        </CardHeader>
        {expanded.D && (
          <CardContent className="space-y-3">
            {roleUnderstanding.experienceMappings.map((item) => (
              <div key={item.id} className="rounded-md border p-3 text-sm">
                <p>
                  <span className="text-muted-foreground">岗位要求：</span>
                  {item.requirement || "未填写"}
                </p>
                <p>
                  <span className="text-muted-foreground">相关经历：</span>
                  {item.myExperience || "未填写"}
                </p>
                <p>
                  <span className="text-muted-foreground">结果支撑：</span>
                  {item.outcomeEvidence || "未填写"}
                </p>
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
