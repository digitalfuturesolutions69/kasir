import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// SQLite defaults to "delete" journal mode, which takes an exclusive lock
// on the whole database file for the duration of every write — any
// concurrent read or write just queues up behind it. WAL mode lets reads
// proceed while a single writer commits, which is the difference between
// "fine for a few dozen concurrent users" and "fine for a few hundred".
// This is a one-time property of the database file itself (stored in its
// header, not a per-connection setting), so running it on every startup
// is just a cheap idempotent no-op once it's already set.
if (globalForPrisma.prisma === undefined) {
  // PRAGMA journal_mode=WAL returns the resulting mode as a row (like a
  // SELECT), which $executeRawUnsafe rejects — SQLite quirk, not a typo.
  prisma.$queryRawUnsafe("PRAGMA journal_mode=WAL;").catch((err) => {
    console.error("Failed to set SQLite journal_mode=WAL", err);
  });
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
