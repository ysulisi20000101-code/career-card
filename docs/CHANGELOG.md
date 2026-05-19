# Career Card — 开发日志

## 2026-05-19 | 面试空间 P2 用户旅程与 Agent 可信度收口

### 产品体验

- **弱输入强反馈**：空白或弱简历输入不再生成“0 段经历 / 0 年 / 0 家企业”的假成稿，改为生成可翻页、可对话微调的中性演示框架。
- **上传链路更稳**：上传页强化“上传即生成第一版面试演示 PPT”的主路径，解析进度按读取 PDF、识别经历、准备 PPT、进入工作台分段反馈。
- **水合防死点击**：上传入口在客户端事件真正可用后才开放，避免动态路由首次加载时用户快速点击无响应。
- **面试模式边界**：移动端演示区高度优化；进入面试模式后隐藏 Agent 与编辑区，保持投屏干净。
- **产品文案统一**：清理“故事演示 / 生成故事演示 / 匹配岗位”等偏离核心主线的旧文案，统一为“面试演示 PPT / 面试 PPT / 调整定位”。

### Agent 与演示生成

- **Starter deck 专用渲染**：新增 `starter_outline` 渲染路径，空白框架不再复用 Hero/Tension 等行业模板，避免混入 Groot/RAG/AI Agent 默认图。
- **Agent 诊断诚实化**：新增面试 PPT 诊断模块，对 starter deck 固定识别为“框架态”，不再误判为已有 AI 卖点或量化成果。
- **修改对比增强**：Agent 修改对比保留分类、风险、字段和单项接受/撤回能力，便于用户看清楚“改了哪里”。

### 验证结果

- `npm run typecheck` 通过
- `npm run lint` 通过
- `npm test -- --run` 通过：23 个测试文件，94 个测试
- `npm run build` 通过
- Chrome CDP 移动端链路验证通过：`/workspace/interview/new -> /edit -> 先看演示框架 -> /present -> 面试模式`
- 验证 starter deck 无 Groot/RAG/AI Agent 默认图，无“AI / Agent 相关卖点”和“包含量化结果”的假诊断

## 2026-05-18 | 面试空间主线重构与发布前稳定性修复

### 产品决策

- **面试空间主线收敛**：移除岗位理解、JD 上传、补充材料等旁路能力，回到“上传简历 -> 自动生成第一版面试故事 PPT -> 对话微调 -> 面试模式投屏”的核心竞争力。
- **李锦涛定制模板落地**：新增 `/reference-html/lijintao-interview-main.html` 精确还原入口，面试演示页在命中特定简历模板时直接渲染参考 HTML 版本。
- **Agent 体验统一**：面试空间右侧 Agent 工作台与个人网站风格保持一致，新增建议/微调分栏、面试模式隐藏编辑与 Agent 入口，并提供修改前后对比面板。

### 关键修复

- **API_SECRET 同源放行**：`checkApiKey()` 支持同源浏览器请求，避免生产配置 `API_SECRET` 后发布、AI 生成、事件接口被前端误拦；公开站 GET 不走密钥校验。
- **分享链接策略**：压缩 hash 便携链接，保留服务端短链校验逻辑，降低 serverless 多实例下复制不可访问短链的风险。
- **site-chat history 防 500**：修复 history 过滤谓词优先级，只接受 `{ role: "user" | "agent", content: string }`。
- **幻灯片 bullet XSS 防护**：`BaCard` 去掉 `dangerouslySetInnerHTML`，仅解析受控 `<em>` 强调标记。
- **旧模块清理**：删除 role-understanding 组件和 interview job/material 生成路径，旧草稿中的 job/material slide 会在演示页自动失效并重生成为 self 主线。

### 新增/调整模块

| 文件/目录 | 说明 |
|---|---|
| `src/components/interview/` | 面试空间 HTML 还原入口与 PPT Agent 工作台 |
| `src/components/agent-workbench/change-review-panel.tsx` | 统一展示 Agent 修改对比 |
| `src/lib/presentation/lijintao-template.ts` | 李锦涛面试空间 10 页模板生成逻辑 |
| `src/lib/presentation/instruction-edit.ts` | 本地指令微调：压缩页数、突出 Agent、改写表达重点 |
| `src/lib/presentation/slide-coach.ts` | 面试演讲教练提示 |
| `public/reference-html/` | 参考 HTML 静态资产 |
| `public/project-visuals/` | 首页/个人站项目视觉资产 |

### 验证结果

- `npm run typecheck` 通过
- `npm run lint` 通过
- `npm test` 通过：22 个测试文件，89 个测试
- `npm run build` 通过
- 本地冒烟：`/`、`/workspace`、`/workspace/interview/new`、`/workspace/interview/[id]/present`、`/reference-html/lijintao-interview-main.html` 均返回 200
- 文案扫描：`岗位理解 / 补充材料 / JD / 美团 / jobMaterials` 等旧路径无回潮

---

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
