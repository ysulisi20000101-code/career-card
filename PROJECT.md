# Career Card — 项目完整上下文

## 产品定位

**一句话**：上传简历 → Agent 自动生成可分享的个人职业网站 → 用户通过对话精修 → 一键发布

**目标用户**：求职者/自由职业者，需要快速生成专业的个人职业网站用于求职、社交分发或个人品牌展示。

**核心价值链**：简历解析（PDF → 结构化数据）→ Agent 自动生成（网站初稿）→ 对话式精修（改定位/改风格/改叙事）→ 一键发布（生成可分享链接）

**两大赛道**：
- **个人职业网站**（Personal）：上传简历 → Agent 生成网站 → 对话精修 → 发布 URL
- **面试故事演示**（Interview）：上传简历+目标岗位 → 编辑内容 → 生成故事化幻灯片演示

---

## 技术栈

| 层 | 技术 | 版本 |
|---|------|------|
| 框架 | Next.js (App Router) | 16.2.4 |
| 编译器 | Turbopack | dev 模式 |
| UI 库 | React | 19 |
| 语言 | TypeScript | 5.x |
| 状态管理 | Zustand | latest |
| 动画 | Framer Motion | latest |
| 样式 | Tailwind CSS v4 | latest |
| 图标 | Lucide React | latest |
| 存储 | localStorage（无服务端持久化） | — |

**关键约束**：React Compiler 严格模式 — 禁止 render 期间 setState，禁止 render 期间访问 ref。

---

## 当前架构

### 路由结构

```
/                                         — Landing page（三步引导）
/workspace/personal/[id]/edit             — 个人编辑页 (CareerAgentPanel)
/workspace/personal/[id]/preview          — 个人预览页 (AgentSiteWorkbench 工作台)
/workspace/personal/[id]/publish          — 个人发布页 (PublishPage)
/workspace/personal/[id]/sites/new        — 新建网站
/workspace/personal/[id]/sites/[siteId]   — 网站详情/编辑
/workspace/interview/[id]/edit            — 面试编辑页
/workspace/interview/[id]/preview         — 面试预览页
/workspace/interview/[id]/present         — 面试演示页 (PresentationShell)
/p/[slug]                                 — 公开分享页 (ShareView)
/api/agent/career-card                    — Agent API: 编辑页 5 意图
/api/agent/site-draft                     — Agent API: 规则引擎生成网站草稿
/api/agent/site-chat                      — Agent API: 对话精修网站草稿
/api/published-sites                      — 发布/撤销 API
/api/events                               — 事件追踪
/api/narrative/promotion                  — 叙事：职级跃迁
/api/narrative/story                      — 叙事：经历故事
/api/resume-sources                       — 简历数据源
```

### 组件架构

```
src/components/
├── agent/            — 编辑页 Agent 面板 (CareerAgentPanel)
├── agent-first/      — 预览页 Agent 工作台 (AgentSiteWorkbench)
├── architecture/     — 架构能力图
├── editor/           — 编辑页/确认页
├── error-boundary.tsx — React Error Boundary（新建）
├── narrative/        — V1a 模板渲染器 (CareerNarrativeSite)
├── presentation/     — 面试演示系统
│   ├── diagrams/     — 架构图组件
│   ├── overlays/     — 覆盖层组件
│   ├── shared/       — 共享卡片/标签组件
│   ├── story-deck/   — 故事幻灯片引擎
│   └── styles/       — 演示样式
├── preview/          — 预览路由分发
├── publish/          — 发布控制台
├── role-understanding/ — 岗位理解视图
├── share/            — 公开分享页 (ShareView)
├── shell/            — 品牌 Logo / 步骤指示器
├── skillmap/         — 技能图谱
├── skeleton.tsx      — Skeleton 占位组件（新建）
├── timeline/         — 时间线编辑器/视图
├── ui/               — shadcn/ui 风格基础组件
│   ├── badge.tsx     — 标签
│   ├── card.tsx      — 卡片
│   ├── dialog.tsx    — 对话框
│   ├── dropdown-menu.tsx — 下拉菜单
│   ├── input.tsx     — 输入框
│   ├── loading.tsx   — 共享 Loading（新建）
│   ├── notice.tsx    — 通知横幅
│   ├── status-badge.tsx — 状态标签
│   ├── textarea.tsx  — 文本域
│   └── toast.tsx     — Toast 通知
└── upload/           — 简历上传
```

### 数据层架构

```
src/lib/
├── agent/
│   ├── career-card-agent.ts    — Agent 调度器（dispatch）
│   ├── handlers.ts             — Agent 意图处理器（新建）
│   ├── provider.ts             — LLM Provider 管理
│   ├── response-normalizer.ts  — 响应规范化（新建）
│   ├── types.ts                — Agent 类型定义
│   ├── conversation/
│   │   └── apply-draft-chat.ts — 对话精修引擎
│   └── site-generator/
│       ├── generate-site-draft.ts  — 规则引擎生成器
│       ├── draft-to-resume.ts      — 草稿物化
│       ├── enhance-draft.ts        — LLM 文案优化
│       ├── validate-site-draft.ts  — 草稿校验
│       ├── styles.ts               — 风格预设
│       └── types.ts                — 草稿类型
├── narrative/
│   ├── sequence.ts             — 叙事序列构建
│   └── story.ts                — 故事管理
├── parser/
│   ├── resume-parser.ts        — 简历解析
│   └── parse-with-assist.ts    — AI 辅助解析
├── presentation/               — 演示生成系统
│   ├── generator.ts            — 演示草稿生成
│   ├── storage.ts              — 演示存储
│   ├── themes.ts               — 演示主题
│   ├── types.ts                — 演示类型
│   └── fixture.ts              — 测试固件
├── public-site/
│   └── content.ts              — 公开站点内容构建
├── share/
│   ├── snapshot.ts             — 发布快照构建
│   ├── published-snapshot.ts   — 快照类型
│   ├── published-site-repository.ts — 发布仓储
│   ├── storage.ts              — 存储适配器
│   ├── validation.ts           — 校验
│   └── publish-checks.ts       — 发布检查
├── server/
│   ├── auth.ts                 — API 鉴权
│   └── storage-adapter.ts      — EdgeOne KV 适配器
├── projects/
│   ├── registry.ts             — 项目注册表（localStorage）
│   └── adapters.ts             — 适配器
├── utils-helpers.ts            — 统一工具函数（新建）
├── utils.ts                    — 通用工具函数
└── animations.ts               — 动画预设
```

### 数据格式

单一数据格式 `ResumeData` 贯穿全流程：

```
上传简历 → ResumeData → Agent 分析/生成 → CareerSiteDraft → materialize → ResumeData → CareerNarrativeSite 渲染
```

已废弃格式：
- `PublicPageNarrative` — 不再生成和渲染
- `renderOptions` — 不再包含在发布快照中

---

## 迭代历史

每个 commit 代表一次完整的功能/设计迭代。

### ce2f4e5 — Initial commit: career-card v1 (2026-04-24)
项目初始化，基础骨架搭建。v1 模板风格，交互式时间线可视化。

### ae62f74 — Save before redesign: V1b (2026-04-27)
ArchitectureView 和 SkillMapView 并排布局，indigo 渐变主题。

### ac8e206 — fix: stabilize sharing and presentation cleanup (2026-04-29)
稳定性修复：分享功能加固、演示页清理。

### 91ebf19 — feat: refine public career site presentation (2026-04-29)
**V1a 模板**。暖色调，GrowthRail SVG 曲线，ExperienceDetail 展开式卡片。

### f92e493 — feat: add career card agent v1 (2026-04-29)
第一个 Agent 系统 — CareerAgentPanel，5 个意图按钮。

### 381ef3b — feat: add model provider bridge for career agent (2026-04-29)
LLM provider 桥接层。

### cf05558 + 4cf690d — docs: agent provider env (2026-04-29)
Agent 配置文档和环境变量。

### be77f62 — feat: add agent-first site draft workflow (2026-04-29)
第二个 Agent 系统 — AgentSiteWorkbench，CareerSiteDraft 数据格式。

### 8d524b2 — feat: harden agent-first workflow for v1 (2026-04-29)
Agent 工作流加固。`codex/career-agent-v1` 分支。

### 未提交 — Phase 1-6 系统性修复 (2026-05-02 ~ 2026-05-03)
- Phase 1-5：死代码清理、数据层精简、Agent 统一、UX 优化、技术债（21/25 修复）
- Phase 6：P0-P3 全量代码审查修复（20 项）

---

## 当前状态

权威清单与优先级见 **[ISSUES.md](./ISSUES.md)**（Phase 7 后：约 **50** 项已修复，**10** 项未修复；不含 E2E / 服务端持久化等基础设施需求）。

下表为快照，编号与条目以 ISSUES 为准：

| 指标 | 参考 |
|------|------|
| 单元测试 | 17 文件 / 62 用例（`npm run test`） |
| TypeScript | `npm run typecheck` |
| 剩余项 | 低优先级 Bug（B3/B4）、设计风险（R7/R11/R14/R15）、测试盲区见 ISSUES |

### 文档分工

- **ISSUES.md**：问题追踪与修复状态的唯一来源。
- **CHANGELOG.md**（仓库根目录）：Phase 1–7 修复与审查纪要。
- **docs/CHANGELOG.md**：按日的模块级开发日志。

详见 [ISSUES.md](./ISSUES.md)

---

## 产品设计决策记录

- **V1a 为统一模板**：用户选择 91ebf19 commit 的 CareerNarrativeSite 作为所有个人网站的渲染模板
- **面试准备已砍掉**：面试模式只保留"故事演示"
- **故事模式 only**：面试演示只保留故事模式（PresentationShell）
- **Preview = Publish 视觉统一**：预览页和发布后 URL 渲染相同的视觉效果
- **localStorage 作为唯持久化**：所有项目数据存 localStorage，无服务端持久化
- **Agent-first 流程**：确认简历后直接进入 Agent 工作台，编辑页为可选高级入口
- **规则引擎 + LLM 双层架构**：规则引擎作为基线/降级方案，LLM 提供智能增强
