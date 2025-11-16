import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma Client configured for Neon PostgreSQL
 * - Uses pooled connection in production for better performance
 * - Supports direct connection for migrations
 * - Implements singleton pattern to prevent connection exhaustion
 */
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        // Use pooled connection if available (Neon), fallback to direct
        url: process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
