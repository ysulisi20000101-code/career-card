import { describe, expect, it } from "vitest";
import { parseResumeText } from "./resume-parser";

describe("parseResumeText", () => {
  it("extracts core resume sections from plain text pdf content", () => {
    const source = `
李锦涛 产品经理
lijintao@example.com
13812345678

个人简介
5 年产品经验，负责平台产品规划、需求分析和跨团队协作。

工作经历
2021.03 - 至今 国科础石｜产品经理
- 负责平台产品规划与 0-1 设计
- 推动跨团队协作和版本发布

教育背景
2014.09 - 2018.06 浙江大学｜计算机科学｜本科

技能
PRD SQL Axure Figma
    `.trim();

    const result = parseResumeText(source, "产品-李锦涛.pdf");

    expect(result.data.profile.name).toBe("李锦涛");
    expect(result.data.profile.email).toBe("lijintao@example.com");
    expect(result.data.timeline.length).toBeGreaterThan(0);
    expect(result.data.education.length).toBeGreaterThan(0);
    expect(result.confidence.overall).toBeGreaterThan(0);
  });

  it("parses the updated product leader resume shape with internships and promotion stages", () => {
    const source = `
李锦涛
邮箱：YSUlijintao@163.com ｜ 电话：135-0317-5358

教育背景
燕山大学｜电子商务｜本科｜经济管理学院 2018.09—2022.06

个人优势
• 平台产品与团队管理能力：经历工具链产品经理 → 产品负责人 → 产品总监的内部晋升，管理约 10 人产品团队。
• ToB 商业闭环能力：深度参与产品定价、售前方案、招投标与客户签单。

工作经历
国科础石｜平台产品负责人 / AI 产品负责人（工具链产品经理 → 产品负责人 → 产品总监） 2023.06—至今
阶段一：平台产品经理 / 工具链产品经理 2023.06—2024.12
• 客户项目驱动 0-1 突破：推动 SOME/IP 通信设计工具从 0-1 建设。
• 云平台基建：规划用户、权限、部门、项目、消息通知、操作日志等通用基建。
• 售前交付与团队协同：参与产品说明书、演示视频、售前沟通、招投标方案与实习生带教。
阶段二：产品负责人 / 产品总监 2025.01—至今
• 平台体系建设：晋升产品 Leader，后晋升产品总监，管理约 10 人产品团队。
• 商业化与落地：平台覆盖汽车、军工等 10+ 客户与项目，服务 100+ 人研发团队。

经纬恒润｜产品设计部｜工具链产品经理 2022.08—2023.06
• 通信与诊断工具：对通信系统设计工具、诊断系统设计工具进行产品功能设计及售前工作。

实习经历
京东｜商业提升事业部｜用户产品实习生 2021.12—2022.04
• 产品迭代：完成商品卡片样式统一、商详页样式改版。
百度｜MEG 知识业务部｜后台产品实习生 2021.05—2021.09
• B 端基建：搭建机构答主系统。
京东健康｜互联网医院产品部｜后台产品实习生 2020.12—2021.03
• 中台建设：独立跟进 0-1 阶段测评中台。

技能证书
• 产品与设计工具：MS Office、XMind、Figma、Axure、Visio。
• 专业能力：平台型产品、AI Agent 工作流、RAG 知识库、ToB 售前、招投标方案、产品定价、UML/SysML、MBSE。
    `.trim();

    const result = parseResumeText(source, "李锦涛_产品负责人简历.pdf");

    expect(result.data.profile.name).toBe("李锦涛");
    expect(result.data.profile.email).toBe("YSUlijintao@163.com");
    expect(result.data.education[0]).toMatchObject({
      school: "燕山大学",
      major: "电子商务",
      degree: "本科",
    });
    expect(result.data.timeline.filter((node) => node.careerKind === "fulltime")).toHaveLength(2);
    expect(result.data.timeline.filter((node) => node.careerKind === "internship")).toHaveLength(3);
    expect(result.data.timeline[0]).toMatchObject({
      company: "国科础石",
      startDate: "2023-06",
      endDate: "至今",
    });
    expect(result.data.timeline[0]?.promotionStages?.map((stage) => stage.leadershipType)).toEqual([
      "none",
      "dotted",
      "solid",
    ]);
    expect(result.data.timeline[0]?.promotionStages?.at(-1)?.teamScale).toBe("10人");
    expect(result.data.skillProfile?.templateId).toBe("product-manager");
  });
});
