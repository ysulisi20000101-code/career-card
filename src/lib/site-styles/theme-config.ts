export type SiteThemeId = "emerald-designer" | "warm-business" | "cool-tech" | "minimal-white" | "dark-elegant";

export interface SiteTheme {
  id: SiteThemeId;
  name: string;
  description: string;
  preview: string; // emoji or icon
  hero: {
    bg: string;
    text: string;
    accent: string;
    accentText: string;
    badge: string;
    badgeText: string;
    tag: string;
    tagText: string;
    strengthBg: string;
    strengthBorder: string;
    strengthText: string;
    /** Glow orbs color class, e.g. "from-amber-500/[0.12]" */
    glowA: string;
    glowB: string;
  };
  section: {
    bg: string;
    text: string;
    muted: string;
    accent: string;
    accentBg: string;
    accentText: string;
    cardBg: string;
    cardBorder: string;
    divider: string;
    groupHoverAccent: string;
  };
  skills: {
    bg: string;
    text: string;
    tagBg: string;
    tagBorder: string;
    tagText: string;
  };
  footer: {
    bg: string;
    text: string;
    muted: string;
  };
}

export const SITE_THEMES: Record<SiteThemeId, SiteTheme> = {
  "emerald-designer": {
    id: "emerald-designer",
    name: "翠绿设计",
    description: "v5 设计师版 — 全屏 Hero + 翠绿点缀 + 交替背景节奏",
    preview: "🍃",
    hero: {
      bg: "bg-gradient-to-r from-emerald-950 via-slate-950 to-emerald-950",
      text: "text-white",
      accent: "text-emerald-400",
      accentText: "text-emerald-300",
      badge: "border-emerald-500/30 bg-emerald-500/10",
      badgeText: "text-emerald-400",
      tag: "border-white/10 bg-white/[0.08]",
      tagText: "text-white/60",
      strengthBg: "bg-white/[0.06]",
      strengthBorder: "border-white/10",
      strengthText: "text-white/60",
      glowA: "from-emerald-500/[0.12]",
      glowB: "from-emerald-400/[0.08]",
    },
    section: {
      bg: "bg-white",
      text: "text-slate-900",
      muted: "text-slate-500",
      accent: "text-emerald-600",
      accentBg: "bg-emerald-50",
      accentText: "text-emerald-600",
      cardBg: "bg-white",
      cardBorder: "border-slate-100",
      divider: "border-slate-100",
      groupHoverAccent: "group-hover:text-emerald-600",
    },
    skills: {
      bg: "bg-slate-50",
      text: "text-slate-900",
      tagBg: "bg-slate-100",
      tagBorder: "border-slate-100",
      tagText: "text-slate-500",
    },
    footer: {
      bg: "bg-neutral-50",
      text: "text-slate-900",
      muted: "text-slate-400",
    },
  },

  "warm-business": {
    id: "warm-business",
    name: "暖调商务",
    description: "v1a 经典风格 — 暖奶油底 + 青绿渐变 Hero + 青绿点缀",
    preview: "🌅",
    hero: {
      bg: "bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950",
      text: "text-white",
      accent: "text-teal-400",
      accentText: "text-teal-400",
      badge: "border-teal-500/30 bg-teal-500/10",
      badgeText: "text-teal-400",
      tag: "border-white/10 bg-white/[0.08]",
      tagText: "text-white/60",
      strengthBg: "bg-white/[0.06]",
      strengthBorder: "border-white/10",
      strengthText: "text-white/60",
      glowA: "from-teal-500/[0.12]",
      glowB: "from-emerald-500/[0.06]",
    },
    section: {
      bg: "bg-[#f6f6f2]",
      text: "text-zinc-950",
      muted: "text-zinc-500",
      accent: "text-teal-700",
      accentBg: "bg-teal-50",
      accentText: "text-teal-700",
      cardBg: "bg-white",
      cardBorder: "border-zinc-200",
      divider: "border-zinc-100",
      groupHoverAccent: "group-hover:text-teal-700",
    },
    skills: {
      bg: "bg-zinc-900",
      text: "text-white",
      tagBg: "bg-zinc-800",
      tagBorder: "border-zinc-700",
      tagText: "text-zinc-300",
    },
    footer: {
      bg: "bg-zinc-50",
      text: "text-zinc-950",
      muted: "text-zinc-500",
    },
  },

  "cool-tech": {
    id: "cool-tech",
    name: "冷调科技",
    description: "浅蓝灰底色 + 蓝色点缀，专业、现代",
    preview: "❄️",
    hero: {
      bg: "bg-[#0c1222]",
      text: "text-white",
      accent: "text-blue-400",
      accentText: "text-blue-400",
      badge: "border-blue-500/30 bg-blue-500/10",
      badgeText: "text-blue-400",
      tag: "border-slate-700 bg-slate-800",
      tagText: "text-slate-300",
      strengthBg: "bg-slate-800",
      strengthBorder: "border-slate-700",
      strengthText: "text-slate-300",
      glowA: "from-blue-500/[0.12]",
      glowB: "from-cyan-500/[0.08]",
    },
    section: {
      bg: "bg-slate-50",
      text: "text-slate-950",
      muted: "text-slate-500",
      accent: "text-blue-600",
      accentBg: "bg-blue-50",
      accentText: "text-blue-700",
      cardBg: "bg-white",
      cardBorder: "border-slate-100",
      divider: "border-slate-100",
      groupHoverAccent: "group-hover:text-blue-600",
    },
    skills: {
      bg: "bg-slate-900",
      text: "text-white",
      tagBg: "bg-slate-800",
      tagBorder: "border-slate-700",
      tagText: "text-slate-300",
    },
    footer: {
      bg: "bg-slate-50",
      text: "text-slate-950",
      muted: "text-slate-500",
    },
  },

  "minimal-white": {
    id: "minimal-white",
    name: "极简白",
    description: "浅灰渐变底 + 黑色主调，干净、聚焦内容",
    preview: "⬜",
    hero: {
      bg: "bg-gradient-to-br from-zinc-100 via-zinc-50 to-white",
      text: "text-zinc-950",
      accent: "text-zinc-950",
      accentText: "text-zinc-800",
      badge: "border-zinc-300 bg-white/80",
      badgeText: "text-zinc-700",
      tag: "border-zinc-300 bg-white/80",
      tagText: "text-zinc-700",
      strengthBg: "bg-white/80",
      strengthBorder: "border-zinc-300",
      strengthText: "text-zinc-700",
      glowA: "from-zinc-400/[0.10]",
      glowB: "from-zinc-300/[0.08]",
    },
    section: {
      bg: "bg-white",
      text: "text-zinc-950",
      muted: "text-zinc-500",
      accent: "text-zinc-950",
      accentBg: "bg-zinc-50",
      accentText: "text-zinc-700",
      cardBg: "bg-white",
      cardBorder: "border-zinc-100",
      divider: "border-zinc-100",
      groupHoverAccent: "group-hover:text-zinc-950",
    },
    skills: {
      bg: "bg-zinc-50",
      text: "text-zinc-950",
      tagBg: "bg-white",
      tagBorder: "border-zinc-200",
      tagText: "text-zinc-700",
    },
    footer: {
      bg: "bg-zinc-50",
      text: "text-zinc-950",
      muted: "text-zinc-500",
    },
  },

  "dark-elegant": {
    id: "dark-elegant",
    name: "深色优雅",
    description: "深灰底色 + 金色点缀，高端、有质感",
    preview: "✨",
    hero: {
      bg: "bg-[#171717]",
      text: "text-white",
      accent: "text-yellow-400",
      accentText: "text-yellow-400",
      badge: "border-yellow-500/30 bg-yellow-500/10",
      badgeText: "text-yellow-400",
      tag: "border-neutral-700 bg-neutral-800",
      tagText: "text-neutral-300",
      strengthBg: "bg-neutral-800",
      strengthBorder: "border-neutral-700",
      strengthText: "text-neutral-300",
      glowA: "from-yellow-500/[0.10]",
      glowB: "from-amber-500/[0.06]",
    },
    section: {
      bg: "bg-neutral-50",
      text: "text-neutral-950",
      muted: "text-neutral-500",
      accent: "text-yellow-600",
      accentBg: "bg-yellow-50",
      accentText: "text-yellow-700",
      cardBg: "bg-white",
      cardBorder: "border-neutral-100",
      divider: "border-neutral-100",
      groupHoverAccent: "group-hover:text-yellow-600",
    },
    skills: {
      bg: "bg-neutral-900",
      text: "text-white",
      tagBg: "bg-neutral-800",
      tagBorder: "border-neutral-700",
      tagText: "text-neutral-300",
    },
    footer: {
      bg: "bg-neutral-50",
      text: "text-neutral-950",
      muted: "text-neutral-500",
    },
  },
};

export function getTheme(id: string): SiteTheme {
  return SITE_THEMES[id as SiteThemeId] ?? SITE_THEMES["emerald-designer"];
}

export function getAllThemes(): SiteTheme[] {
  return Object.values(SITE_THEMES);
}
