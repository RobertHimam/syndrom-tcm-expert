# TCM Syndrome Expert System

A fullstack Traditional Chinese Medicine (TCM) Syndrome Diagnosis Expert System built with **Next.js 14**, **Prisma**, and **PostgreSQL**. The system utilizes an iterative **Certainty Factor (CF)** algorithm to provide accurate TCM syndrome diagnosis based on patient-reported symptoms.

## 🚀 Key Features

- **Expert Diagnosis Engine:** Implements the TCM logic using a CF-based mathematical model.
- **Mobile-First Interface:** Responsive design for clinicians and patients on the go.
- **Admin Dashboard:** Comprehensive backoffice for managing symptoms, syndromes, and diagnostic rules.
- **Robust API:** Type-safe API endpoints validated with Zod.
- **Automated Verification:** Extensive test suite covering core diagnosis logic and UI components.

## 🛠️ Tech Stack

- **Frontend:** [Next.js 14](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
- **Backend:** Next.js Route Handlers, [Prisma ORM](https://www.prisma.io/)
- **Database:** PostgreSQL
- **Validation:** [Zod](https://zod.dev/)
- **Testing:** [Vitest](https://vitest.dev/), [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- **Icons:** [Lucide React](https://lucide.dev/)

## 📦 Getting Started

### Prerequisites
- Node.js (v20+)
- PostgreSQL instance
- Environment variables configured in `.env` (see `prisma.config.ts` for schema requirements)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/RobertHimam/syndrom-tcm-expert.git
    cd syndrom-tcm-expert
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Database Setup:**
    ```bash
    npx prisma generate
    npx prisma db push
    npx prisma db seed
    ```

4.  **Run the application:**
    ```bash
    npm run dev
    ```

## 🧪 Testing

The project emphasizes reliability through TDD. To run the full test suite:

```bash
npm test
```

For continuous testing during development:
```bash
npm run test:watch
```

## 📐 Architecture

- `src/app/api`: Server-side logic and database interactions.
- `src/app/admin`: Backoffice management interface.
- `src/lib`: Core utilities (Prisma client, CF algorithm in `diagnosis.ts`).
- `prisma/`: Database schema and seeding scripts.

## 📄 License

This project is private and intended for internal TCM diagnostic expertise.
