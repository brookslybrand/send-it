-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "grade" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "sessionId" INTEGER,
    CONSTRAINT "Project_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("attempts", "grade", "id", "sessionId") SELECT "attempts", "grade", "id", "sessionId" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
