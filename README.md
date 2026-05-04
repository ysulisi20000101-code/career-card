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

### Error you may see (Git-linked EdgeOne project)

If Actions logs show:

`Project *** exists but has Provider "Github". This project type does not support direct folder or zip file deployment. Only projects with Provider "Upload" are supported.`

then your Pages project was created with **Git integration** in the Tencent console. **This GitHub Actions workflow cannot deploy to it** (CLI upload only supports **Upload / direct-upload** projects).

### Pick exactly one path

**Path 1 - Keep using this repo workflow (recommended if you want GitHub Actions)**

1. In [EdgeOne Pages console](https://console.tencentcloud.com/edgeone/pages), **create a new project** and choose **Direct upload / Upload** (not Git import).
2. Copy the **exact project name** into GitHub secret `EDGEONE_PAGES_PROJECT`.
3. Re-run **Deploy EdgeOne Pages** on `main`.

You may keep the old Git-linked project separately; point users to the new Upload project URL if you migrate.

**Path 2 - Keep your current Git-linked project**

1. **Disable or delete** [.github/workflows/edgeone-pages.yml](.github/workflows/edgeone-pages.yml) (or ignore failing runs).
2. In the EdgeOne console, configure **GitHub integration**, branch `main`, and set build/install commands for Next.js (for example `npm ci` then `npm run build`) per EdgeOne docs.

### Path 1 setup (secrets)

1. Create an **API Token**: [API Token](https://pages.edgeone.ai/document/api-token).
2. GitHub: **Settings > Secrets and variables > Actions**:
   - `EDGEONE_API_TOKEN`
   - `EDGEONE_PAGES_PROJECT` (Upload-type project name)
   - Optional: `EDGEONE_DEPLOY_AREA` = `global` or `overseas`

### Path 1 local CLI (optional)

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
