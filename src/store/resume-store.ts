"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ResumeData,
  TimelineNode,
  SkillNode,
  ArchitectureModule,
  UserProfile,
  Education,
  EditorStep,
  ParseMeta,
  RoleUnderstanding,
  PublicSiteTemplate,
} from "@/types";
import { createDefaultRoleUnderstanding } from "@/lib/role-understanding/default";
import { buildSkillNodesFromProfile, buildSkillProfileFromResume } from "@/lib/skills/profile";

function normalizeResumeData(data: ResumeData): ResumeData {
  const skillProfile = data.skillProfile ?? buildSkillProfileFromResume(data);
  return {
    ...data,
    publicSiteTemplate: data.publicSiteTemplate ?? "executive-dossier",
    skillProfile,
    roleTemplateId: data.roleTemplateId ?? skillProfile.templateId,
    skills: data.skills?.length ? data.skills : buildSkillNodesFromProfile(skillProfile),
    roleUnderstanding:
      data.roleUnderstanding ?? createDefaultRoleUnderstanding(data.timeline[0]?.position ?? ""),
  };
}

interface ResumeStore {
  resumeData: ResumeData | null;
  parseMeta: ParseMeta | null;
  currentStep: EditorStep;
  activeTimelineId: string | null;
  isPresenting: boolean;

  setResumeData: (data: ResumeData) => void;
  setParseMeta: (meta: ParseMeta | null) => void;
  resetResumeData: () => void;
  setCurrentStep: (step: EditorStep) => void;
  setActiveTimelineId: (id: string | null) => void;
  setIsPresenting: (presenting: boolean) => void;

  updateProfile: (profile: Partial<UserProfile>) => void;
  updatePublicSiteTemplate: (template: PublicSiteTemplate) => void;
  updateTimeline: (timeline: TimelineNode[]) => void;
  updateTimelineNode: (id: string, data: Partial<TimelineNode>) => void;
  addTimelineNode: (node: TimelineNode) => void;
  removeTimelineNode: (id: string) => void;

  updateSkills: (skills: SkillNode[]) => void;
  updateSkillNode: (id: string, data: Partial<SkillNode>) => void;
  addSkillNode: (node: SkillNode) => void;
  removeSkillNode: (id: string) => void;

  updateArchitecture: (modules: ArchitectureModule[]) => void;
  updateArchitectureModule: (id: string, data: Partial<ArchitectureModule>) => void;
  addArchitectureModule: (mod: ArchitectureModule) => void;
  removeArchitectureModule: (id: string) => void;

  updateEducation: (education: Education[]) => void;
  updateRoleUnderstanding: (roleUnderstanding: RoleUnderstanding) => void;
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set) => ({
      resumeData: null,
      parseMeta: null,
      currentStep: "upload",
      activeTimelineId: null,
      isPresenting: false,

      setResumeData: (data) => set({ resumeData: normalizeResumeData(data) }),
      setParseMeta: (meta) => set({ parseMeta: meta }),
      resetResumeData: () =>
        set({
          resumeData: null,
          parseMeta: null,
          currentStep: "upload",
          activeTimelineId: null,
        }),
      setCurrentStep: (step) => set({ currentStep: step }),
      setActiveTimelineId: (id) => set({ activeTimelineId: id }),
      setIsPresenting: (presenting) => set({ isPresenting: presenting }),

      updateProfile: (profile) =>
        set((state) => ({
          resumeData: state.resumeData
            ? { ...state.resumeData, profile: { ...state.resumeData.profile, ...profile } }
            : null,
        })),

      updatePublicSiteTemplate: (template) =>
        set((state) => ({
          resumeData: state.resumeData
            ? { ...state.resumeData, publicSiteTemplate: template }
            : null,
        })),

      updateTimeline: (timeline) =>
        set((state) => ({
          resumeData: state.resumeData ? { ...state.resumeData, timeline } : null,
        })),

      updateTimelineNode: (id, data) =>
        set((state) => ({
          resumeData: state.resumeData
            ? {
                ...state.resumeData,
                timeline: state.resumeData.timeline.map((n) =>
                  n.id === id ? { ...n, ...data } : n,
                ),
              }
            : null,
        })),

      addTimelineNode: (node) =>
        set((state) => ({
          resumeData: state.resumeData
            ? { ...state.resumeData, timeline: [...state.resumeData.timeline, node] }
            : null,
        })),

      removeTimelineNode: (id) =>
        set((state) => ({
          resumeData: state.resumeData
            ? { ...state.resumeData, timeline: state.resumeData.timeline.filter((n) => n.id !== id) }
            : null,
        })),

      updateSkills: (skills) =>
        set((state) => ({
          resumeData: state.resumeData ? { ...state.resumeData, skills } : null,
        })),

      updateSkillNode: (id, data) =>
        set((state) => ({
          resumeData: state.resumeData
            ? {
                ...state.resumeData,
                skills: state.resumeData.skills.map((n) =>
                  n.id === id ? { ...n, ...data } : n,
                ),
              }
            : null,
        })),

      addSkillNode: (node) =>
        set((state) => ({
          resumeData: state.resumeData
            ? { ...state.resumeData, skills: [...state.resumeData.skills, node] }
            : null,
        })),

      removeSkillNode: (id) =>
        set((state) => ({
          resumeData: state.resumeData
            ? (() => {
                const nodes = state.resumeData.skills;
                const toRemove = new Set<string>();
                const stack = [id];
                while (stack.length > 0) {
                  const current = stack.pop()!;
                  if (toRemove.has(current)) continue;
                  toRemove.add(current);
                  nodes
                    .filter((node) => node.parentId === current)
                    .forEach((child) => stack.push(child.id));
                }

                return {
                  ...state.resumeData,
                  skills: nodes.filter((node) => !toRemove.has(node.id)),
                };
              })()
            : null,
        })),

      updateArchitecture: (modules) =>
        set((state) => ({
          resumeData: state.resumeData ? { ...state.resumeData, architecture: modules } : null,
        })),

      updateArchitectureModule: (id, data) =>
        set((state) => ({
          resumeData: state.resumeData
            ? {
                ...state.resumeData,
                architecture: state.resumeData.architecture.map((m) =>
                  m.id === id ? { ...m, ...data } : m,
                ),
              }
            : null,
        })),

      addArchitectureModule: (mod) =>
        set((state) => ({
          resumeData: state.resumeData
            ? { ...state.resumeData, architecture: [...state.resumeData.architecture, mod] }
            : null,
        })),

      removeArchitectureModule: (id) =>
        set((state) => ({
          resumeData: state.resumeData
            ? {
                ...state.resumeData,
                architecture: (() => {
                  const modules = state.resumeData!.architecture;
                  const toRemove = new Set<string>();
                  const stack = [id];
                  while (stack.length > 0) {
                    const current = stack.pop()!;
                    if (toRemove.has(current)) continue;
                    toRemove.add(current);
                    modules
                      .filter((module) => module.parentId === current)
                      .forEach((child) => stack.push(child.id));
                  }
                  return modules.filter((module) => !toRemove.has(module.id));
                })(),
              }
            : null,
        })),

      updateEducation: (education) =>
        set((state) => ({
          resumeData: state.resumeData ? { ...state.resumeData, education } : null,
        })),

      updateRoleUnderstanding: (roleUnderstanding) =>
        set((state) => ({
          resumeData: state.resumeData
            ? { ...state.resumeData, roleUnderstanding }
            : null,
        })),
    }),
    {
      name: "career-card:editor",
      version: 1,
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
          };
        }
        return window.localStorage;
      }),
      partialize: (state) => ({
        resumeData: state.resumeData,
        parseMeta: state.parseMeta,
        currentStep: state.currentStep,
      }),
      migrate: (persistedState) => {
        const state = persistedState as Partial<ResumeStore> | undefined;
        if (!state?.resumeData) return state as ResumeStore;
        return {
          ...state,
          resumeData: normalizeResumeData(state.resumeData),
        } as ResumeStore;
      },
    },
  ),
);
