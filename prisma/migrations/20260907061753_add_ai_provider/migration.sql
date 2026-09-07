-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "scanCount" INTEGER NOT NULL DEFAULT 0,
    "scanPeriodStart" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aiProvider" TEXT NOT NULL DEFAULT 'CLAUDE'
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "passwordHash", "plan", "scanCount", "scanPeriodStart") SELECT "createdAt", "email", "id", "name", "passwordHash", "plan", "scanCount", "scanPeriodStart" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
