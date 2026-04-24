# Interview Role Understanding Module (V1)

## Goal
Help candidates clearly explain how they understand the target role, what problems matter most, and how they would create value in the first 90 days.

## Module Position in Product
- Editing side: appears as a guided form in the interview preparation section.
- Display side: appears as a dedicated section in public card and presentation mode.

## V1 Minimal Structure

### Section A: Target Role Snapshot
- Target role title
- Company / team context (optional)
- Candidate's one-line role interpretation

Prompt:
`用一句话描述这个岗位在业务中的核心价值。`

### Section B: Top 3 Priority Problems
For each problem:
- Problem statement
- Why it matters (business/user impact)
- Current pain evidence (optional)

Prompt:
`你认为这个岗位最应该优先解决的三个问题是什么？每个问题分别影响了什么指标或体验？`

### Section C: 90-Day Plan
- Day 0-30: understanding and diagnosis
- Day 31-60: solution prototype and alignment
- Day 61-90: execution and measurable outcomes

Prompt:
`按0-30/31-60/61-90天拆解你的行动计划，强调可验证结果。`

### Section D: Relevant Experience Mapping
Map prior experiences to role requirements:
- Requirement
- My relevant project / case
- Evidence of outcome

Prompt:
`把岗位要求和你的过往经历做一一映射，避免泛泛而谈。`

## Candidate Input Constraints (V1)
- One-line interpretation: <= 80 chars.
- Each priority problem: <= 120 chars.
- Each 90-day phase: <= 180 chars.
- Each experience mapping row: <= 200 chars.
- At least 1 filled item in each section to be considered complete.

## Presentation Rendering Rules
- Card view: compact summary with expand/collapse.
- Interview mode: progressive reveal by section (A -> B -> C -> D).
- Always show "evidence first": problem -> approach -> expected outcome.

## Completion Score (lightweight)
Show a simple preparation score (0-100), based on:
- Section completeness (40%)
- Concrete evidence usage (30%)
- Outcome measurability language (30%)

This score is guidance-only and not exposed to interviewers in V1.
