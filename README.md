# career-card

AI-assisted career expression workspace for job seekers.

## Career Agent

Career Card includes a deterministic career agent and optional model-backed providers.
The agent is safe by default: if a model provider is not configured, times out, or returns invalid JSON, it falls back to the rules provider.
All generated patches still require manual confirmation in the UI.

Copy `.env.example` to `.env.local` and fill only the providers you want to use:

```bash
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash

MIMO_API_KEY=
MIMO_BASE_URL=
MIMO_MODEL=mimo-v2-flash
```

DeepSeek is wired as an OpenAI-compatible chat-completions provider.
Mimo is also treated as OpenAI-compatible, but requires `MIMO_BASE_URL` because the target endpoint may vary by deployment.

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
