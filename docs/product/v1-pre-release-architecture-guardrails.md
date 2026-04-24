# Career Card V1 Pre-Release Architecture Guardrails

## Purpose
Provide a strict pre-release gate to prevent regressions in the V1 core promise: parse -> confirm -> present -> share.

## Release Gate Rules
- Any P0 item failing blocks release.
- Any P1 item failing requires explicit owner + fix ETA before release approval.
- All checks should be recorded with result (`pass` / `fail`) and evidence.

## A. End-to-End Functional Invariants (P0)
- [ ] Uploading a text-based PDF from `upload` to `confirm` works without runtime errors.
- [ ] `confirm` can persist edits for profile, timeline, education, and skills.
- [ ] `edit` presentation next/prev order exactly matches rendered timeline order.
- [ ] `publish` generates a portable link that opens on another device.
- [ ] Oversized payload does not silently downgrade QR to same-device short link.
- [ ] Opening malformed `#d=` payload never crashes `share` page (safe fallback required).

## B. Domain Integrity Invariants (P0/P1)
- [ ] Deleting a skill node removes its entire subtree (no orphan descendants).
- [ ] Deleting an architecture module removes its entire subtree (no orphan descendants).
- [ ] Timeline sorting logic is centralized and reused by all timeline consumers.
- [ ] External share payload is runtime-validated before rendering.
- [ ] Parser output must preserve line structure required by section detection.

## C. State and Boundary Constraints (P1)
- [ ] Components use narrow store selectors instead of pulling full store objects where possible.
- [ ] Store contains only active product state (no dead/deprecated fields).
- [ ] Domain logic is not duplicated across UI components when shared utility exists.
- [ ] Public/share pages do not depend on editor-only local state assumptions.

## D. UX Reliability Checks (P1)
- [ ] Confirm page contains no fake-edit controls (all editable UI must persist changes).
- [ ] Share page clearly communicates same-device vs cross-device capability.
- [ ] Empty states exist for timeline/skills/architecture and do not hard-crash.
- [ ] Keyboard interactions in presentation mode are predictable and single-owned.

## E. Build and Quality Gates (P0)
- [ ] `npm run lint` has 0 errors and 0 warnings.
- [ ] `npm run build` passes TypeScript and app build.
- [ ] No known console errors in major routes: `/`, `/edit`, `/profile`, `/p/[slug]`.

## F. Manual Smoke Test Script (Release Day)
1. Parse two resumes: one clean text PDF, one noisy/edge PDF.
2. In `confirm`, modify at least 1 field in each section and verify persistence after refresh.
3. In `edit`, run full presentation next/prev cycle and verify dot/index consistency.
4. In `publish`, verify:
   - portable link copy works,
   - QR behavior for normal payload,
   - fallback message for oversized payload.
5. Open shared page in a clean browser session and verify timeline/skills/architecture render.
6. Open an intentionally malformed `#d=invalid` link and verify graceful invalid-link state.

## G. Ownership Before Release
- Engineering owner:
- Product owner:
- QA owner:
- Release date:
- Final decision:
