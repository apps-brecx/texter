import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

// Next.js hot-reloads modules in dev; without the global we'd leak a pool per reload.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Serverless hosts run many short-lived instances against one database, so the
// per-instance pool has to stay small. Tune with DATABASE_POOL_MAX.
const max = Number(process.env.DATABASE_POOL_MAX ?? 5);

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaPg({ connectionString, max }) });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
