import { config } from "dotenv";
// Load .env.local if present, but fallback to process.env
config({ path: ".env.local" });

import { defineConfig } from "prisma/config";

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!url && process.env.NODE_ENV !== 'production') {
  console.warn("⚠️  DATABASE_URL is not set. Prisma CLI commands may fail.");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: url || "", // Prisma 7 handles empty strings by looking at provider/adapter
  },
});
