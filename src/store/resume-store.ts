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
import type { CareerSiteDraft } from "@/lib/agent/site-generator/types";
import { createDefaultRoleUnderstanding } from "@/lib/role-understanding/default";
import { buildSkillNodesFromProfile, buildSkillProfileFromResume } from "@/lib/skills/profile";

const SCHEMA_VERSION = 1;

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

function mergeNormalized(prev: ResumeData, next: ResumeData): ResumeData {
  const normalized = normalizeResumeData(next);
  return { ...next, skills: normalized.skills, skillProfile: normalized.skillProfile, roleUnderstanding: normalized.roleUnderstanding };
}

interface ResumeStore {
  resumeData: ResumeData | null;
  parseMeta: ParseMeta | null;
  currentStep: EditorStep;
  activeTimelineId: string | null;
  isPresenting: boolean;
  draftData: CareerSiteDraft | null;
  activeSiteId: string | null;
  interviewNotes: string;

  setResumeData: (data: ResumeData) => void;
  setParseMeta: (meta: ParseMeta | null) => void;
  resetResumeData: () => void;
  setCurrentStep: (step: EditorStep) => void;
  setActiveTimelineId: (id: string | null) => void;
  setIsPresenting: (presenting: boolean) => void;
  setDraftData: (draft: CareerSiteDraft | null) => void;
  setActiveSiteId: (siteId: string | null) => void;
  setInterviewNotes: (notes: string) => void;

  updateProfile: (profile: Partial<UserProfile>) => void;
  updatePublicSiteTemplate: (template: PublicSiteTemplate) => void;
  updateSiteThemeId: (themeId: string) => void;
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
      draftData: null,
      activeSiteId: null,
      interviewNotes: "",

      setResumeData: (data) => set({ resumeData: normalizeResumeData(data) }),
      setParseMeta: (meta) => set({ parseMeta: meta }),
      resetResumeData: () =>
        set({
          resumeData: null,
          parseMeta: null,
          currentStep: "upload",
          activeTimelineId: null,
          draftData: null,
          activeSiteId: null,
          interviewNotes: "",
        }),
      setCurrentStep: (step) => set({ currentStep: step }),
      setActiveTimelineId: (id) => set({ activeTimelineId: id }),
      setIsPresenting: (presenting) => set({ isPresenting: presenting }),
      setDraftData: (draft) => set({ draftData: draft }),
      setActiveSiteId: (siteId) => set({ activeSiteId: siteId }),
      setInterviewNotes: (notes) => set({ interviewNotes: notes }),

      updateProfile: (profile) =>
        set((state) => {
          if (!state.resumeData) return { resumeData: null };
          const next = { ...state.resumeData, profile: { ...state.resumeData.profile, ...profile } };
          return { resumeData: mergeNormalized(state.resumeData, next) };
        }),

      updatePublicSiteTemplate: (template) =>
        set((state) => ({
          resumeData: state.resumeData
            ? { ...state.resumeData, publicSiteTemplate: template }
            : null,
        })),

      updateSiteThemeId: (themeId) =>
        set((state) => ({
          resumeData: state.resumeData
            ? { ...state.resumeData, siteThemeId: themeId }
            : null,
        })),

      updateTimeline: (timeline) =>
        set((state) => ({
          resumeData: state.resumeData ? { ...state.resumeData, timeline } : null,
        })),

      updateTimelineNode: (id, data) =>
        set((state) => {
          if (!state.resumeData) return { resumeData: null };
          const next = {
            ...state.resumeData,
            timeline: state.resumeData.timeline.map((n) =>
              n.id === id ? { ...n, ...data } : n,
            ),
          };
          return { resumeData: mergeNormalized(state.resumeData, next) };
        }),

      addTimelineNode: (node) =>
        set((state) => {
          if (!state.resumeData) return { resumeData: null };
          const next = { ...state.resumeData, timeline: [...state.resumeData.timeline, node] };
          return { resumeData: mergeNormalized(state.resumeData, next) };
        }),

      removeTimelineNode: (id) =>
        set((state) => {
          if (!state.resumeData) return { resumeData: null };
          const next = { ...state.resumeData, timeline: state.resumeData.timeline.filter((n) => n.id !== id) };
          return { resumeData: mergeNormalized(state.resumeData, next) };
        }),

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
        set((state) => {
          if (!state.resumeData) return { resumeData: null };
          const next = { ...state.resumeData, education };
          return { resumeData: mergeNormalized(state.resumeData, next) };
        }),

      updateRoleUnderstanding: (roleUnderstanding) =>
        set((state) => ({
          resumeData: state.resumeData
            ? { ...state.resumeData, roleUnderstanding }
            : null,
        })),
    }),
    {
      name: "career-card:editor",
      version: SCHEMA_VERSION,
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
        draftData: state.draftData,
        activeSiteId: state.activeSiteId,
        interviewNotes: state.interviewNotes,
      }),
      migrate: (persistedState, persistedVersion) => {
        const state = persistedState as Partial<ResumeStore> | undefined;
        if (!state?.resumeData) return state as ResumeStore;

        // Run migration stubs when schema version changes
        if (persistedVersion !== SCHEMA_VERSION) {
          // Future migrations go here, e.g.:
          // if (persistedVersion < 2) migrateV1toV2(state);
          // if (persistedVersion < 3) migrateV2toV3(state);
        }

        return {
          ...state,
          resumeData: normalizeResumeData(state.resumeData),
        } as ResumeStore;
      },
    },
  ),
);
