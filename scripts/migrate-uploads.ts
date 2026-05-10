/**
 * migrate-uploads.ts — one-time migration after the upload-storage refactor.
 *
 * Before:  files in public/images/uploads/, image_urls = "/images/uploads/<f>"
 * After:   files in data/uploads/,           image_urls = "/api/uploads/<f>"
 *
 * Idempotent: safe to re-run. Skips files already moved and rows already
 * pointing at /api/uploads/.
 *
 * Run with:  npx ts-node --project tsconfig.scripts.json scripts/migrate-uploads.ts
 */

import * as fs from "fs";
import * as path from "path";
import Database from "better-sqlite3";

const DB_PATH =
  process.env.DB_PATH || path.join(__dirname, "../data/jersey-archive.db");
const OLD_DIR = path.join(__dirname, "../public/images/uploads");
const NEW_DIR =
  process.env.UPLOAD_DIR || path.join(__dirname, "../data/uploads");

fs.mkdirSync(NEW_DIR, { recursive: true });

// 1) Move files
let moved = 0;
let skipped = 0;
if (fs.existsSync(OLD_DIR)) {
  for (const file of fs.readdirSync(OLD_DIR)) {
    const oldPath = path.join(OLD_DIR, file);
    const newPath = path.join(NEW_DIR, file);
    if (!fs.statSync(oldPath).isFile()) continue;
    if (fs.existsSync(newPath)) {
      skipped++;
      continue;
    }
    fs.renameSync(oldPath, newPath);
    moved++;
  }
  // Remove the now-empty old directory if it has no files left
  try {
    if (fs.readdirSync(OLD_DIR).length === 0) {
      fs.rmdirSync(OLD_DIR);
    }
  } catch {
    // ignore
  }
}
console.log(`Files: ${moved} moved, ${skipped} already existed.`);

// 2) Rewrite DB rows
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

const rows = db
  .prepare<[], { id: string; image_urls: string }>(
    `SELECT id, image_urls FROM jerseys WHERE image_urls LIKE '%/images/uploads/%'`
  )
  .all();

const upd = db.prepare(`UPDATE jerseys SET image_urls = ? WHERE id = ?`);

let updated = 0;
const txn = db.transaction(() => {
  for (const row of rows) {
    let arr: string[];
    try {
      arr = JSON.parse(row.image_urls || "[]");
    } catch {
      continue;
    }
    const next = arr.map((u) =>
      typeof u === "string" ? u.replace("/images/uploads/", "/api/uploads/") : u
    );
    if (JSON.stringify(next) !== JSON.stringify(arr)) {
      upd.run(JSON.stringify(next), row.id);
      updated++;
    }
  }
});
txn();

console.log(`DB: ${updated} jersey rows updated.`);

db.close();
