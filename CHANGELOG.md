
## 仓库维护（2026-05-04）

- `main` 已合并 `origin/main`（v0.1.0 文档卫生）与 `codex/career-agent-v1`（Agent / 演示 / 清理）。
- 纳入仓库根目录 `PROJECT.md`、`ISSUES.md`、`CHANGELOG.md`；根目录 HTML 设计草稿写入 `.gitignore`。
- `npm run dev:stable` 使用 `cross-env`，兼容 Windows。
# 修复日志

> 最近更新：2026-05-03  
> 上一轮：Phase 1-6（2026-05-02 ~ 2026-05-03）

---

## Phase 7：未修复问题集中处理（2026-05-03）

基于 ISSUES.md 中 P0-P2 优先级的 9 个未修复问题。

### P0 — 用户数据风险

- **B1 面试备注静默丢失**：`interview/[id]/edit/page.tsx` — `useEffect` 和 `flushSave` 依赖数组添加 `interviewNotes`
- **R13 localStorage 满静默丢数据**：`registry.ts` 和 `presentation/storage.ts` 的 `safeSetItem`/`safeParse` catch 块添加 `console.warn`

### P1 — 安全 + 数据一致性

- **R6 API_SECRET 未设裸奔**：`auth.ts` — 生产环境缺少 `API_SECRET` 时返回 401，dev 模式 warn 后放行
- **B2 Zustand/Legacy Key 冲突**：`registry.ts` — 旧版迁移完成后 `removeItem(LEGACY_EDITOR_KEY)`
- **R10 Agent 消息双重赋值**：`career-agent-panel.tsx` — `jobDescription` 仅在 `map_to_target_role` 意图时赋值

### P2 — 防御性加固

- **R12 OGP 回退 localhost**：`p/[slug]/page.tsx` — 使用 `headers()` 推导当前 host 构建 baseUrl
- **B5 演示页未捕获异常**：`interview/[id]/present/page.tsx` — `loadOrGenerate()` 包裹 try/catch
- **R8 发布 API 无大小限制**：`published-sites/route.ts` — 添加 Content-Length 检查，超限返回 413
- **R9 site-chat 无简历大小校验**：`site-chat/route.ts` — 添加 resumeData 50KB 上限检查

---

## Phase 6：代码质量系统性修复（2026-05-03）

基于全量代码审查（产品/设计/架构三维度），按 P0→P3 优先级修复约 20 个问题。

### P0 — 阻塞性修复

- **Toast 系统修复**：`src/app/layout.tsx` 添加 `<Toaster />` 渲染，修复 toast 不显示的问题
- **空 catch 块日志**：`enhance-draft.ts` 和 `apply-draft-chat.ts` 的 catch 块添加 `console.error`

### P1 — 高优先级修复

- **合并重复工具函数**：`clean`/`compact`/`compactOr`/`unique`/`hasText` 从 7 个文件中的独立定义统一到 `src/lib/utils-helpers.ts`，所有文件改为 import
- **统一 Provider 配置**：三个文件独立实现的 ~180 行 env-var 读取逻辑合并到 `getFirstAvailableProviderConfig()`，`enhance-draft.ts` 和 `apply-draft-chat.ts` 统一调用
- **UI 组件 `"use client"`**：`badge.tsx`、`card.tsx`、`input.tsx`、`notice.tsx`、`textarea.tsx` 添加缺失的 `"use client"` 指令
- **防御性检查**：`career-card-agent.ts` 入口添加 `ResumeData` 数组字段的 Array.isArray guard

### P2 — 可维护性 + 无障碍

- **无障碍修复**：
  - `notice.tsx` 添加 `role="alert"` / `role="status"`
  - `toast.tsx` 关闭按钮添加 `aria-label="关闭通知"`
  - `dialog.tsx` 硬编码 "Close" 改为 `aria-label="关闭"`
  - `badge.tsx` `focus:ring` → `focus-visible:ring`
- **共享 Loading 组件**：新建 `src/components/ui/loading.tsx`（`LoadingSpinner` + `LoadingPage`），替换 8+ 页面中的 inline spinner
- **CSS 变量迁移**：`notice.tsx`、`error-boundary.tsx`、`skeleton.tsx`、`error.tsx`、`not-found.tsx` 中的硬编码颜色迁移到语义 token

### P3 — 架构重构

- **提取 normalize 函数**：7 个 normalize 函数（~90 行）从 `provider.ts` 提取到 `src/lib/agent/response-normalizer.ts`
- **拆分 career-card-agent.ts**：5 个 handler + 辅助函数提取到 `src/lib/agent/handlers.ts`（~310 行），主文件缩减为 dispatch 逻辑（~150 行）
- **删除硬编码个人数据**：`content.ts` 中 `PUBLIC_SKILL_BLOCKLIST` 和 `PUBLIC_TEXT_REPLACEMENTS` 去个性化，`latestStageDetails` 的 stage 标题从硬编码改为从 `promotionStages` 数据派生

### 新增文件

| 文件 | 用途 |
|------|------|
| `src/lib/utils-helpers.ts` | 统一工具函数模块 |
| `src/lib/agent/response-normalizer.ts` | Agent 响应规范化 |
| `src/lib/agent/handlers.ts` | Agent 意图处理器 |
| `src/components/ui/loading.tsx` | 共享 Loading 组件 |
| `src/app/error.tsx` | 全局错误页 |
| `src/app/not-found.tsx` | 404 页面 |
| `src/components/error-boundary.tsx` | React Error Boundary |
| `src/components/skeleton.tsx` | Skeleton 占位组件 |

---

## Phase 5：技术债（2026-05-02）

### Zustand + localStorage 数据源统一
- `src/store/resume-store.ts` — 新增 `draftData` / `setDraftData`、`interviewNotes` / `setInterviewNotes`
  - persist partialize 同步扩展
  - `resetResumeData()` 同时清空草稿和面试备注
- `src/components/agent-first/agent-site-workbench.tsx` — draft 读写改为通过 Zustand store，向后兼容 localStorage 回退

### InterviewNotes ref 方案移除
- `src/app/workspace/interview/[id]/edit/page.tsx` — 移除 `existingNotesRef`，改用 store 的 `interviewNotes`

### 集成测试
- 新增 `src/lib/share/publish-flow.integration.test.ts`
  - 草稿生成 → V2 快照构建 → 规范化 → V1 向下兼容 → 规则引擎精修
- 新增 `src/lib/agent/site-generator/draft-to-resume.integration.test.ts`
  - 草稿物化到 ResumeData → 时间线结构验证 → 主题切换 → 经历重排序

---

## Phase 4：产品 & UX（2026-05-02）

### Agent-first 用户旅程
- `src/app/workspace/personal/[id]/edit/page.tsx` — 确认简历后直接跳转 Agent 工作台，按钮文案「进入 Agent 工作台」

### 新手引导
- `src/app/page.tsx` — 首页新增「三步开始」区块：上传简历 → Agent 生成网站 → 发布分享

### 生成 Loading 改进
- `src/components/agent-first/agent-site-workbench.tsx` — 5 个硬编码步骤 → 3 个定时推进的生成阶段（分析简历、生成初稿、质量检查）

### 移动端适配
- `src/components/agent-first/agent-site-workbench.tsx` — 预览区域添加移动端对话切换按钮（`hidden lg:flex` 模式）

### 对话 UX 优化
- 快捷提示按钮添加图标（Target / Palette / Search / PenLine）
- 文本框支持 Enter 提交（Shift+Enter 换行）

### 发布页预览
- `src/components/publish/publish-page.tsx` — 新增可折叠「发布效果预览」区块，渲染 CareerNarrativeSite

### Header 文案修正
- `src/components/editor/edit-page.tsx:171` — 「面试官视角 — 发布后效果」→「预览 — 发布后访客看到的效果」

---

## Phase 3：Agent 系统统一（2026-05-02）

### site-chat 接入 LLM
- `src/lib/agent/conversation/apply-draft-chat.ts` — 新增 `applyDraftChatWithLLM()`
  - 先运行规则引擎作为基线
  - 检测 LLM 提供商配置（DeepSeek → Mimo → MiniMax 优先级）
  - 构建 site-chat 专用 prompt，发送给 LLM
  - 解析 LLM 返回的 JSON，合并到 draft
  - 任何环节失败都降级回规则引擎结果
- `src/app/api/agent/site-chat/route.ts` — 改为调用 `applyDraftChatWithLLM()`

### Agent 能力共享
- `src/components/agent-first/agent-site-workbench.tsx` — 新增 5 个意图按钮面板
  - 分析优势 / 追问细节 / 整理经历 / 匹配岗位 / 检查发布
  - 调用 `/api/agent/career-card` 与编辑页 Agent 共享能力
  - 新增 AI 能力提示横幅（区分规则引擎 vs LLM 模式）

---

## Phase 2：数据层精简（2026-05-02）

### API 路由瘦身
- `src/app/api/agent/site-draft/route.ts` — 不再生成 `PublicPageNarrative` 和 `renderOptions`，只返回 `{ draft, issues }`
- `src/app/api/agent/site-chat/route.ts` — 同上，只返回 `CareerSiteChatResult`

### 发布快照标准化
- `src/lib/share/snapshot.ts` — `buildPublishedSnapshotV2()` 不再调用 `generatePublicPageNarrative()`，只存储 `{ schemaVersion, slug, version, publishedAt, resumeData }`
- `src/lib/share/published-snapshot.ts` — `PublishedSnapshotV2` 接口移除 `publicNarrative` / `renderOptions` 字段

### public-narrative 模块清理
- `src/lib/public-narrative/from-draft.ts` — 从 257 行精简到 21 行，仅保留 `hashText()` 和 `getResumeRevision()`

---

## Phase 1：死代码清理（2026-05-02）

### 删除的文件
- `src/components/agent-first/generated-site-preview.tsx` — 从未被导入
- `src/components/narrative/public-narrative-site.tsx` — ShareView 已改用 CareerNarrativeSite
- `src/components/presentation/presentation-mode.tsx` — 面试模式已改用 PresentationShell
- `src/components/agent-first/theme-selection-page.tsx` — 主题切换已内嵌到 AgentSiteWorkbench
- `src/lib/public-narrative/stale.ts` — 从未被导入
- `src/lib/public-narrative/validation.ts` — 仅被已删除的代码路径引用

---

## 验证结果

- `npx tsc --noEmit` — 仅剩 provider.test.ts 中 3 个预存测试错误，业务代码零错误
- `npx vitest run` — 17 个测试文件，62 个测试用例全部通过

---

## 历史记录

- **2026-05-03**：Phase 6 系统性修复（P0-P3，约 20 项）
- **2026-05-02**：Phase 1-5 修复（21/25 问题），代码审查新发现 15 个问题
- **2026-04-29**：引入双 Agent 系统、Agent-first 工作流
- **2026-04-27**：V1b 架构能力图、技能图谱并排布局
- **2026-04-24**：项目初始化，V1 模板
