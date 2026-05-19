"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Briefcase,
  GraduationCap,
  Wrench,
  Check,
  X,
  Plus,
  Sparkles,
  Pencil,
} from "lucide-react";
import { useResumeStore } from "@/store/resume-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TimelineNode, Education } from "@/types";

function Section({
  icon: Icon,
  title,
  children,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  );
}

function EditableField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function save() {
    onChange(draft);
    setEditing(false);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  function startEdit() {
    setDraft(value);
    setEditing(true);
  }

  if (editing) {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          {label}
        </label>
        {multiline ? (
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            autoFocus
          />
        ) : (
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
          />
        )}
        <div className="flex gap-1.5">
          <Button size="sm" onClick={save}>
            <Check className="mr-1 h-3 w-3" />
            保存
          </Button>
          <Button size="sm" variant="ghost" onClick={cancel}>
            <X className="mr-1 h-3 w-3" />
            取消
          </Button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      className="group flex w-full cursor-text items-start justify-between rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-sm break-words">
          {value || <span className="italic text-muted-foreground">未填写</span>}
        </div>
      </div>
      <span className="mt-0.5 shrink-0 rounded px-1 text-[10px] text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100">
        点击编辑
      </span>
    </button>
  );
}

export function ConfirmPage({
  onGenerate,
  mode = "personal",
}: {
  onGenerate?: () => void;
  mode?: "personal" | "interview";
}) {
  const resumeData = useResumeStore((s) => s.resumeData);
  const parseMeta = useResumeStore((s) => s.parseMeta);
  const updateProfile = useResumeStore((s) => s.updateProfile);
  const updateTimelineNode = useResumeStore((s) => s.updateTimelineNode);
  const updateEducation = useResumeStore((s) => s.updateEducation);
  const setCurrentStep = useResumeStore((s) => s.setCurrentStep);
  const [newHighlight, setNewHighlight] = useState<Record<string, string>>({});

  const handleGenerate = () => {
    if (onGenerate) {
      onGenerate();
    } else {
      setCurrentStep("edit");
    }
  };

  if (!resumeData) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-zinc-900">数据未加载</p>
          <p className="mt-2 text-sm text-zinc-500">请先上传简历或手动填写信息。</p>
          <button
            onClick={() => setCurrentStep("upload")}
            className="mt-4 inline-block text-sm text-indigo-600 hover:underline"
          >
            返回上传
          </button>
        </div>
      </div>
    );
  }

  const { profile, timeline, education, skills } = resumeData;

  function handleTimelineFieldChange(
    id: string,
    field: keyof TimelineNode,
    value: string
  ) {
    updateTimelineNode(id, { [field]: value } as Partial<TimelineNode>);
  }

  function handleEducationFieldChange(
    id: string,
    field: keyof Education,
    value: string
  ) {
    const updated = education.map((e) =>
      e.id === id ? { ...e, [field]: value } : e
    );
    updateEducation(updated);
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 pb-16">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h2 className="text-2xl font-bold">确认解析结果</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          已完成智能解析（文本提取 + 规则识别），请重点核对并补全信息
        </p>
      </motion.div>

      {parseMeta && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"
        >
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="secondary">解析准备度 {parseMeta.confidence.overall}</Badge>
            <Badge variant="outline">个人信息 {parseMeta.confidence.profile}</Badge>
            <Badge variant="outline">工作经历 {parseMeta.confidence.timeline}</Badge>
            <Badge variant="outline">教育 {parseMeta.confidence.education}</Badge>
            <Badge variant="outline">技能 {parseMeta.confidence.skills}</Badge>
          </div>
          {parseMeta.confidence.needsConfirmation.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-zinc-600">
              {parseMeta.confidence.needsConfirmation.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          )}
        </motion.div>
      )}

      {/* Profile */}
      <Section icon={User} title="个人信息" delay={0.05}>
        <div className="grid gap-1 sm:grid-cols-2">
          <EditableField
            label="姓名"
            value={profile.name}
            onChange={(v) => updateProfile({ name: v })}
          />
          <EditableField
            label="职位"
            value={profile.title ?? ""}
            onChange={(v) => updateProfile({ title: v })}
          />
          <EditableField
            label="邮箱"
            value={profile.email}
            onChange={(v) => updateProfile({ email: v })}
          />
          <EditableField
            label="电话"
            value={profile.phone ?? ""}
            onChange={(v) => updateProfile({ phone: v })}
          />
          <EditableField
            label="所在地"
            value={profile.location ?? ""}
            onChange={(v) => updateProfile({ location: v })}
          />
          <EditableField
            label="网站"
            value={profile.website ?? ""}
            onChange={(v) => updateProfile({ website: v })}
          />
        </div>
        <EditableField
          label="个人简介"
          value={profile.summary ?? ""}
          onChange={(v) => updateProfile({ summary: v })}
          multiline
        />
      </Section>

      {/* Timeline */}
      <Section icon={Briefcase} title="工作经历" delay={0.1}>
        <div className="space-y-4">
          {timeline.map((node) => (
            <div
              key={node.id}
              className="rounded-lg border border-zinc-100 p-4"
            >
              <div className="grid gap-1 sm:grid-cols-2">
                <EditableField
                  label="公司"
                  value={node.company}
                  onChange={(v) =>
                    handleTimelineFieldChange(node.id, "company", v)
                  }
                />
                <EditableField
                  label="职位"
                  value={node.position}
                  onChange={(v) =>
                    handleTimelineFieldChange(node.id, "position", v)
                  }
                />
                <EditableField
                  label="开始时间"
                  value={node.startDate}
                  onChange={(v) =>
                    handleTimelineFieldChange(node.id, "startDate", v)
                  }
                />
                <EditableField
                  label="结束时间"
                  value={node.endDate}
                  onChange={(v) =>
                    handleTimelineFieldChange(node.id, "endDate", v)
                  }
                />
              </div>
              <EditableField
                label="工作描述"
                value={node.description}
                onChange={(v) =>
                  handleTimelineFieldChange(node.id, "description", v)
                }
                multiline
              />
              <div className="mt-2 space-y-2 px-2">
                <div className="flex flex-wrap gap-1.5">
                  {node.highlights.map((h, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 text-xs">
                      {h}
                      <button
                        type="button"
                        onClick={() =>
                          updateTimelineNode(node.id, {
                            highlights: node.highlights.filter((_, idx) => idx !== i),
                          })
                        }
                        className="ml-0.5 rounded-full hover:bg-zinc-300"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <Input
                    value={newHighlight[node.id] ?? ""}
                    onChange={(e) =>
                      setNewHighlight((prev) => ({ ...prev, [node.id]: e.target.value }))
                    }
                    placeholder="添加亮点"
                    className="h-7 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (newHighlight[node.id] ?? "").trim()) {
                        e.preventDefault();
                        updateTimelineNode(node.id, {
                          highlights: [...node.highlights, newHighlight[node.id].trim()],
                        });
                        setNewHighlight((prev) => ({ ...prev, [node.id]: "" }));
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2"
                    onClick={() => {
                      const val = (newHighlight[node.id] ?? "").trim();
                      if (val) {
                        updateTimelineNode(node.id, {
                          highlights: [...node.highlights, val],
                        });
                        setNewHighlight((prev) => ({ ...prev, [node.id]: "" }));
                      }
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Education */}
      <Section icon={GraduationCap} title="教育背景" delay={0.15}>
        <div className="space-y-4">
          {education.map((edu) => (
            <div
              key={edu.id}
              className="rounded-lg border border-zinc-100 p-4"
            >
              <div className="grid gap-1 sm:grid-cols-2">
                <EditableField
                  label="学校"
                  value={edu.school}
                  onChange={(v) =>
                    handleEducationFieldChange(edu.id, "school", v)
                  }
                />
                <EditableField
                  label="学位"
                  value={edu.degree}
                  onChange={(v) =>
                    handleEducationFieldChange(edu.id, "degree", v)
                  }
                />
                <EditableField
                  label="专业"
                  value={edu.major}
                  onChange={(v) =>
                    handleEducationFieldChange(edu.id, "major", v)
                  }
                />
                <EditableField
                  label="开始时间"
                  value={edu.startDate}
                  onChange={(v) =>
                    handleEducationFieldChange(edu.id, "startDate", v)
                  }
                />
                <EditableField
                  label="结束时间"
                  value={edu.endDate}
                  onChange={(v) =>
                    handleEducationFieldChange(edu.id, "endDate", v)
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Skills */}
      <Section icon={Wrench} title="技能列表" delay={0.2}>
        <div className="flex flex-wrap gap-2">
          {skills
            .filter((s) => s.parentId !== null)
            .map((skill) => (
              <Badge key={skill.id} variant="secondary">
                {skill.name}
                <span className="ml-1 text-xs text-muted-foreground">
                  Lv.{skill.level}
                </span>
              </Badge>
            ))}
        </div>
      </Section>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col items-center gap-3 pt-4"
      >
        <Button
          size="lg"
          className="gap-2 rounded-full px-10"
          onClick={handleGenerate}
        >
          <Sparkles className="h-4 w-4" />
          {mode === "interview" ? "生成面试 PPT" : "生成网站"}
        </Button>
        <button
          type="button"
          onClick={() => setCurrentStep("edit")}
          className="flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-zinc-600"
        >
          <Pencil className="h-3.5 w-3.5" />
          或者先手动编辑
        </button>
      </motion.div>
      </div>
    </div>
  );
}
