-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "grade" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" INTEGER,
    CONSTRAINT "Project_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("attempts", "grade", "id", "sessionId") SELECT "attempts", "grade", "id", "sessionId" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE TABLE "new_Session" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startTime" DATETIME,
    "endTime" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "status" TEXT NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Session" ("endTime", "id", "startTime", "status", "userId") SELECT "endTime", "id", "startTime", "status", "userId" FROM "Session";
DROP TABLE "Session";
ALTER TABLE "new_Session" RENAME TO "Session";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
