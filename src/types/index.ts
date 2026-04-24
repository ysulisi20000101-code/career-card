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
  timeline: TimelineNode[];
  skills: SkillNode[];
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
