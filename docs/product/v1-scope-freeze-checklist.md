# V1 Scope Freeze Checklist

## Purpose
This checklist protects V1 from feature creep, especially interviewer-side collaboration requests.

## In Scope (build now)
- Resume parsing quality and correction workflow.
- Public career card readability and role-fit highlights.
- Candidate-led presentation mode (8-slide narrative + quick/AI mode toggle).
- Role understanding module (lightweight, structured).
- Basic publish/share path for interview delivery.
- AI enhancement with graceful degradation (LLM unavailable → rules fallback).

## Out of Scope (park to post-V1)
- Interviewer real-time note-taking and shared annotations.
- Multi-user synchronous sessions.
- Interview replay timeline.
- ATS workflow integration and enterprise admin controls.

## Change Control Rules
Any new request must pass all checks below to enter V1:

1. It directly improves publish completion, viewer comprehension, or candidate presentation quality.
2. It can be delivered without introducing new platform dependencies (ATS, org permissions, realtime infra).
3. It does not add a second primary user workflow beyond candidate-led use.

If one check fails, move to post-V1 backlog.

## Backlog Parking Slots (post-V1)
- `P1`: interviewer-side collaboration layer.
- `P2`: recruiter workflow integrations.
- `P3`: advanced analytics and AI coaching.
