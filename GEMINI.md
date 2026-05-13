# TCM Syndrome Expert System

A fullstack Traditional Chinese Medicine (TCM) Syndrome Diagnosis Expert System built with Next.js 14, Prisma, and PostgreSQL. It uses an iterative Certainty Factor (CF) algorithm to provide diagnosis based on patient symptoms.

## Project Overview

- **Purpose:** Provide a mobile-first diagnosis tool for TCM syndromes and a backoffice for knowledge base management.
- **Frontend:** Next.js 14 (App Router), React 19, Tailwind CSS.
- **Backend:** Next.js Route Handlers (API), Prisma ORM (v7), PostgreSQL.
- **State Management:** React Query (TanStack Query).
- **Validation:** Zod schemas for API input validation.
- **Security:** Middleware for admin area protection and Zod for schema enforcement.
- **Architecture:** 
  - `src/app/api`: Server-side logic and database interactions.
  - `src/app/admin`: Backoffice management interface.
  - `src/lib`: Shared utilities (Prisma client, CF logic, Zod schemas).

## Building and Running

### Prerequisites
- Node.js (v20+ recommended)
- PostgreSQL database
- Environment variables set in `.env` (specifically `DATABASE_URL`)

### Development
```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Seed initial master data
npx prisma db seed

# Start development server
npm run dev
```

### Testing
```bash
# Run unit tests (Vitest)
npm test
```

### Production
```bash
# Build the project
npm run build

# Start production server
npm run start
```

## Development Conventions

- **Next.js App Router:** Use the `src/app` directory for routing and layouts.
- **TypeScript:** Strict typing is enforced. Await `params` in dynamic route handlers (Next.js 15+ convention).
- **Prisma 7:** Database connection is managed via the `@prisma/adapter-pg` driver adapter in `src/lib/prisma.ts`.
- **Diagnosis Logic:** The Certainty Factor algorithm follows `CF_combine = CF1 + CF2 * (1 - CF1)`. Core logic is in `src/lib/diagnosis.ts` and verified with TDD.
- **Security:** 
  - Always validate API inputs using Zod schemas defined in `src/lib/validations.ts`.
  - Admin routes are protected via `src/middleware.ts`.
- **Styling:** Mobile-first responsive design using Tailwind CSS.
- **Icons:** Use `lucide-react` for iconography.
