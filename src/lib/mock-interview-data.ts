import type { ResumeData } from "@/types";

/**
 * Fictional interview demo data — SaaS growth product manager.
 * Completely unrelated to any real person's experience.
 */
export const mockInterviewResumeData: ResumeData = {
  profile: {
    id: "iprofile-1",
    name: "李思然",
    email: "lisiran@example.com",
    phone: "139-0000-1111",
    title: "高级产品经理（增长方向）",
    summary:
      "6年B2B SaaS产品经验，专注数据驱动增长与PLG（产品驱动增长）。主导过从0到1的CRM线索评分引擎、企业级自助 onboarding 体系和数据分析 SaaS 增长飞轮，擅长A/B实验、用户行为分析和跨职能团队协作。",
    location: "北京",
  },
  timeline: [
    {
      id: "itl-1",
      company: "灯塔数据",
      position: "高级增长产品经理 → 增长产品负责人",
      startDate: "2023-04",
      endDate: "至今",
      description:
        "负责数据分析 SaaS 产品的增长体系，管理4人增长产品团队，推动 ARR 从 3000 万增长至 8000 万。",
      highlights: [
        "搭建 PLG 增长飞轮，免费版到付费版转化率从 3.2% 提升至 7.8%",
        "设计产品内智能升级引导，触发付费的会话占比从 1.1% 提升至 4.5%",
        "主导客户健康度评分模型建设，季度流失率从 8% 降至 3.5%",
        "建立全链路归因模型，跑通从注册到付费的完整转化漏斗",
        "推动产品定价从单一版本升级为三档版本，ARPU 提升 60%",
      ],
      projects: [
        {
          id: "iproj-1",
          name: "PLG 增长飞轮",
          description: "从免费版→付费版的 self-serve 转化体系",
          role: "增长产品负责人",
          highlights: [
            "在核心工作流中植入体验升级触点，实现 natural expansion",
            "设计 workspace 级别的使用量可见性面板，驱动团队升级",
          ],
          techStack: ["SQL", "Python", "Amplitude", "LaunchDarkly"],
        },
      ],
      skills: ["PLG", "定价策略", "增长飞轮", "数据分析", "团队管理"],
      order: 0,
      careerKind: "fulltime",
      storyTitle: "重塑 B2B SaaS 增长引擎，ARR 翻 2.6 倍",
      storyScene:
        "灯塔数据的产品功能成熟但增长停滞——免费版用户活跃度不低但付费转化持续低迷，销售团队抱怨线索质量不够，而产品侧缺乏系统性的增长机制。",
      storyChallenge:
        "团队尚未建立实验文化，增长动作分散在各产品线、缺乏统一的归因模型。需要在不增加 headcount 的情况下找到可规模化的增长杠杆。",
      storyAction:
        "先用 SQL 梳理历史转化数据建立基线，然后围绕「激活深度→付费意愿」假设设计了产品内智能升级引导，同时推动定价从单版本升级为三档，并搭建了全链路归因看板。",
      storyOutcome:
        "ARR 在 18 个月内从 3000 万增长至 8000 万，付费转化率翻倍，ARPU 提升 60%，季度流失率降至 3.5%。同时建立了增长实验规范和每周增长回顾机制。",
      storyReflection:
        "SaaS 增长的核心不是单点爆款功能，而是把转化信号嵌入用户使用路径中，让产品本身成为最好的销售。",
      evidenceProblem:
        "免费版 MAU 稳定在 2 万+但付费转化率仅 3.2%，销售团队难以覆盖长尾用户。",
      evidenceAction:
        "在 6 个关键工作流节点植入智能升级引导，搭建全链路归因模型。",
      evidenceResult:
        "ARR 增长至 8000 万，付费转化率提升至 7.8%，ARPU 提升 60%。",
      evidenceProof: "增长数据留存于公司 BI 系统，支持季度投资人汇报。",
      promotionStages: [
        {
          id: "istage-1",
          title: "高级增长产品经理",
          period: "2023.04 - 2024.06",
          teamScale: "独立负责增长产品线",
          leadershipType: "none",
          responsibility: "搭建 PLG 增长飞轮，设计智能升级引导和全链路归因模型。",
          outcome: "付费转化率翻倍，建立增长实验规范。",
          reflection: "这一阶段的核心是找到可规模化的增长杠杆，用数据而非直觉驱动决策。",
        },
        {
          id: "istage-2",
          title: "增长产品负责人",
          period: "2024.07 - 至今",
          teamScale: "实线管理 4 人增长团队",
          leadershipType: "solid",
          responsibility: "负责整体增长策略、定价体系、团队分工和跨职能增长协作。",
          outcome: "ARR 突破 8000 万，带领团队跑通 PLG + SLG 混合增长模式。",
          reflection: "从个人增长实验到用团队和系统能力持续驱动规模化收入增长。",
        },
      ],
    },
    {
      id: "itl-2",
      company: "速达企服",
      position: "产品经理",
      startDate: "2020-05",
      endDate: "2023-03",
      description:
        "负责企业服务 SaaS 平台的核心产品线，从功能交付转向平台化，推动自助 onboarding 体系建设。",
      highlights: [
        "设计自助注册与新手引导流程，客户上手时间从 5 天缩短至 0.5 天",
        "搭建客户成功数据看板，实现客户健康度自动化监控",
        "主导产品从定制化交付向标准化配置转型，交付周期缩短 70%",
        "建立产品需求优先级评估框架(RICE)，提升产研资源利用效率",
      ],
      projects: [
        {
          id: "iproj-2",
          name: "自助 Onboarding 平台",
          description: "从零搭建企业级自助上手体系",
          role: "产品负责人",
          highlights: [
            "设计分行业的新手引导模板，完成率从 22% 提升至 68%",
            "内置产品导览和智能搜索，降低首次价值感知时间",
          ],
          techStack: ["React", "Node.js", "Segment", "Intercom"],
        },
      ],
      skills: ["SaaS", "客户成功", "Onboarding", "RICE", "流程设计"],
      order: 1,
      careerKind: "fulltime",
      storyTitle: "把企业级实施从 5 天缩到半天",
      storyScene:
        "速达企服的产品功能很强，但新客户从签约到真正用起来平均需要 5 天，期间需要 CSM 大量人工介入。公司希望把实施周期压缩到 1 天以内，支撑规模化扩张。",
      storyChallenge:
        "产品设计之初没有考虑自助配置能力，几乎所有 setting 都依赖后台手工操作。团队需要在保持现有客户不受影响的前提下逐步迁移到自助模式。",
      storyAction:
        "先分析了 50+ 家客户的 onboarding 路径，识别出 12 个可自动化的配置节点。然后设计了分行业引导模板和智能配置助手，并协调工程团队分阶段灰度上线。",
      storyOutcome:
        "客户上手时间从 5 天压缩到 0.5 天，CSM 人效提升 3 倍，同时 NPS 从 32 提升至 54。",
      storyReflection:
        "B2B 产品的竞争不只是功能之争，更是客户实现价值的速度之争。自助能力是 PLG 的基础设施。",
      evidenceProblem:
        "新客户平均 onboarding 时间 5 天，CSM 团队人力严重不足。",
      evidenceAction:
        "识别 12 个可自动化节点，设计分行业引导模板和智能配置助手。",
      evidenceResult: "上手时间降至 0.5 天，NPS 从 32 提升至 54。",
      evidenceProof: "实施数据留存于内部运营看板，支撑了 A 轮融资的尽调。",
    },
    {
      id: "itl-3",
      company: "云帆科技",
      position: "助理产品经理",
      startDate: "2018-07",
      endDate: "2020-04",
      description:
        "参与中大型 CRM SaaS 产品的功能迭代，从需求分析到上线全流程参与，完成从新人到独立 PM 的成长。",
      highlights: [
        "设计线索评分引擎，销售合格线索转化率提升 18%",
        "在 1.5 年内独立交付 4 个中型功能模块，全部按时上线",
        "建立产品数据分析框架，从零搭建 Mixpanel 事件体系",
        "推动用户反馈闭环机制，NPS 调研从季度改为持续收集",
      ],
      projects: [
        {
          id: "iproj-3",
          name: "CRM 线索评分引擎",
          description: "从0到1搭建智能线索评分系统",
          role: "产品经理",
          highlights: [
            "用 SQL 分析历史成交数据，识别 20+ 高转化特征维度",
            "设计评分规则引擎，支持销售团队自定义权重配置",
          ],
          techStack: ["SQL", "Ruby on Rails", "Mixpanel"],
        },
      ],
      skills: ["CRM", "需求分析", "SQL", "用户研究", "数据分析"],
      order: 2,
      careerKind: "fulltime",
      storyTitle: "第一次从数据里挖出产品方向",
      storyScene:
        "云帆科技的销售团队每天处理 200+ 线索，但合格率不足 15%。销售人员花大量时间手动筛选，团队士气低落。",
      storyChallenge:
        "作为团队最年轻的 PM，需要在有限工程资源下、3 个月内交付一个可用的智能评分方案。没有任何机器学习背景。",
      storyAction:
        "花了两周时间用 SQL 分析历史成交数据，发现关键转化特征（行业、公司规模、访问行为等），然后设计了一个基于规则引擎的评分模型，支持销售自定义权重。同时向工程团队争取到了一位后端工程师的支持。",
      storyOutcome:
        "评分引擎上线后，销售合格线索转化率提升 18%，销售团队人均日处理线索量从 80 提升至 150。",
      storyReflection:
        "这段经历教会我：在资源有限时，先验证方向再投入——用数据分析找到最大的杠杆点，比追求完美模型更重要。",
      evidenceProblem: "销售团队线索合格率不足 15%，人力浪费严重。",
      evidenceAction: "用 2 周分析历史成交数据，设计基于规则引擎的评分模型。",
      evidenceResult: "合格线索转化率从 12% 提升至 21%。",
      evidenceProof: "客户数据留存于 CRM 系统，项目总结文档提交给 CTO。",
    },
  ],
  skills: [
    { id: "isk-root", name: "产品技能", category: "root", level: 5, parentId: null },
    { id: "isk-1", name: "B2B SaaS", category: "产品设计", level: 5, parentId: "isk-root" },
    { id: "isk-2", name: "PLG", category: "增长策略", level: 5, parentId: "isk-root" },
    { id: "isk-3", name: "数据分析", category: "数据能力", level: 5, parentId: "isk-root" },
    { id: "isk-4", name: "SQL", category: "数据能力", level: 5, parentId: "isk-3" },
    { id: "isk-5", name: "A/B实验", category: "数据能力", level: 4, parentId: "isk-3" },
    { id: "isk-6", name: "用户研究", category: "用户体验", level: 4, parentId: "isk-root" },
    { id: "isk-7", name: "增长飞轮", category: "增长策略", level: 5, parentId: "isk-2" },
    { id: "isk-8", name: "定价策略", category: "商业能力", level: 4, parentId: "isk-root" },
    { id: "isk-9", name: "客户成功", category: "产品设计", level: 4, parentId: "isk-1" },
    { id: "isk-10", name: "项目管理", category: "管理能力", level: 4, parentId: "isk-root" },
    { id: "isk-11", name: "团队管理", category: "管理能力", level: 4, parentId: "isk-10" },
    { id: "isk-12", name: "Figma", category: "设计工具", level: 3, parentId: "isk-root" },
    { id: "isk-13", name: "Python", category: "数据能力", level: 3, parentId: "isk-3" },
  ],
  architecture: [
    {
      id: "iarch-1",
      title: "增长引擎",
      description: "覆盖获客、激活、转化、留存全链路的 PLG 增长飞轮",
      type: "business",
      industry: "internet",
      position: { x: 100, y: 100 },
      parentId: null,
      relatedTimelineIds: ["itl-1"],
    },
    {
      id: "iarch-2",
      title: "新手引导漏斗",
      description: "从注册到首次价值感知的自助 onboarding 体系",
      type: "business",
      industry: "internet",
      position: { x: 400, y: 100 },
      parentId: null,
      relatedTimelineIds: ["itl-2"],
    },
    {
      id: "iarch-3",
      title: "数据分析仪表盘",
      description: "统一的客户行为分析与产品使用量监控平台",
      type: "technical",
      industry: "internet",
      position: { x: 250, y: 300 },
      parentId: null,
      relatedTimelineIds: ["itl-1", "itl-2"],
    },
    {
      id: "iarch-4",
      title: "订阅与计费系统",
      description: "多档定价策略与自助升级的计费引擎",
      type: "technical",
      industry: "internet",
      position: { x: 550, y: 300 },
      parentId: "iarch-2",
      relatedTimelineIds: ["itl-1"],
    },
  ],
  education: [
    {
      id: "iedu-1",
      school: "北京邮电大学",
      degree: "硕士",
      major: "信息管理与信息系统",
      startDate: "2015-09",
      endDate: "2018-06",
    },
    {
      id: "iedu-2",
      school: "南京邮电大学",
      degree: "学士",
      major: "电子商务",
      startDate: "2011-09",
      endDate: "2015-06",
    },
  ],
  roleUnderstanding: {
    targetRoleTitle: "增长产品负责人",
    companyContext: "公司处于从 PLG 单引擎向 PLG + SLG 混合增长转型的关键阶段。",
    oneLineInterpretation: "该岗位需要系统性驱动跨产品线的增长策略，把增长能力从个人能力升级为组织能力。",
    priorityProblems: [
      {
        id: "irp-1",
        problem: "增长实验分散在各产品线，缺乏统一的优先级和归因",
        impact: "资源重复投入，部分实验方向相互冲突，整体增长效率低",
        evidence: "Q3 关键增长指标（激活率、转化率）均未达成目标",
      },
      {
        id: "irp-2",
        problem: "免费版到付费版的转化路径依赖人工销售介入",
        impact: "长尾客户付费转化几乎为零，销售团队人力无法覆盖",
        evidence: "月活 2 万+免费用户中，自助付费占比不足 2%",
      },
      {
        id: "irp-3",
        problem: "客户成功团队和产品团队对用户健康度缺乏统一判断标准",
        impact: "高风险客户识别滞后，被动流失严重",
        evidence: "近两个季度因未及时干预导致的流失占整体流失的 60%",
      },
    ],
    ninetyDayPlan: {
      day0To30: "完成增长实验清单盘点，建立统一优先级框架和归因模型基线。",
      day31To60: "围绕最高杠杆的增长假设启动 3-5 个实验，搭建增长实验看板。",
      day61To90: "沉淀第一轮实验结果，输出增长策略升级方案并推动跨团队对齐。",
    },
    experienceMappings: [
      {
        id: "irem-1",
        requirement: "建立系统性增长实验机制",
        myExperience: "在灯塔数据搭建 PLG 增长飞轮和全链路归因模型",
        outcomeEvidence: "付费转化率从 3.2% 提升至 7.8%，ARR 突破 8000 万",
      },
      {
        id: "irem-2",
        requirement: "提升新客户上手速度和首次价值感知",
        myExperience: "在速达企服从零搭建自助 onboarding 体系",
        outcomeEvidence: "客户上手时间从 5 天压缩至 0.5 天，NPS 提升 22 点",
      },
    ],
  },
};
