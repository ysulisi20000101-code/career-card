"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Eye, Palette, Upload } from "lucide-react";
import { useResumeStore } from "@/store/resume-store";
import { loadPersonalProject, savePersonalProject } from "@/lib/projects/registry";
import { personalToResumeData, resumeDataToPersonal } from "@/lib/projects/adapters";
import { UploadPage } from "@/components/upload/upload-page";
import { ConfirmPage } from "@/components/editor/confirm-page";
import { EditPage } from "@/components/editor/edit-page";
import { AppShell } from "@/components/shell/app-shell";
import { StepIndicator, type StepItem } from "@/components/shell/step-indicator";
import { PageFooterNav } from "@/components/shell/page-footer-nav";
import { Button } from "@/components/ui/button";
import type { EditorStep } from "@/types";

const steps: StepItem<EditorStep>[] = [
  { key: "upload", label: "上传简历", icon: Upload },
  { key: "confirm", label: "确认信息", icon: CheckCircle2 },
  { key: "edit", label: "可视化编辑", icon: Palette },
];
const stepOrder: EditorStep[] = steps.map((s) => s.key);

export default function PersonalEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const resumeData = useResumeStore((s) => s.resumeData);
  const currentStep = useResumeStore((s) => s.currentStep);
  const setCurrentStep = useResumeStore((s) => s.setCurrentStep);
  const setResumeData = useResumeStore((s) => s.setResumeData);
  const resetResumeData = useResumeStore((s) => s.resetResumeData);

  useEffect(() => {
    resetResumeData();
    const existing = loadPersonalProject(id);
    if (existing) {
      setResumeData(personalToResumeData(existing));
      setCurrentStep("edit");
    } else {
      setCurrentStep("upload");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!resumeData) return;
    savePersonalProject(id, resumeDataToPersonal(resumeData));
  }, [id, resumeData]);

  const currentIdx = stepOrder.indexOf(currentStep);
  const canGoBack = currentIdx > 0;
  const canGoForward =
    currentIdx >= 0 && currentIdx < stepOrder.length - 1 && currentStep !== "upload";

  return (
    <AppShell
      breadcrumbs={[
        { label: "工作台", href: "/workspace" },
        { label: "个人网站" },
        { label: "编辑" },
      ]}
      actions={
        <>
          <Link href="/workspace">
            <Button size="sm" variant="ghost" className="rounded-full">
              返回工作台
            </Button>
          </Link>
          <Link href={`/workspace/personal/${id}/preview`}>
            <Button size="sm" variant="brand" className="gap-1.5 rounded-full">
              <Eye className="h-3.5 w-3.5" />
              进入网站预览
            </Button>
          </Link>
        </>
      }
      footer={
        <PageFooterNav
          onPrev={() => setCurrentStep(stepOrder[currentIdx - 1])}
          onNext={() =>
            canGoForward ? setCurrentStep(stepOrder[currentIdx + 1]) : null
          }
          disablePrev={!canGoBack}
          disableNext={!canGoForward}
          hint={`${currentIdx + 1} / ${stepOrder.length}`}
        />
      }
    >
      <div className="flex h-full flex-col">
        <div className="border-b border-zinc-100 bg-white/70 px-4 py-3 backdrop-blur lg:px-8">
          <StepIndicator<EditorStep>
            steps={steps}
            current={currentStep}
            onStepClick={(key) => setCurrentStep(key)}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          {currentStep === "upload" && <UploadPage />}
          {currentStep === "confirm" && <ConfirmPage />}
          {currentStep === "edit" && (
            <EditPage
              mode="personal"
              onEnterPreview={() => router.push(`/workspace/personal/${id}/preview`)}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
