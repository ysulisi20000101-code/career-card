import type { Metadata } from "next";
import { InterviewDemoShell } from "@/components/demo/interview-demo-shell";

export const metadata: Metadata = {
  title: "面试演示样例 — Career Card",
  description: "体验从简历到8页面试演示 PPT 的完整流程，包含增长飞轮、晋升弧线和量化成果展示。",
};

export default function InterviewDemoPage() {
  return <InterviewDemoShell />;
}
