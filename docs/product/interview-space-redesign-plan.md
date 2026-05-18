# Interview Space Redesign Plan

Date: 2026-05-18

## Product Position

Interview Space is not a general job-prep workspace. Its core promise is:

> Upload a resume and immediately receive a polished interview presentation.

The first generated deck must be strong enough to create confidence before the user edits anything. Follow-up value comes from conversational refinement, comparison, and interview-safe presentation mode.

## Removed Scope

The following paths are intentionally out of scope for this version:

- JD upload or JD image parsing
- Role-understanding modules
- Supplemental-material modules
- Separate job-prep flows before the first deck is generated

These paths dilute the first-session feedback loop and make the product feel like a form workflow instead of an instant presentation generator.

## User Journey

1. User creates an Interview Space.
2. User uploads a resume PDF.
3. The app parses the resume and automatically generates the first interview-story deck.
4. User lands directly in the presentation workbench.
5. User can preview, enter interview mode, or ask the Agent to refine the deck.
6. Agent changes can be reviewed with before/after comparison.
7. Interview mode hides Agent and editing surfaces for projection.

## Experience Principles

- Strong feedback beats long setup.
- The deck is the product's competitive advantage.
- Agent should feel like an editing partner, not a detached chatbot.
- Every generated claim must trace back to resume evidence or user-confirmed facts.
- Interview mode must protect the speaker from exposing internal editing UI.

## Implemented Modules

| Area | Implementation |
|---|---|
| First deck generation | `generatePresentationDraft()` and Li Jintao custom template |
| Exact HTML restoration | `ExactHtmlInterviewSpace` renders `/reference-html/lijintao-interview-main.html` |
| Agent workbench | `PresentationAgentWorkbench` with quick prompts and chat refinement |
| Change review | `change-review-panel.tsx` and `diffPresentationDraft()` |
| Instruction edits | `instruction-edit.ts` for page compression and emphasis changes |
| Speaker coaching | `slide-coach.ts` and `AgentCoachPanel` |
| Interview mode | `PresentationShell` display mode that hides editing/Agent UI |

## Acceptance Checklist

- Upload flow no longer asks for JD or supplemental materials.
- First deck generation happens automatically after resume parsing.
- Presentation page only renders self-story slides.
- Old job/material slides in stored drafts are detected and regenerated.
- Agent controls are hidden in interview mode.
- User can review what the Agent changed.
- Reference HTML has 10 pages and no JD/job-understanding/supplemental-material copy.
- `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` pass.
