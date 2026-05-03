# Career Card V1 Positioning and Scope

## 1) External Positioning

### One-line value proposition
Career Card helps non-coding job seekers generate a deliverable personal career site and present their work clearly in interviews.

### Chinese copy options (for landing / pitch)
- 主文案: 一键生成可投递的个人职业网站，让不会 coding 的求职者也能讲清自己的价值。
- 副文案: 不止是简历。你还可以在面试中用时间线、架构图和演示模式系统化呈现你的产出与成长。

### Product category statement
Career Card is a candidate-side career expression platform, not a resume beautification tool.

## 2) Target Users (V1)

V1 keeps broad user coverage, but uses adaptive expression depth:

- Campus: emphasize project understanding and learning potential.
- 1-5 years: emphasize outcomes, growth, and transferable capability.
- Senior: emphasize architecture decisions, business impact, and cross-team leverage.

## 3) Core Scenarios

### Create (Production)
- Input: uploaded resume + user edits.
- Output: public personal site + interview-ready presentation content.
- V1 objective: stable first publish with low editing burden.

### Evaluate (Card Viewing)
- Actor: interviewer.
- Goal: complete candidate fit pre-judgment in 1-3 minutes.
- V1 objective: fast readability and role relevance visibility.

### Present (Interview Space)
- Actor: candidate-led storytelling.
- Goal: explain work output, growth arc, relationship across jobs, and role understanding.
- V1 form: single presenter mode (no interviewer collaboration system yet).
- V1 enhancement: two-tier presentation generation —
  - **快速模式**: 纯规则引擎基线，8 页结构化叙事，1 秒内生成。
  - **AI 精修模式**: 规则引擎基线 + LLM 叙事增强，提升叙事质量、战略框架和可视化数据密度。LLM 不可用时自动降级为快速模式。

## 4) V1 Must / Not Now

### Must have
1. End-to-end pipeline: resume parsing -> structured editing -> publishable site.
2. Candidate presentation mode: 8-slide narrative flow with rule-based baseline + optional LLM enhancement.
3. Role understanding module: concise and guided content for target role analysis.
4. Interviewer reading-friendly view: clear hierarchy, key highlights, mobile readability.
5. AI enhancement graceful degradation: LLM unavailable → automatic fallback to rules baseline.

### Not now (strictly out of V1)
1. Real-time interviewer collaboration (live comments, multi-user annotation, replay).
2. Deep ATS integrations.
3. Enterprise-grade permission and organization management.

## 5) V1 Exit Criteria

V1 is considered ready when all are true:

1. A first-time user can publish a complete card from uploaded resume without external help.
2. A viewer can identify role fit signals within 3 minutes.
3. A candidate can complete a full interview walkthrough in presentation mode.
4. Role understanding module can be filled and displayed in the public card flow.
