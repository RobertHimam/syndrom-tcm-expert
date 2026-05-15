import { PrismaClient } from '@/generated/prisma-client';
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Production-grade Prisma Client Singleton
 * 
 * This implementation is optimized for:
 * 1. Vercel Serverless Functions (manages connections efficiently)
 * 2. NeonDB (compatible with pg driver adapter)
 * 3. Local Development (prevents HMR connection leaks)
 */

interface CustomGlobal {
  prisma?: PrismaClient;
}

const globalForPrisma = global as unknown as CustomGlobal;

/**
 * Instantiate Prisma Client with the PostgreSQL adapter.
 */
const createPrismaClient = () => {
  // Vercel provides POSTGRES_URL or DATABASE_URL
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!connectionString) {
    // Fail fast during runtime if configuration is missing.
    // Note: Next.js evaluates this during build; ensure envs are available if needed then.
    throw new Error(
      'DATABASE_URL is missing. Please check your environment variables.'
    );
  }

  // Create a connection pool optimized for serverless/edge environments
  const pool = new Pool({ 
    connectionString,
    max: 10, // Optimized for serverless cold starts and Neon's pooling
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

// Singleton pattern for development, direct export for production
export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
