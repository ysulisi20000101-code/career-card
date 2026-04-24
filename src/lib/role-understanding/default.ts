import { generateId } from "@/lib/utils";
import type { RoleUnderstanding } from "@/types";

export function createDefaultRoleUnderstanding(targetRoleTitle = ""): RoleUnderstanding {
  return {
    targetRoleTitle,
    companyContext: "",
    oneLineInterpretation: "",
    priorityProblems: [
      { id: generateId(), problem: "", impact: "", evidence: "" },
      { id: generateId(), problem: "", impact: "", evidence: "" },
      { id: generateId(), problem: "", impact: "", evidence: "" },
    ],
    ninetyDayPlan: {
      day0To30: "",
      day31To60: "",
      day61To90: "",
    },
    experienceMappings: [
      { id: generateId(), requirement: "", myExperience: "", outcomeEvidence: "" },
    ],
  };
}
