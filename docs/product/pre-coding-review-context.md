# Career Card Pre-Coding Review Context

## Purpose
This document summarizes structural and concrete issues found after reviewing the current implementation. It is intended to be the baseline context before the next coding cycle.

## Review Scope
- Architecture design reasonability
- Extensibility
- Product usability
- Reported concrete issues:
  - fake PDF import
  - cannot flip pages in presentation
  - invalid share links

## High-Priority Findings (P0 / P1)

### P0-1: Share link model is internally inconsistent for cross-device usage
- **Symptoms**: users report share links as invalid.
- **Evidence**:
  - publish builds two links: short local link and hash-embedded portable link in `src/components/publish/publish-page.tsx`.
  - read-side only succeeds via `#d=` payload or same-device localStorage in `src/components/share/share-view.tsx`.
  - storage is localStorage-only in `src/lib/share/storage.ts`.
- **Root cause**:
  - short link (`/p/[slug]`) is not truly portable because data is not server-backed.
  - when QR payload is too large, QR downgrades to short link (same-device only), which is frequently unusable across devices.
- **Impact**: core delivery promise ("share to interviewer") breaks in realistic cross-device scenarios.
- **Recommendation**:
  1. Define one reliable cross-device source of truth (backend storage or compressed signed payload with hard limit + fallback).
  2. Explicitly label link capability in UI before copy/download.
  3. Add link validation at publish-time and show warnings pre-share.

### P1-1: Presentation navigation order is inconsistent across components
- **Symptoms**: page flipping feels wrong or "cannot flip" in some sequences.
- **Evidence**:
  - `TimelineSlide` sorts timeline by start date before rendering in `src/components/timeline/timeline-slide.tsx`.
  - `PresentationMode` computes index and next/prev on unsorted store order in `src/components/presentation/presentation-mode.tsx`.
- **Root cause**:
  - two components use different ordering logic for the same navigation state (`activeTimelineId`).
- **Impact**:
  - navigation dots/arrows can become semantically inconsistent with visible slide sequence.
  - users perceive broken page-turn behavior.
- **Recommendation**:
  1. Centralize timeline ordering in one selector/util.
  2. Make `PresentationMode` and `TimelineSlide` consume identical ordered data.
  3. Add an integration test: next/prev must traverse same order as rendered slides.

## Structural Issues (Architecture / Extensibility)

### S1: "No-backend publish" architecture constrains product evolution
- **Current state**:
  - publishing and retrieval depend on local browser state + URL hash payload.
- **Risk**:
  - hard to support stable links, analytics integrity, permissions, interview-space collaboration, and ATS integration.
- **Decision needed**:
  - keep pure client for demo, or introduce minimal backend (card storage + signed access + basic telemetry).

### S2: Domain logic is scattered across view components
- **Current state**:
  - ordering, navigation, share semantics, and hydration logic are spread across multiple UI files.
- **Risk**:
  - low cohesion and high regression risk when adding interview-space features.
- **Recommendation**:
  - move core logic to domain services/selectors:
    - `timelineOrderSelector`
    - `shareLinkStrategy`
    - `publishedCardResolver`

### S3: Parser quality and product copy are mismatched
- **Current state**:
  - real PDF extraction is implemented in `src/lib/parser/pdf-parser.ts` (not fake import), but resume structuring is rule-based heuristics in `src/lib/parser/resume-parser.ts`.
  - fallback values can be derived from filename/heuristics when fields are missing.
- **Risk**:
  - users may perceive extraction as "fake AI" when parsed output quality is low.
- **Recommendation**:
  - align copy from "AI parsing" to "intelligent parsing + manual correction" for V1.
  - expose parse confidence and field-level "needs confirmation" states.

## Usability Issues

### U1: Link semantics are not obvious enough
- users can copy a link without understanding portability constraints.
- recommendation: clear badges (`same-device`, `cross-device`) and disabled actions when unsupported.

### U2: Interview-space mode switch lacks behavior parity
- `scroll/click/modal` mode exists in state, but behavior differentiation is limited at runtime.
- recommendation: either fully implement each mode behavior or reduce to one stable mode in V1.

### U3: Parse failure guidance is good, but success confidence is opaque
- upload has failure messaging, but successful parsing lacks confidence visibility per section.
- recommendation: add confidence labels in confirm step (profile/work/skills).

## Concrete Issue Verification Against Reported Problems

### 1) "PDF fake import"
- **Conclusion**: not a fake upload implementation.
- **Verified**:
  - real PDF text extraction via `pdfjs-dist` exists.
  - real rule-based parsing pipeline exists.
- **Why users still report it**:
  - weak extraction for some resume formats can resemble mock/fabricated output.

### 2) "Cannot flip pages"
- **Conclusion**: reproducible logic-level inconsistency exists.
- **Verified root cause**:
  - inconsistent timeline ordering between presentation container and slide renderer.

### 3) "Generated share link invalid"
- **Conclusion**: product-level validity is inconsistent by link type/device.
- **Verified root cause**:
  - short link is local-only.
  - QR fallback can produce short link for large payloads, breaking cross-device expectation.

## Priority Fix Order Before Next Coding Sprint

1. **Unify presentation timeline ordering** (stability fix).
2. **Redesign share link strategy** with explicit portability guarantees.
3. **Add parse confidence + copy correction** to close expectation gap.
4. **Extract domain selectors/services** for timeline/share/hydration logic.

## Quick Technical Notes
- Lint currently reports warnings but no blocking errors.
- Production build currently succeeds.
- Next.js warns about workspace root detection due to multiple lockfiles; this should be cleaned to reduce environment ambiguity.
