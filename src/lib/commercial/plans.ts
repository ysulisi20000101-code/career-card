import type { PlanCode, Subscription, UsageQuota } from "@/types/commercial";

export const PLAN_LABELS: Record<PlanCode, string> = {
  free: "免费版",
  pro: "个人版",
  advanced: "高级版",
};

export const PLAN_FEATURES: Record<PlanCode, string[]> = {
  free: ["上传 1 份简历", "生成基础职业档案预览", "便携链接兜底分享"],
  pro: ["稳定公开链接", "自定义地址", "5 个发布站点", "60 次 AI 深度优化"],
  advanced: ["多岗位定制版本", "访问数据统计", "20 个发布站点", "200 次 AI 深度优化"],
};

export function buildUsageQuota(subscription: Subscription, publishedSiteUsed = 0): UsageQuota {
  return {
    plan: subscription.plan,
    aiCreditsTotal: subscription.aiCreditsTotal,
    aiCreditsRemaining: Math.max(0, subscription.aiCreditsTotal - subscription.aiCreditsUsed),
    publishedSiteLimit: subscription.publishedSiteLimit,
    publishedSiteUsed,
  };
}

export function canUseFormalPublish(subscription: Subscription, publishedSiteUsed = 0): boolean {
  return subscription.plan !== "free" || publishedSiteUsed < subscription.publishedSiteLimit;
}

export function canUseDeepAi(subscription: Subscription): boolean {
  return subscription.aiCreditsUsed < subscription.aiCreditsTotal;
}
