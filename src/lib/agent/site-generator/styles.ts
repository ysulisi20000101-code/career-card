import type { CareerSiteStyle, CareerSiteStylePreset } from "./types";

export const STYLE_PRESETS: Record<CareerSiteStylePreset, CareerSiteStyle> = {
  executive: {
    preset: "executive",
    tone: "克制、可信、面向决策者",
    density: "balanced",
    colorTheme: "墨黑、暖白、深青",
    layoutStyle: "高管档案式叙事，先给判断，再给证据",
    typography: "沉稳标题字重，紧凑正文",
  },
  "product-led": {
    preset: "product-led",
    tone: "结构清晰、结果导向、有产品判断",
    density: "balanced",
    colorTheme: "石墨黑、白色、信号蓝",
    layoutStyle: "产品案例式叙事，突出问题、选择和结果",
    typography: "现代无衬线，清晰层级",
  },
  "technical-builder": {
    preset: "technical-builder",
    tone: "精确、系统化、证据优先",
    density: "detailed",
    colorTheme: "炭黑、雾白、电光青",
    layoutStyle: "技术建设者叙事，突出系统、链路和可交付结果",
    typography: "紧凑无衬线，搭配技术感标注",
  },
  minimal: {
    preset: "minimal",
    tone: "直接、干净、易读",
    density: "focused",
    colorTheme: "黑、白、中性灰",
    layoutStyle: "单列作品集，减少装饰，突出内容",
    typography: "安静的无衬线字体",
  },
  creative: {
    preset: "creative",
    tone: "有人味、故事感、表达鲜明",
    density: "balanced",
    colorTheme: "墨黑、白色、珊瑚红",
    layoutStyle: "杂志式职业故事，突出关键转折",
    typography: "更有识别度的标题和清爽正文",
  },
};

export function getStyleForPreset(preset: CareerSiteStylePreset): CareerSiteStyle {
  return STYLE_PRESETS[preset];
}

export function inferStyleFromText(text: string): CareerSiteStylePreset | null {
  const normalized = text.toLowerCase();
  if (/极简|简洁|干净|克制|minimal|clean/.test(normalized)) return "minimal";
  if (/科技|技术|架构|ai|agent|rag|llm|智能体|大模型/.test(normalized)) return "technical-builder";
  if (/产品|增长|saas|平台|product|pm/.test(normalized)) return "product-led";
  if (/高级|高管|管理|负责人|executive|senior/.test(normalized)) return "executive";
  if (/创意|设计|品牌|creative/.test(normalized)) return "creative";
  return null;
}
