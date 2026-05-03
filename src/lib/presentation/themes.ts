import type { PresentationTheme } from "./types";

const lightStory: PresentationTheme = {
  id: "light-story",
  name: "Light Story",
  colors: {
    bg: "#fafbfc",
    bg2: "#f2f4f7",
    surface: "#ffffff",
    text: "#1a1d27",
    text2: "#495468",
    text3: "#5e6b7a",
    gold: "#a07018",
    goldDim: "rgba(138,92,15,0.06)",
    teal: "#1a7d62",
    tealDim: "rgba(26,125,98,0.06)",
    violet: "#6b5ea0",
    violetDim: "rgba(107,94,160,0.06)",
    blue: "#3d7fb8",
    blueDim: "rgba(61,127,184,0.06)",
    amber: "#b08930",
    amberDim: "rgba(176,137,48,0.10)",
    rose: "#b85d6a",
    green: "#4a8a5a",
    cyan: "#318a94",
    border: "rgba(0,0,0,0.10)",
    borderStrong: "rgba(0,0,0,0.14)",
  },
  radius: { sm: "10px", lg: "16px" },
};

const darkStory: PresentationTheme = {
  id: "dark-story",
  name: "Dark Story",
  colors: {
    bg: "#070a0f",
    bg2: "#0c1118",
    surface: "#101620",
    text: "#e9edf4",
    text2: "#a8b6c4",
    text3: "#667280",
    gold: "#c8945c",
    goldDim: "rgba(200,148,92,0.10)",
    teal: "#4ec9b0",
    tealDim: "rgba(78,201,176,0.10)",
    violet: "#9b8ec4",
    violetDim: "rgba(155,142,196,0.10)",
    blue: "#6a9fd8",
    blueDim: "rgba(106,159,216,0.10)",
    amber: "#d4a752",
    amberDim: "rgba(212,167,82,0.12)",
    rose: "#df8a95",
    green: "#6db87d",
    cyan: "#4da8b8",
    border: "rgba(255,255,255,0.06)",
    borderStrong: "rgba(255,255,255,0.10)",
  },
  radius: { sm: "12px", lg: "18px" },
};

const THEMES: Record<string, PresentationTheme> = {
  "light-story": lightStory,
  "dark-story": darkStory,
};

export function getPresentationTheme(id: string): PresentationTheme {
  return THEMES[id] ?? lightStory;
}

export function listPresentationThemes(): PresentationTheme[] {
  return [lightStory, darkStory];
}
