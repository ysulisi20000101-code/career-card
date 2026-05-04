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

## Deploy to Tencent EdgeOne Pages

Mainland access to `*.vercel.app` may time out; EdgeOne default hostnames (for example `*.edgeone.cool`) are usually more reliable.

### Important: project type for `pages deploy`

This workflow runs `npx edgeone pages deploy`. According to EdgeOne CLI help, **an existing Pages project must be of the direct-upload type**. Projects created via **Git import** in the console often **cannot** be updated by CLI deploy and the job will fail.

Pick one path:

- Create a **new** Pages project with **Direct upload**, then set GitHub secret `EDGEONE_PAGES_PROJECT` to that exact project name; or  
- Skip this workflow: connect GitHub only in the Tencent EdgeOne console and let Pages build there (configure build command and env vars in the console).

### Option A: GitHub Actions (direct-upload projects)

1. Open [EdgeOne Pages console](https://console.tencentcloud.com/edgeone/pages), create or select a **direct-upload** project, note the **project name** exactly as shown.
2. Create an **API Token**: [API Token](https://pages.edgeone.ai/document/api-token).
3. In GitHub: **Settings → Secrets and variables → Actions**, add:
   - `EDGEONE_API_TOKEN` - token from step 2  
   - `EDGEONE_PAGES_PROJECT` - project name (for example `career-card`)  
   - Optional: `EDGEONE_DEPLOY_AREA` - `global` or `overseas` (default is `global` if unset). Try `overseas` if deploy fails with region-related errors.
4. Push to **`main`** or run **Actions → Deploy EdgeOne Pages → Run workflow**.

Workflow file: [.github/workflows/edgeone-pages.yml](.github/workflows/edgeone-pages.yml).

### Option B: Local CLI

```bash
npm install -g edgeone
edgeone login
edgeone pages link
edgeone pages deploy
```

See [EdgeOne CLI](https://pages.edgeone.ai/document/edgeone-cli).

## Repository

- GitHub: <https://github.com/ysulisi20000101-code/career-card>

## Status

- Core V1 flow is implemented.
- Production domain rollout can proceed after ICP/filing and final domain configuration.
