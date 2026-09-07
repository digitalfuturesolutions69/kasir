// One-time data migration: copies every row out of the old SQLite
// database into the Postgres database DATABASE_URL currently points at
// (schema.prisma's provider is already "postgresql" by the time this
// runs — see deploy/POSTGRES_CUTOVER.md for the full runbook).
//
// Not part of the app itself — run manually once, then discard. Needs
// better-sqlite3, installed ephemerally (`npm install better-sqlite3
// --no-save`) so it never becomes a permanent dependency of the app.
//
// Usage:
//   SQLITE_SOURCE_PATH=./prisma/prisma/prod.db node prisma/migrate-to-postgres.mjs
//
// Safe to re-run: rows that already exist (same id) are reported as
// skipped, not duplicated or overwritten.

import Database from "better-sqlite3";
import { PrismaClient } from "@prisma/client";

const SQLITE_PATH = process.env.SQLITE_SOURCE_PATH || "./prisma/prisma/prod.db";

function toDate(value) {
  if (value === null || value === undefined) return null;
  return typeof value === "number" ? new Date(value) : new Date(String(value));
}

async function main() {
  console.log(`Reading SQLite source: ${SQLITE_PATH}`);
  const sqlite = new Database(SQLITE_PATH, { readonly: true, fileMustExist: true });
  const prisma = new PrismaClient();

  const summary = { users: [0, 0], categories: [0, 0], transactions: [0, 0], appSettings: [0, 0] };
  // each entry is [migrated, skipped]

  try {
    // --- AppSettings (no FK dependency, migrate first or last, doesn't matter) ---
    const settingsRows = sqlite.prepare(`SELECT * FROM "AppSettings"`).all();
    for (const row of settingsRows) {
      try {
        await prisma.appSettings.create({ data: { id: row.id, aiProvider: row.aiProvider } });
        summary.appSettings[0]++;
      } catch (err) {
        if (err.code === "P2002") summary.appSettings[1]++;
        else throw err;
      }
    }

    // --- Users ---
    const userRows = sqlite.prepare(`SELECT * FROM "User"`).all();
    for (const row of userRows) {
      try {
        await prisma.user.create({
          data: {
            id: row.id,
            name: row.name,
            email: row.email,
            passwordHash: row.passwordHash,
            createdAt: toDate(row.createdAt),
            plan: row.plan,
            scanCount: row.scanCount,
            scanPeriodStart: toDate(row.scanPeriodStart),
          },
        });
        summary.users[0]++;
      } catch (err) {
        if (err.code === "P2002") summary.users[1]++;
        else throw err;
      }
    }

    // --- Categories (depend on User) ---
    const categoryRows = sqlite.prepare(`SELECT * FROM "Category"`).all();
    for (const row of categoryRows) {
      try {
        await prisma.category.create({
          data: {
            id: row.id,
            name: row.name,
            type: row.type,
            color: row.color,
            icon: row.icon,
            createdAt: toDate(row.createdAt),
            userId: row.userId,
          },
        });
        summary.categories[0]++;
      } catch (err) {
        if (err.code === "P2002") summary.categories[1]++;
        else throw err;
      }
    }

    // --- Transactions (depend on User, optionally Category) ---
    const transactionRows = sqlite.prepare(`SELECT * FROM "Transaction"`).all();
    for (const row of transactionRows) {
      try {
        await prisma.transaction.create({
          data: {
            id: row.id,
            type: row.type,
            amount: row.amount,
            description: row.description,
            date: toDate(row.date),
            createdAt: toDate(row.createdAt),
            updatedAt: toDate(row.updatedAt),
            userId: row.userId,
            categoryId: row.categoryId,
            receiptPath: row.receiptPath,
          },
        });
        summary.transactions[0]++;
      } catch (err) {
        if (err.code === "P2002") summary.transactions[1]++;
        else throw err;
      }
    }
  } finally {
    sqlite.close();
    await prisma.$disconnect();
  }

  console.log("\nDone. Migrated / already-present (skipped):");
  for (const [table, [migrated, skipped]] of Object.entries(summary)) {
    console.log(`  ${table}: ${migrated} migrated, ${skipped} skipped`);
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
