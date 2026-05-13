# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # Start development server (Next.js 16 on port 3000)
npm run build        # Production build
npm run lint         # ESLint via Next.js
npm run test         # Run all tests once (Vitest)
npm run test:watch   # Vitest watch mode

# Run a single test file
npx vitest run src/lib/diagnosis.test.ts

# Database
npx prisma migrate dev    # Apply migrations
npx prisma db push        # Push schema without migration history
npx prisma db seed        # Seed from prisma/seed.ts (resets and reseeds)
npx prisma studio         # Open Prisma GUI
```

Requires `DATABASE_URL` (PostgreSQL) in `.env`.

## Architecture

This is a **TCM (Traditional Chinese Medicine) syndrome expert system** for diagnosing syndromes based on patient symptoms using a **Certainty Factor (CF)** algorithm.

### Core Domain Logic

- **`src/lib/diagnosis.ts`** — Heart of the system. Implements CF combination (`CF1 + CF2 * (1 - CF1)`) to score syndromes against selected symptoms. Called by `/api/diagnose`.
- **`src/lib/validations.ts`** — Zod schemas for all API inputs.
- **`src/lib/prisma.ts`** — Prisma client singleton using `@prisma/adapter-pg` (driver adapter pattern, not the standard client).

### Data Model

```
Complaint (e.g. "Insomnia")
  └── Syndrome (e.g. "Heart-Kidney Yin Deficiency")
        └── SyndromeRule → SymptomOption (with cfWeight 0–1)
              └── SymptomCategory (e.g. "Sleep Pattern")

Consultation — records a diagnosis session (patient data + selected symptoms + JSON result)
```

### API Routes (`src/app/api/`)

| Route | Purpose |
|---|---|
| `POST /api/diagnose` | Run CF diagnosis; saves Consultation |
| `GET /api/symptoms/categories` | Symptom categories with options |
| `GET /api/symptoms/options` | All symptom options |
| `GET /api/complaints` | All complaints |
| `GET /api/syndromes` | All syndromes |
| `GET /api/rules` | SyndromeRules (admin-protected) |
| `GET /api/admin/stats` | Dashboard stats (admin-protected) |
| `GET /api/contributors` | Contributors list |

### Auth & Middleware

Cookie-based admin session (`admin-session` cookie). `src/middleware.ts` guards `/admin/*` routes (except `/admin/login`) and `/api/admin/*`, `/api/rules/*`.

### Frontend

- **`src/app/providers.tsx`** — Wraps app in TanStack Query `QueryClientProvider`.
- **`src/app/admin/`** — Admin CRUD pages for Complaints, Syndromes, Symptoms, Contributors.
- No dedicated state management beyond TanStack Query (server state).

### Testing

Vitest with jsdom. MSW (`src/test/msw/`) mocks API calls in component tests. Integration tests (e.g. `syndromes.integration.test.ts`) hit the database directly via Prisma.

Test helper: `src/test/utils.tsx` exports a custom `render` wrapper.
