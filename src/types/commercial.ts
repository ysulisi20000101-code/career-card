import type { ResumeData } from "@/types";

export type PlanCode = "free" | "pro" | "advanced";
export type SubscriptionStatus = "trial" | "active" | "past_due" | "canceled";
export type AiSuggestionStatus = "pending" | "accepted" | "dismissed" | "regenerated";
export type CareerCardStatus = "draft" | "published" | "archived";

export interface User {
  id: string;
  email?: string;
  phone?: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionUser {
  id: string;
  email?: string;
  phone?: string;
  displayName: string;
  plan: PlanCode;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: PlanCode;
  status: SubscriptionStatus;
  currentPeriodEnd?: string;
  aiCreditsTotal: number;
  aiCreditsUsed: number;
  publishedSiteLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeSource {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  textLength: number;
  parseStatus: "pending" | "succeeded" | "failed";
  parseError?: string;
  createdAt: string;
}

export interface CareerProfile {
  id: string;
  userId: string;
  targetRole?: string;
  roleTemplateId?: string;
  completenessScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface CareerCard {
  id: string;
  userId: string;
  title: string;
  status: CareerCardStatus;
  data: ResumeData;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublishedSite {
  id: string;
  userId: string;
  cardId: string;
  slug: string;
  version: number;
  publishedAt: string;
  revokedAt?: string;
  snapshot: ResumeData;
}

export interface AiSuggestion {
  id: string;
  userId: string;
  cardId: string;
  type: "story" | "highlight_support" | "skill_profile" | "promotion_stage";
  status: AiSuggestionStatus;
  sourceVersion: number;
  payload: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface ShareEvent {
  id: string;
  userId?: string;
  cardId?: string;
  publishedSiteId?: string;
  eventName: string;
  sessionId: string;
  source: "edit" | "public" | "presentation" | "share" | "billing";
  props: Record<string, unknown>;
  createdAt: string;
}

export interface UsageQuota {
  plan: PlanCode;
  aiCreditsTotal: number;
  aiCreditsRemaining: number;
  publishedSiteLimit: number;
  publishedSiteUsed: number;
}
