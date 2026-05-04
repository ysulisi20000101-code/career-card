# career-card

AI-assisted career expression workspace for job seekers.

`career-card` helps candidates produce two key artifacts:

- a pre-interview **shareable personal website**
- an in-interview **presentation space** for structured storytelling

## Features

- Resume upload and browser-side parsing pipeline
- Structured editing workflow (timeline, skills, architecture)
- Split flows for:
  - Personal Website
  - Interview Space
- Preview, presentation, and share path
- Local-first persistence and portable share links

## V1 Scope

V1 focuses on candidate-side creation and delivery:

- Candidate creates and edits content
- Candidate shares links before interview
- Candidate presents during interview

Out of scope for V1:

- Multi-user interviewer collaboration
- ATS integrations and enterprise permissions

See product documents at [`docs/README.md`](docs/README.md).

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Zustand (state and persistence)
- Tailwind CSS v4 + Radix UI
- D3 + React Flow (visual modules)

## Local Development

Requirements:

- Node.js 20+
- npm 10+ (recommended)

Install and run:

```bash
npm install
npm run dev:stable
```

Open:

- <http://127.0.0.1:3000>

Quality checks:

```bash
npm run lint
npm run build
```

## Main Routes

- `/` landing page
- `/workspace` dashboard
- `/workspace/personal/new`
- `/workspace/personal/[id]/edit`
- `/workspace/personal/[id]/preview`
- `/workspace/personal/[id]/publish`
- `/workspace/interview/new`
- `/workspace/interview/[id]/edit`
- `/workspace/interview/[id]/preview`
- `/workspace/interview/[id]/present`
- `/p/[slug]` public share page

## Repository

- GitHub: <https://github.com/ysulisi20000101-code/career-card>

## Status

- Core V1 flow is implemented.
- Production domain rollout can proceed after ICP/filing and final domain configuration.
