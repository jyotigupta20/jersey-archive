/**
 * link-local-images.ts
 *
 * After copying jersey images into public/images/, this script walks the
 * folder, parses team+season from each filename, finds the matching jersey
 * row in SQLite, and prepends the local /images/... path to image_urls so
 * the JerseyCard renders the actual image instead of the GDrive placeholder.
 *
 * Run with:  npx ts-node --project tsconfig.scripts.json scripts/link-local-images.ts
 */

import * as fs from "fs";
import * as path from "path";
import Database from "better-sqlite3";

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "../data/jersey-archive.db");
const PUBLIC_IMAGES_DIR = path.join(__dirname, "../public/images");

// Folder code → IPL team name (for images/ipl/<CODE>/ subfolder)
const IPL_CODE_TO_TEAM: Record<string, string> = {
  CSK: "Chennai Super Kings",
  MI: "Mumbai Indians",
  KKR: "Kolkata Knight Riders",
  RCB: "Royal Challengers Bengaluru",
  RR: "Rajasthan Royals",
  SRH: "Sunrisers Hyderabad",
  Delhi: "Delhi Capitals",
  PBKS: "Punjab Kings",
  GT: "Gujarat Titans",
  LSG: "Lucknow Super Giants",
};

// T20 World Cup folder code → CSV team name
const T20_CODE_TO_TEAM: Record<string, string> = {
  AFG: "Afghanistan", AUS: "Australia", BAN: "Bangladesh", CAN: "Canada",
  ENG: "England",     IND: "India",     IRE: "Ireland",    NAM: "Namibia",
  NED: "Netherlands", NEP: "Nepal",     NZ: "New Zealand", OMA: "Oman",
  PAK: "Pakistan",    SA: "South Africa", SCO: "Scotland", SL: "Sri Lanka",
  UGA: "Uganda",      USA: "USA",       WI: "West Indies", ZIM: "Zimbabwe",
};

const IMG_EXT = /\.(jpe?g|png|webp)$/i;

interface JerseyRow {
  id: string;
  team: string;
  season: string;
  format: string;
  image_urls: string;
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

const allJerseys = db.prepare<[], JerseyRow>(
  `SELECT id, team, season, format, image_urls FROM jerseys`
).all();

if (allJerseys.length === 0) {
  console.error("No jerseys in DB. Run `npm run import` first.");
  process.exit(1);
}

console.log(`Loaded ${allJerseys.length} jerseys from DB.`);

// Build lookup index: normalized "team|season" → jersey rows
function norm(s: string) {
  return s.trim().replace(/[_\s]+/g, " ").toLowerCase();
}
const index = new Map<string, JerseyRow[]>();
for (const j of allJerseys) {
  const key = `${norm(j.team)}|${j.season}`;
  if (!index.has(key)) index.set(key, []);
  index.get(key)!.push(j);
}

// jerseyId → array of local /images/... paths to prepend
const updates = new Map<string, string[]>();
const unmatched: string[] = [];

function addImage(jerseyId: string, webPath: string) {
  if (!updates.has(jerseyId)) updates.set(jerseyId, []);
  const list = updates.get(jerseyId)!;
  if (!list.includes(webPath)) list.push(webPath);
}

function findJerseys(team: string, season: string): JerseyRow[] {
  return index.get(`${norm(team)}|${season}`) || [];
}

// Parse "Chennai_Super_Kings_2008_1.jpg" → team="Chennai Super Kings" season="2008"
function parseGdriveFilename(name: string) {
  const stem = name.replace(IMG_EXT, "");
  const parts = stem.split("_").filter(Boolean);
  // Find the rightmost 4-digit year
  let yearIdx = -1;
  for (let i = parts.length - 1; i >= 0; i--) {
    if (/^(19|20)\d{2}$/.test(parts[i])) {
      yearIdx = i;
      break;
    }
  }
  if (yearIdx === -1) return null;
  const team = parts.slice(0, yearIdx).join(" ").replace(/\s+/g, " ").trim();
  const season = parts[yearIdx];
  return { team, season };
}

// ── 1) Walk public/images/gdrive ────────────────────────────────────────────
const gdriveDir = path.join(PUBLIC_IMAGES_DIR, "gdrive");
if (fs.existsSync(gdriveDir)) {
  const files = fs.readdirSync(gdriveDir).filter((f) => IMG_EXT.test(f));
  let matched = 0;
  for (const file of files) {
    const parsed = parseGdriveFilename(file);
    if (!parsed) {
      unmatched.push(`gdrive/${file} (no year in name)`);
      continue;
    }
    const candidates = findJerseys(parsed.team, parsed.season);
    if (candidates.length === 0) {
      unmatched.push(`gdrive/${file} (no jersey for "${parsed.team}" ${parsed.season})`);
      continue;
    }
    // Prefer Home jersey when multiple match (same team+season but different jersey_type)
    const target =
      candidates.find((j) => j.format === "IPL") || candidates[0];
    addImage(target.id, `/images/gdrive/${file}`);
    matched++;
  }
  console.log(`gdrive/  ${matched}/${files.length} files matched`);
}

// ── 2) Walk public/images/ipl/<CODE>/ ───────────────────────────────────────
const iplDir = path.join(PUBLIC_IMAGES_DIR, "ipl");
if (fs.existsSync(iplDir)) {
  for (const code of fs.readdirSync(iplDir)) {
    const teamDir = path.join(iplDir, code);
    if (!fs.statSync(teamDir).isDirectory()) continue;
    const team = IPL_CODE_TO_TEAM[code];
    if (!team) continue; // skip Extras / Trials / "Team Image (...)" folders for now
    const files = fs.readdirSync(teamDir).filter((f) => IMG_EXT.test(f));
    let matched = 0;
    for (const file of files) {
      // Pull the FIRST 4-digit year from filename (e.g. "2008-2009-2010.png" → 2008)
      const m = file.match(/(19|20)\d{2}/);
      if (!m) continue;
      const season = m[0];
      const candidates = findJerseys(team, season);
      if (candidates.length === 0) {
        unmatched.push(`ipl/${code}/${file} (no jersey for "${team}" ${season})`);
        continue;
      }
      // Same image, multiple seasons in filename like "2008-2009-2010.png" → link to all
      const allYears = file.match(/(19|20)\d{2}/g) || [season];
      for (const y of allYears) {
        for (const j of findJerseys(team, y)) {
          addImage(j.id, `/images/ipl/${code}/${file}`);
        }
      }
      matched++;
    }
    console.log(`ipl/${code}/  ${matched}/${files.length} files matched`);
  }
}

// ── 3) Walk public/images/t20wc/<CODE>/ ─────────────────────────────────────
const t20Dir = path.join(PUBLIC_IMAGES_DIR, "t20wc");
if (fs.existsSync(t20Dir)) {
  for (const code of fs.readdirSync(t20Dir)) {
    const teamDir = path.join(t20Dir, code);
    if (!fs.statSync(teamDir).isDirectory()) continue;
    const team = T20_CODE_TO_TEAM[code];
    if (!team) continue;
    const files = fs.readdirSync(teamDir).filter((f) => IMG_EXT.test(f));
    let matched = 0;
    for (const file of files) {
      const m = file.match(/(19|20)\d{2}/);
      if (!m) continue;
      const season = m[0];
      const candidates = findJerseys(team, season);
      if (candidates.length === 0) {
        unmatched.push(`t20wc/${code}/${file} (no jersey for "${team}" ${season})`);
        continue;
      }
      addImage(candidates[0].id, `/images/t20wc/${code}/${file}`);
      matched++;
    }
    console.log(`t20wc/${code}/  ${matched}/${files.length} files matched`);
  }
}

// ── 4) Apply updates: prepend local paths to existing image_urls ────────────
const upd = db.prepare(`UPDATE jerseys SET image_urls = ? WHERE id = ?`);
const txn = db.transaction(() => {
  for (const [id, localPaths] of updates) {
    const row = allJerseys.find((j) => j.id === id);
    if (!row) continue;
    let existing: string[] = [];
    try {
      existing = JSON.parse(row.image_urls || "[]");
    } catch {
      existing = [];
    }
    // Local paths first (so JerseyCard renders them), keep existing GDrive as fallback
    const merged = [...localPaths, ...existing.filter((u) => !localPaths.includes(u))];
    upd.run(JSON.stringify(merged), id);
  }
});
txn();

console.log(`\nUpdated ${updates.size} jerseys with local image paths.`);
if (unmatched.length > 0) {
  console.log(`\n${unmatched.length} files could not be matched:`);
  for (const u of unmatched.slice(0, 20)) console.log(`  - ${u}`);
  if (unmatched.length > 20) console.log(`  ...and ${unmatched.length - 20} more`);
}

db.close();
