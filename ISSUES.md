# Career Card 全部问题清单

## 概述

**产品愿景**：上传简历 → Agent 自动生成可分享的个人职业网站 → 用户通过对话精修 → 一键发布

**当前状态**：主流程已跑通，架构/设计/代码质量修复完成。21/25 个已知问题已修复 + 全量代码审查 20 项修复 + Phase 7 修复 9 项。已修复 50 项，未修复 10 项（不含 E2E/服务端持久化等基础设施需求）。

**技术栈**：Next.js 16.2.4 (Turbopack) + React 19 + TypeScript + Zustand + Framer Motion + Tailwind CSS

---

## 问题总览

| 层级 | 原有 | 已修复 | 剩余 |
|------|------|--------|------|
| 一级（架构断裂） | 5 | 5 | 0 |
| 二级（产品定义） | 5 | 4 | 1 |
| 三级（UI 设计） | 7 | 7 | 0 |
| 四级（技术债） | 8 | 5 | 3 |
| 🔴 新发现 Bug | 5 | 3 | 2 |
| 🟡 新发现设计风险 | 10 | 6 | 4 |
| 📋 测试覆盖盲区 | 7 模块 | 0 | 7 模块 |
| 🛠️ 代码审查修复 | 20 | 20 | 0 |
| 🛠️ Phase 7 集中修复 | 9 | 9 | 0 |

---

## 🛠️ 代码审查系统性修复（20/20 ✅）

2026-05-03 完成全量产品/设计/架构审查，按 P0→P3 优先级修复：

### P0 — 阻塞性修复 ✅
- Toast 系统：`<Toaster />` 添加到 layout.tsx，修复 toast 不渲染
- 空 catch：`enhance-draft.ts` 和 `apply-draft-chat.ts` 添加错误日志

### P1 — 高优先级修复 ✅
- 重复工具函数：`clean`/`compact`/`compactOr`/`unique`/`hasText` 统一到 `utils-helpers.ts`
- Provider 配置：三处独立实现合并为 `getFirstAvailableProviderConfig()`
- `"use client"` 指令：5 个 UI 组件（badge/card/input/notice/textarea）添加缺失指令
- 防御性检查：`career-card-agent.ts` 添加入参 Array.isArray guard

### P2 — 可维护性 + 无障碍 ✅
- 无障碍：notice（role）、toast（aria-label）、dialog（中文关闭）、badge（focus-visible）
- 共享 Loading 组件：`LoadingSpinner` + `LoadingPage`，替换 8+ inline spinner
- CSS 变量：4 个文件中硬编码颜色迁移到语义 token

### P3 — 架构重构 ✅
- `response-normalizer.ts`：从 provider.ts 提取 7 个 normalize 函数
- `handlers.ts`：从 career-card-agent.ts 提取 5 个 handler + 辅助函数
- 删除硬编码个人数据：`content.ts` 中 stage 标题从数据派生

---

## 一级问题：架构断裂（5/5 已修复 ✅）

### #1. Agent 修改 draft 但预览不更新 ✅ 已修复
- 预览改为渲染 `materializeCareerSiteDraft` 结果，draft 变更实时反映

### #2. Agent 生成器是规则引擎，非 LLM ✅ 已修复
- site-chat 接入 LLM（`applyDraftChatWithLLM()`），规则引擎作为基线和降级方案
- LLM 优先级：DeepSeek → Mimo → MiniMax

### #3. 两套并行 Agent 系统 ✅ 已修复
- AgentSiteWorkbench 新增 5 个意图按钮面板，调用 `/api/agent/career-card` 共享能力

### #4. 三套数据格式做同一件事 ✅ 已修复
- `PublicPageNarrative` 不再生成和渲染，转换链简化为 `CareerSiteDraft → materialize → ResumeData`

### #5. 发布快照存储冗余数据 ✅ 已修复
- `buildPublishedSnapshotV2()` 不再调用 `generatePublicPageNarrative()`

---

## 二级问题：产品定义（4/5 已修复，1 未修复）

### #6. 用户旅程不是 Agent-first ✅ 已修复
### #7. 个人模式和面试模式 UI 不统一 ⚠️ 未修复
- 面试有独立 story deck 需求，强行合并会破坏功能，暂不处理
### #8. 编辑页/预览页 Agent 能力定位模糊 ✅ 已修复
### #9. 缺少版本历史/撤销 ✅ 已修复
### #10. 缺少新手引导 ✅ 已修复

---

## 三级问题：UI 设计（7/7 已修复 ✅）

### #11. Agent 对话修改不反映在预览 ✅ 已修复
### #12. 预览页 Header 文本不准确 ✅ 已修复
### #13. 主题选择页与 Agent 工作台分离 ✅ 已修复
### #14. Agent 生成 Loading 状态简陋 ✅ 已修复
### #15. 移动端适配缺失 ✅ 已修复
### #16. Agent 对话框 UX 问题 ✅ 已修复
### #17. 发布页预览与实际效果不一致 ✅ 已修复

---

## 四级问题：技术债（5/8 已修复，3 未修复）

### #18. 死代码 ✅ 已修复
### #19. safeSetItem 递归 bug ✅ 已修复
### #20. localStorage 作为唯一持久化层 ⚠️ 未修复
### #21. Zustand store 和 localStorage 双重数据源 ✅ 已修复
### #22. InterviewNotes 保存用 useRef 兜底 ✅ 已修复
### #23. 发布快照 schemaVersion 向前兼容 ✅ 已修复
### #24. 没有端到端测试 ⚠️ 未修复
### #25. LLM Provider 配置缺失静默失败 ⚠️ 部分修复

---

## 🔴 新发现 Bug（5 个）

### B1. 面试备注静默丢失 — autosave 依赖缺失 ✅ 已修复
**严重度**：高（用户数据丢失）
**修复**：`useEffect` 和 `flushSave` 依赖数组添加 `interviewNotes`

### B2. Zustand 持久化与旧版迁移共享 localStorage Key ✅ 已修复
**严重度**：中
**修复**：旧版迁移完成后 `removeItem(LEGACY_EDITOR_KEY)`，让 Zustand 独占该 key

### B3. 项目复制可能产生孤儿数据
**严重度**：低
**文件**：`src/lib/projects/registry.ts:162-204`

### B4. 多标签页读写竞争
**严重度**：低
**文件**：`src/lib/projects/registry.ts:83-116`

### B5. 演示页未捕获异常导致 Unhandled Rejection ✅ 已修复
**严重度**：中
**修复**：`loadOrGenerate()` 包裹 try/catch，异常时返回 null 并 console.error

---

## 🟡 新发现设计风险（10 个）

| # | 问题 | 严重度 | 文件 |
|---|------|--------|------|
| R6 | API_SECRET 未设时全部接口无保护 | ✅ 已修复 | `src/lib/server/auth.ts` |
| R7 | truncateResumeData 中无保护 JSON.parse | 🟢 低 | `src/lib/agent/provider.ts` |
| R8 | 发布 API 无请求体大小限制 | ✅ 已修复 | `src/app/api/published-sites/route.ts` |
| R9 | site-chat 路由无简历数据大小校验 | ✅ 已修复 | `src/app/api/agent/site-chat/route.ts` |
| R10 | CareerAgentPanel 消息双重赋值 | ✅ 已修复 | `src/components/agent/career-agent-panel.tsx` |
| R11 | 仅一处使用 ErrorBoundary | 🟡 中 | 全局 |
| R12 | 生产环境 Open Graph 回退到 localhost | ✅ 已修复 | `src/app/p/[slug]/page.tsx` |
| R13 | localStorage 满时静默丢数据 | ✅ 已修复 | `src/lib/projects/registry.ts` |
| R14 | 限制检查使用消毒后数据 | 🟢 低 | `src/app/api/agent/career-card/route.ts` |
| R15 | site-draft / site-chat 路由缺少类型约束 | 🟢 低 | 2 个路由文件 |

---

## 📋 测试覆盖盲区（7 个模块）

| 模块 | 测试状态 |
|------|---------|
| Zustand store `resume-store.ts` | 0 测试 |
| 项目注册表 `registry.ts` | 0 测试 |
| API 路由（5 个） | 0 集成测试 |
| 发布页 `publish-page.tsx` | 0 测试 |
| Agent 面板 `career-agent-panel.tsx` | 0 测试 |
| 面试编辑页 | 0 测试 |
| EdgeOne KV `storage-adapter.ts` | 0 测试 |

---

## 优先级建议

| 优先级 | 编号 | 问题 | 状态 |
|--------|------|------|------|
| 🔴 P0 | B1/R13/R6 | 备注丢失/静默丢数据/API 裸奔 | ✅ Phase 7 已修复 |
| 🔴 P1 | B2/R10 | Key 冲突/消息双重赋值 | ✅ Phase 7 已修复 |
| 🟡 P2 | R12/B5/R8/R9 | OGP/演示异常/API 大小限制 | ✅ Phase 7 已修复 |
| 🟢 P3 | B3/B4 | 孤儿数据/多标签竞争 | ⚠️ 未修复（罕见触发） |
| 🟢 P3 | R7/R11/R14/R15 | 各类小问题 | ⚠️ 未修复（低影响） |
| 📋 — | 测试覆盖盲区 7 模块 | 0 测试 | ⚠️ 需要 E2E 基础设施 |
| 📋 — | #7/#20/#24/#25 | UI 不统一/无持久化/无 E2E/Provider 静默 | ⚠️ 需要基础设施 |

---

## 历史记录

- **2026-05-03**：Phase 7 集中修复 P0-P2 优先级问题（9 项），已修复总数达 50
- **2026-05-03**：完成全量代码审查修复（P0-P3，20 项），更新 ISSUES/PROJECT/CHANGELOG
- **2026-05-02**：完成 21/25 修复（Phase 1-5），代码审查新发现 15 个问题
- **2026-04-29**：引入双 Agent 系统、Agent-first 工作流
- **2026-04-27**：V1b 架构能力图、技能图谱并排布局
- **2026-04-24**：项目初始化，V1 模板
