/**
 * Match local T20 World Cup jersey images to SQLite records and update image_urls.
 * Images are served from /public/images/t20wc/<COUNTRY_CODE>/ → URL /images/t20wc/<CODE>/
 */

import * as fs from "fs";
import * as path from "path";
import Database from "better-sqlite3";

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "../data/jersey-archive.db");
const PUBLIC_DIR = path.join(__dirname, "../public/images/t20wc");
const URL_BASE = "/images/t20wc";

const db = new Database(DB_PATH);

// Map DB team name → folder code under public/images/t20wc/
const TEAM_FOLDER: Record<string, string> = {
  "India": "IND",
  "Australia": "AUS",
  "England": "ENG",
  "Pakistan": "PAK",
  "South Africa": "SA",
  "New Zealand": "NZ",
  "West Indies": "WI",
  "Sri Lanka": "SL",
  "Bangladesh": "BAN",
  "Afghanistan": "AFG",
  "Ireland": "IRE",
  "Scotland": "SCO",
  "Zimbabwe": "ZIM",
  "Nepal": "NEP",
  "Oman": "OMA",
  "Nambia": "NAM",
  "Namibia": "NAM",
  "USA": "USA",
  "Uganda": "UGA",
  "Canada": "CAN",
  "Netherlands": "NED",
};

// Keywords to match team names in filenames (case-insensitive)
const TEAM_KEYWORDS: Record<string, string[]> = {
  "India": ["india", "ind"],
  "Australia": ["australia", "aus"],
  "England": ["england", "eng"],
  "Pakistan": ["pakistan", "pak"],
  "South Africa": ["south africa", "sa "],
  "New Zealand": ["new zealand", "nz"],
  "West Indies": ["west", "westendies", "wi"],
  "Sri Lanka": ["sri lanka", "sl"],
  "Bangladesh": ["bangladesh", "bangalesh", "ban"],
  "Afghanistan": ["afg", "afghanistan"],
  "Ireland": ["ireland", "ire"],
  "Scotland": ["scotland", "sco"],
  "Zimbabwe": ["zimbabwe", "zimbave", "zim"],
  "Nepal": ["nepal"],
  "Oman": ["oman"],
  "Nambia": ["nambia", "namibia", "nam"],
  "USA": ["usa"],
  "Uganda": ["uganda", "uga"],
  "Canada": ["canada", "can"],
  "Netherlands": ["neth", "ned", "netherlands"],
};

function readFolder(folderPath: string): { name: string; url: string }[] {
  if (!fs.existsSync(folderPath)) return [];
  return fs.readdirSync(folderPath)
    .filter((f) => {
      const ext = path.extname(f).toLowerCase();
      return [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext);
    })
    .filter((f) => {
      // Skip logo files
      const lower = f.toLowerCase();
      return !lower.includes("logo");
    })
    .map((f) => ({
      name: f.toLowerCase(),
      url: `${URL_BASE}/${path.basename(folderPath)}/${f}`,
    }));
}

function findImage(team: string, season: string, files: { name: string; url: string }[]): string | null {
  if (files.length === 0) return null;

  const keywords = TEAM_KEYWORDS[team] || [team.toLowerCase()];
  const year = season.trim();

  // 1. Best match: filename contains year AND team keyword
  for (const file of files) {
    if (file.name.includes(year)) {
      for (const kw of keywords) {
        if (file.name.includes(kw)) return file.url;
      }
    }
  }

  // 2. Filename contains year (in the team's folder, so team is implicit)
  for (const file of files) {
    if (file.name.includes(year)) {
      // Skip "away" variants unless nothing else matches
      if (!file.name.includes("away")) return file.url;
    }
  }

  // 3. Away variant with year
  for (const file of files) {
    if (file.name.includes(year)) return file.url;
  }

  return null;
}

interface JerseyRow {
  id: string;
  team: string;
  season: string;
  image_urls: string;
}

function main() {
  console.log("Fetching T20 World Cup jerseys from SQLite...");

  const rows = db.prepare(
    "SELECT id, team, season, image_urls FROM jerseys WHERE format = 'T20'"
  ).all() as JerseyRow[];

  console.log(`Found ${rows.length} T20 jerseys\n`);

  let matched = 0;
  let skipped = 0;
  let unmatched = 0;

  const updateStmt = db.prepare(
    "UPDATE jerseys SET image_urls = ?, image_source = 'local', updated_at = ? WHERE id = ?"
  );

  const updateMany = db.transaction(() => {
    for (const row of rows) {
      const { team, season } = row;
      const folder = TEAM_FOLDER[team];

      if (!folder) {
        console.log(`  NO FOLDER MAPPING: ${team} ${season}`);
        unmatched++;
        continue;
      }

      const folderPath = path.join(PUBLIC_DIR, folder);
      const files = readFolder(folderPath);
      const imageUrl = findImage(team, season, files);

      if (!imageUrl) {
        console.log(`  UNMATCHED: ${team} ${season}`);
        unmatched++;
        continue;
      }

      // Skip if already has a local image
      const existing = JSON.parse(row.image_urls || "[]");
      if (existing.length > 0 && existing[0].startsWith("/images/")) {
        skipped++;
        continue;
      }

      updateStmt.run(JSON.stringify([imageUrl]), new Date().toISOString(), row.id);
      console.log(`  ✓ ${team} ${season} → ${imageUrl}`);
      matched++;
    }
  });

  updateMany();
  console.log(`\nDone: ${matched} updated, ${skipped} skipped, ${unmatched} unmatched`);
  db.close();
}

main();
