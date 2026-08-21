# Loqol TDS Prototype

Small full-stack web app for collecting California TDS disclosure answers, generating a filled TDS PDF, and preparing a DocuSeal signature handoff.

This project is built as a take-home prototype, so it optimizes for product clarity and explainability over breadth. The core goal is to make a stressed seller feel guided instead of dumped into a legal PDF.

## Submission Notes

- Deployed URL: not included from this local environment
- Repo: this workspace
- Current local verification date: Friday, August 21, 2026

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Prisma + SQLite
- `pdf-lib` for local TDS generation
- Browser Web Speech APIs for in-browser voice input/output

## What I Built

### 1. Agent workspace

- Email/password login for the agent
- Create seller/deal
- Generate a secure seller request link
- Review progress and answer quality
- Preview the filled TDS PDF
- Trigger a DocuSeal draft when sandbox credentials are configured

### 2. Seller workspace

- Resume-safe dashboard on a secure tokenized link
- Progress tracking
- A quick form path
- A voice-guided path that runs in the browser using Web Speech
- Shared answer state between both paths
- Review and submit flow

## Seller Experience Design

The main product decision is not "voice or form?" globally. It is "which tool is least annoying for this question right now?"

### Form-first sections

These are faster to tap than to talk through:

- Section A inventory
- Most binary property-profile setup
- Section B defect category selection

Why:

- These questions are mechanical
- The seller usually knows the answer immediately
- Voice would add friction instead of reducing it

### Voice-first sections

These are the questions where plain English and follow-up matter more than speed:

- Section A follow-up: anything not in operating condition
- Section C legal / historical / nuanced disclosures

Why:

- The language is intimidating
- Sellers often do not know if the legal term applies until they hear examples
- A yes/no without context is often not usable
- These are the places where "thinking out loud" is actually helpful

### Switching paths without losing work

Both the voice flow and the form flow write into the same structured answer model. A seller can:

- start in the form
- switch to voice for a hard question
- come back later
- finish in review

without duplicating or losing answers.

## Data Model

I intentionally separated `deal` metadata from disclosure answers.

### Relational entities

- `AgentUser`
- `Seller`
- `Deal`
- `AnswerRevision`
- `VoiceTurn`

### Why `AnswerRevision` instead of a single JSON blob

I wanted the app to be explainable when the same question is answered twice.

Each save creates a new revision with:

- `questionKey`
- normalized JSON value
- source (`FORM`, `VOICE`, `SYSTEM`, `AGENT_REVIEW`)
- optional raw text
- timestamp

That gives a durable audit trail and makes it easy to answer questions like:

- what was the current answer?
- did the seller change their mind?
- did voice say one thing and the form later say another?

The current answer set is derived from the latest revision for each key.

## Authentication

### Agent auth

Agent auth uses:

- hashed password stored in SQLite with `bcryptjs`
- signed `httpOnly` session cookie using `jose`

This means:

- the password is not stored in plaintext
- the browser cannot read the session cookie from JavaScript
- protected routes redirect to `/login` when the session is missing or invalid

### Seller auth

Seller access is intentionally separate from agent auth.

The seller receives a high-entropy random token in the URL:

- token is generated server-side
- only a SHA-256 hash of that token is stored
- the token expires

This means guessing a deal id is useless, and even if the database is read directly, the original link token is not stored in plaintext.

### What happens if someone guesses a seller URL?

If the token is valid, they can access that seller flow. So the security model depends on the token being long, random, and time-bounded. In a production version I would likely add one more step, such as:

- emailed magic-link confirmation
- seller DOB / ZIP confirmation
- one-time passcode on first open

For the take-home, the random signed-link model is the cleanest tradeoff.

## How Answers Map To The TDS

The attached TDS lives at:

- `public/forms/loqol-ca-tds.pdf`

I inspected the real AcroForm field names and mapped structured answers into those fields with `pdf-lib`.

### What is mapped today

- seller occupancy
- Section A inventory checkboxes
- Section A operating-condition follow-up
- Section B yes/no and defect checkboxes
- Section B explanation
- Section C yes/no answers
- Section C consolidated explanation text
- seller names, initials, dates
- property address on later pages

### What is intentionally partial

- some page-1 bracket placeholders are drawn onto the PDF manually rather than backed by native fields
- not every signature role is fully automated through DocuSeal
- a few compound equipment options are simplified in the current mapper

This matches the assignment guidance: show a deliberate shape of the problem, not a perfect 150-field wiring marathon.

## Partial, Ambiguous, And Contradictory Answers

This was a core product concern, so I handled it in three layers.

### 1. Partial answers are allowed

If the seller says "I’m not sure," the app does not force a fake answer. It keeps the item incomplete and lets them continue.

### 2. Voice follow-ups ask for usable detail

If a seller says "yes" to a Section C question but gives no explanation, the voice flow asks for a short follow-up. The review screen also flags that gap.

### 3. Contradictions are surfaced, not discarded

The app currently flags issues such as:

- Section A says nothing is out of operating condition, but later sections mention defects
- Section B is marked No, but defect categories or explanation text still exist
- Section C items marked Yes without any explanation

The product stance is:

- never silently overwrite
- never silently hide contradictions
- show the inconsistency and let the user or agent reconcile it

## DocuSeal Strategy

I deliberately keep disclosure collection and signing as separate responsibilities.

### Current flow

1. Seller answers questions in the app
2. The app generates the filled TDS locally
3. If `DOCUSEAL_KEY` is configured, the app creates a DocuSeal draft from the filled PDF
4. DocuSeal handles the signature step

### Why I chose this shape

Trying to make DocuSeal the primary storage layer for 150+ disclosure inputs adds too much synchronization complexity too early.

This prototype treats:

- the app as the source of truth for structured answers
- the generated PDF as the review artifact
- DocuSeal as the signature layer

That is easier to reason about and easier to defend in an interview.

### Current limitation

The DocuSeal code path is implemented, but I did not live-verify it against a real sandbox key in this environment. The local filled-PDF flow is fully wired and verified. With sandbox credentials added, the draft handoff should be the next thing to validate manually.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment file

```bash
cp .env.example .env
```

### 3. Initialize the database

```bash
npm run db:push
npm run db:seed
```

### 4. Start the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Demo Credentials

### Agent

- Email: `agent@loqol.demo`
- Password: `loqol-demo`

### Seller

- Seeded demo seller link: `/seller/seller_demo_wm0KYwU4uYj0gQ5Xk3At4mWJxGc7Zx5L`

## Environment Variables

- `DATABASE_URL`
- `APP_SECRET`
- `DOCUSEAL_KEY`
- `DOCUSEAL_BASE_URL`

For the Vercel prototype deployment, use:

- `DATABASE_URL=file:/tmp/loqol.db`
- `LOQOL_BOOTSTRAP_RUNTIME_DB=true`
- a long random `APP_SECRET`

That keeps the demo self-starting on Vercel's serverless filesystem. It is intentionally a prototype choice; a production app should use Postgres.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run db:push`
- `npm run db:seed`

## What I Would Build Next

- real email delivery for seller requests
- seller identity confirmation beyond a raw secure link
- richer contradiction resolution UI with explicit compare/choose actions
- live DocuSeal sandbox validation and role-complete signer placement
- more complete page-1 field coverage
- streaming LLM-backed explanation / extraction for the voice assistant instead of the current deterministic parser
- better autosave batching and offline recovery

## Known Omissions

- no production email provider
- no deployed URL from this environment
- no buyer/agent signature orchestration beyond the scaffolded DocuSeal draft path
- voice flow uses browser speech APIs plus rule-based normalization, not a fully model-driven real-time agent

## Verification

Verified locally on Friday, August 21, 2026:

- `npm run lint`
- `npm run build`
- `npm run db:seed`

`next build` succeeds. Prisma emits Turbopack tracing warnings because the generated Prisma client performs dynamic filesystem access internally; the build still completes successfully.
