"use client";

import { generateId } from "@/lib/utils";
import { useResumeStore } from "@/store/resume-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function RoleUnderstandingEditor() {
  const resumeData = useResumeStore((state) => state.resumeData);
  const updateRoleUnderstanding = useResumeStore(
    (state) => state.updateRoleUnderstanding,
  );

  if (!resumeData) return null;
  const role = resumeData.roleUnderstanding;

  const updateField = (
    field: "targetRoleTitle" | "companyContext" | "oneLineInterpretation",
    value: string,
  ) => {
    updateRoleUnderstanding({ ...role, [field]: value });
  };

  const updateProblem = (
    id: string,
    key: "problem" | "impact" | "evidence",
    value: string,
  ) => {
    updateRoleUnderstanding({
      ...role,
      priorityProblems: role.priorityProblems.map((item) =>
        item.id === id ? { ...item, [key]: value } : item,
      ),
    });
  };

  const updatePlan = (
    key: "day0To30" | "day31To60" | "day61To90",
    value: string,
  ) => {
    updateRoleUnderstanding({
      ...role,
      ninetyDayPlan: { ...role.ninetyDayPlan, [key]: value },
    });
  };

  const updateMapping = (
    id: string,
    key: "requirement" | "myExperience" | "outcomeEvidence",
    value: string,
  ) => {
    updateRoleUnderstanding({
      ...role,
      experienceMappings: role.experienceMappings.map((item) =>
        item.id === id ? { ...item, [key]: value } : item,
      ),
    });
  };

  const addMapping = () => {
    updateRoleUnderstanding({
      ...role,
      experienceMappings: [
        ...role.experienceMappings,
        { id: generateId(), requirement: "", myExperience: "", outcomeEvidence: "" },
      ],
    });
  };

  return (
    <div className="space-y-6 p-4">
      <div>
        <h2 className="text-lg font-semibold">岗位理解模块</h2>
        <p className="text-sm text-muted-foreground">
          按 A 到 D 逐段填写，帮助面试中快速讲清角色匹配。
        </p>
      </div>

      <section className="space-y-3 rounded-lg border p-4">
        <h3 className="text-sm font-medium">A. 目标岗位快照</h3>
        <Input
          placeholder="目标岗位名称"
          value={role.targetRoleTitle}
          maxLength={80}
          onChange={(e) => updateField("targetRoleTitle", e.target.value)}
        />
        <Input
          placeholder="公司/团队背景（可选）"
          value={role.companyContext ?? ""}
          onChange={(e) => updateField("companyContext", e.target.value)}
        />
        <Textarea
          placeholder="一句话描述岗位核心价值（80 字以内）"
          value={role.oneLineInterpretation}
          maxLength={80}
          onChange={(e) => updateField("oneLineInterpretation", e.target.value)}
        />
      </section>

      <section className="space-y-3 rounded-lg border p-4">
        <h3 className="text-sm font-medium">B. 优先问题（Top 3）</h3>
        {role.priorityProblems.map((item, index) => (
          <div key={item.id} className="space-y-2 rounded-md border p-3">
            <p className="text-xs text-muted-foreground">问题 {index + 1}</p>
            <Textarea
              placeholder="问题陈述（120 字以内）"
              value={item.problem}
              maxLength={120}
              onChange={(e) => updateProblem(item.id, "problem", e.target.value)}
            />
            <Textarea
              placeholder="影响了什么指标或体验（120 字以内）"
              value={item.impact}
              maxLength={120}
              onChange={(e) => updateProblem(item.id, "impact", e.target.value)}
            />
            <Input
              placeholder="现状依据（可选）"
              value={item.evidence ?? ""}
              onChange={(e) => updateProblem(item.id, "evidence", e.target.value)}
            />
          </div>
        ))}
      </section>

      <section className="space-y-3 rounded-lg border p-4">
        <h3 className="text-sm font-medium">C. 90 天计划</h3>
        <Textarea
          placeholder="0-30 天：理解与诊断（180 字以内）"
          value={role.ninetyDayPlan.day0To30}
          maxLength={180}
          onChange={(e) => updatePlan("day0To30", e.target.value)}
        />
        <Textarea
          placeholder="31-60 天：方案与对齐（180 字以内）"
          value={role.ninetyDayPlan.day31To60}
          maxLength={180}
          onChange={(e) => updatePlan("day31To60", e.target.value)}
        />
        <Textarea
          placeholder="61-90 天：执行与产出（180 字以内）"
          value={role.ninetyDayPlan.day61To90}
          maxLength={180}
          onChange={(e) => updatePlan("day61To90", e.target.value)}
        />
      </section>

      <section className="space-y-3 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">D. 经历映射</h3>
          <Button size="sm" variant="outline" onClick={addMapping}>
            添加映射
          </Button>
        </div>
        {role.experienceMappings.map((item) => (
          <div key={item.id} className="space-y-2 rounded-md border p-3">
            <Input
              placeholder="岗位要求"
              value={item.requirement}
              maxLength={200}
              onChange={(e) => updateMapping(item.id, "requirement", e.target.value)}
            />
            <Input
              placeholder="我的相关经历"
              value={item.myExperience}
              maxLength={200}
              onChange={(e) => updateMapping(item.id, "myExperience", e.target.value)}
            />
            <Input
              placeholder="结果支撑"
              value={item.outcomeEvidence}
              maxLength={200}
              onChange={(e) =>
                updateMapping(item.id, "outcomeEvidence", e.target.value)
              }
            />
          </div>
        ))}
      </section>
    </div>
  );
}
