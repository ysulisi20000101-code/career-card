# Career Card — 开发日志

## 2026-05-04 | LLM 驱动面试演示模块

### 架构决策

- **模式**: 基线生成（规则引擎）→ LLM 增强 → 安全合并。复用 `enhanceSiteDraft` 的"确定性基线 + LLM 增强"模式。
- **SVG 策略**: LLM 生成结构化 `visualization.data` JSON，由现有 React 组件渲染（不改 SVG 组件本身）。
- **Provider 策略**: 复用 `getFirstAvailableProviderConfig()`，优先级 deepseek → mimo → minimax。
- **降级策略**: 任何 LLM 环节失败 → 自动返回规则引擎基线，用户无感知。
- **Token 预算**: 三级压缩 prompt（系统规则 ~3KB + 简历摘要 ~3KB + 基线字段 ~3KB）。

### 新增模块 (`src/lib/agent/presentation/`)

| 文件 | 职责 |
|------|------|
| `types.ts` | `PresentationEnhancementRequest/Result`、`SlideEnhancementUpdate`、`ValidationIssue`、`EnhancementTrace` 类型定义 |
| `build-prompt.ts` | 三级压缩 prompt：66 条规则浓缩为 R0-R9 + `buildResumeDataSummary()` 简历摘要 + 基线字段 |
| `normalize-presentation.ts` | LLM 响应验证（按字段类型校验）、安全合并（structuredClone + 逐字段覆盖）、Rule 0 事后扫描（`scanForFabrication`） |
| `enhance-presentation.ts` | 编排入口：选 provider → 调 LLM（2 次重试，1s/2s 延迟，40s 超时）→ normalize → merge → Rule 0 扫描 |

### 新增 API

| 路由 | 方法 | 用途 |
|------|------|------|
| `/api/agent/interview-presentation` | POST | 接收 `{ resumeData, baseline, mode }`，返回 `{ draft, issues, trace }` |

安全措施：API key 认证、80KB body 限制、ResumeData sanitize、baseline 结构校验（schemaVersion=1，6-12 slides）。

### 修改文件

| 文件 | 改动 |
|------|------|
| `src/lib/presentation/generator.ts` | 新增 `buildResumeDataSummary()` 导出，提取简历关键字段供 prompt 使用 |
| `src/components/presentation/story-deck/slides/hero-slide.tsx` | 数据驱动改造：从 `slide.visualizations[0].data` 读取 HeroArchitecture props，带形状校验回退 |
| `src/components/presentation/story-deck/slides/tension-slide.tsx` | 数据驱动改造：VModelSVG 从 `slide.visualizations[0].data` 读取，带形状校验 |
| `src/components/presentation/story-deck/slides/resolution-slide.tsx` | 数据驱动改造：VModelSVG 从 `slide.visualizations[0].data` 读取，带形状校验 |
| `src/components/presentation/story-deck/slides/fullstack-slide.tsx` | 数据驱动改造：PipelineSVG 从 `slide.visualizations[0].data` 读取，带形状校验 |
| `src/app/workspace/interview/[id]/present/page.tsx` | 前端集成：模式切换 UI（快速/AI 精修分段控件）、AI 增强 loading overlay、错误通知 banner |

### 防御式编程修复

| 文件 | 修复内容 |
|------|----------|
| `src/components/presentation/diagrams/pipeline-svg.tsx` | `hexToRgb()` 防御 `undefined` hex，返回默认 violet |
| `src/components/presentation/diagrams/hero-architecture.tsx` | `hexToRgba()` 防御 `undefined` hex |
| `src/components/presentation/diagrams/v-model-svg.tsx` | `hexToRgba()` 防御 `undefined` hex |
| 4 个 slide renderer | 添加运行时数据形状校验（`isValidStages`、`isValidVModelNodes` 等），不匹配时回退到 SVG 组件默认值 |

**根因**: 规则引擎生成器产出的 `visualizations.data` 格式与 SVG 组件期望的完全不一致（如 `buildFullstackSlide` 产出 `stages: string[]` 但 `PipelineSVG` 期望 `{name, color, ...}[]`）。数据驱动改造前，slide renderer 用硬编码值忽略了这些数据；改造后透传导致 `hexToRgb(undefined)` 崩溃。

### 验证结果

- TypeScript: `npx tsc --noEmit` 零错误
- 测试: 17 文件 / 62 测试全部通过
- 构建: `next build` 成功
- 运行时: 页面 HTTP 200，无 ErrorBoundary 崩溃

---

## 2026-05-03 | 叙事规则提取与计划

### 产出
- `docs/interview-agent-rules.md`: 从手写 HTML (`interview-story(1).html`, 1192 行) 穿刺提取 66 条叙事规则，分为 12 类别
- 新增 **Rule 0（最高优先级）**: "叙事编排不得篡改事实"——禁止捏造、混淆经历、因果倒置、夸大角色、数字注水
- 实施方案计划: `lazy-squishing-peacock.md` — 5 新文件 + 5 修改文件 + API 设计 + Prompt 策略

### 核心发现
- 规则引擎 `generatePresentationDraft()`（987 行）产出泛化结构化摘要
- 手写 HTML 是定制叙事，含 6 个手绘 SVG + 16 个性化细节 + 8 页 before→after 故事弧线
- 差距是结构性的：领域知识（V-model 垄断图、7 类冲突、Agent 架构）无法从简历数据直接推导
