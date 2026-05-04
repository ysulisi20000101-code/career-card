export type { PersonalSite } from "./site";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  title?: string;
  summary?: string;
  avatar?: string;
  location?: string;
  website?: string;
  linkedin?: string;
}

export interface TimelineNode {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  highlights: string[];
  projects: ProjectDetail[];
  skills: string[];
  order: number;
  careerKind?: CareerKind;
  storyTitle?: string;
  storyScene?: string;
  storyChallenge?: string;
  storyAction?: string;
  storyOutcome?: string;
  storyReflection?: string;
  storyMood?: StoryMood;
  evidenceProblem?: string;
  evidenceAction?: string;
  evidenceResult?: string;
  evidenceProof?: string;
  evidenceStrength?: EvidenceStrength;
  promotionStages?: PromotionStage[];
}

export type CareerKind = 'internship' | 'fulltime';
export type StoryMood = 'focus' | 'growth' | 'breakthrough' | 'craft' | 'impact';
export type EvidenceStrength = 'weak' | 'medium' | 'strong';
export type PublicSiteTemplate = 'executive-dossier' | 'minimal-growth';

export interface PromotionStage {
  id: string;
  title: string;
  period: string;
  teamScale: string;
  leadershipType: 'none' | 'dotted' | 'solid';
  responsibility: string;
  outcome: string;
  reflection: string;
}

export interface ProjectDetail {
  id: string;
  name: string;
  description: string;
  role: string;
  highlights: string[];
  techStack: string[];
}

export interface SkillNode {
  id: string;
  name: string;
  category: string;
  level: number; // 1-5
  parentId: string | null;
  children?: SkillNode[];
  x?: number;
  y?: number;
  status?: SkillMatchStatus;
  importance?: SkillImportance;
  aliases?: string[];
  sourceTimelineIds?: string[];
  sourceSnippets?: string[];
}

export type SkillMatchStatus = 'owned' | 'missing' | 'inferred';
export type SkillImportance = 'core' | 'important' | 'optional';

export interface RoleSkillTemplate {
  templateId: string;
  roleName: string;
  aliases: string[];
  categories: RoleSkillCategory[];
}

export interface RoleSkillCategory {
  id: string;
  name: string;
  description: string;
  skills: RoleSkillDefinition[];
}

export interface RoleSkillDefinition {
  id: string;
  name: string;
  aliases: string[];
  importance: SkillImportance;
  displayGroup: string;
}

export interface SkillMatch {
  skillId: string;
  name: string;
  categoryId: string;
  categoryName: string;
  status: SkillMatchStatus;
  importance: SkillImportance;
  sourceTimelineIds: string[];
  sourceSnippets: string[];
}

export interface SkillCategory {
  id: string;
  name: string;
  description: string;
  matches: SkillMatch[];
}

export interface SkillCoverage {
  owned: number;
  total: number;
  coreOwned: number;
  coreTotal: number;
  percent: number;
}

export interface SkillProfile {
  templateId: string;
  roleName: string;
  confidence: number;
  categories: SkillCategory[];
  coverage: SkillCoverage;
  detectedSkillNames: string[];
}

export interface ArchitectureModule {
  id: string;
  title: string;
  description: string;
  type: 'business' | 'technical';
  industry: 'internet' | 'automotive' | 'finance';
  position: { x: number; y: number };
  parentId: string | null;
  relatedTimelineIds: string[];
  children?: ArchitectureModule[];
}

export interface ResumeData {
  profile: UserProfile;
  publicSiteTemplate?: PublicSiteTemplate;
  siteThemeId?: string;
  timeline: TimelineNode[];
  skills: SkillNode[];
  skillProfile?: SkillProfile;
  roleTemplateId?: string;
  publishedSiteId?: string;
  publishedAt?: string;
  architecture: ArchitectureModule[];
  education: Education[];
  roleUnderstanding: RoleUnderstanding;
}

export interface RoleUnderstanding {
  targetRoleTitle: string;
  companyContext?: string;
  oneLineInterpretation: string;
  priorityProblems: RolePriorityProblem[];
  ninetyDayPlan: RoleNinetyDayPlan;
  experienceMappings: RoleExperienceMapping[];
}

export interface RolePriorityProblem {
  id: string;
  problem: string;
  impact: string;
  evidence?: string;
}

export interface RoleNinetyDayPlan {
  day0To30: string;
  day31To60: string;
  day61To90: string;
}

export interface RoleExperienceMapping {
  id: string;
  requirement: string;
  myExperience: string;
  outcomeEvidence: string;
}

export interface ParseStats {
  textLength: number;
  detectedTimelineCount: number;
  detectedEducationCount: number;
  detectedSkillCount: number;
}

export interface ParseConfidence {
  profile: number;
  timeline: number;
  education: number;
  skills: number;
  overall: number;
  needsConfirmation: string[];
}

export interface ParseMeta {
  stats: ParseStats;
  confidence: ParseConfidence;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  major: string;
  startDate: string;
  endDate: string;
}

export type EditorStep = 'upload' | 'confirm' | 'edit' | 'preview' | 'publish';
