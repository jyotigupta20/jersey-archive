/**
 * Match local IPL jersey images to SQLite records and update image_urls.
 *
 * Images are served from /public/images/ipl/* -> URL /images/ipl/*
 * Matching logic: team name -> folder, season -> filename pattern.
 */

import * as fs from "fs";
import * as path from "path";
import Database from "better-sqlite3";

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "../data/jersey-archive.db");
const PUBLIC_DIR = path.join(__dirname, "../public/images/ipl");
const URL_BASE = "/images/ipl";

const db = new Database(DB_PATH);

// Map team name -> subfolder under public/images/ipl/
const TEAM_FOLDER: Record<string, string> = {
  "Chennai Super Kings": "CSK",
  "Kolkata Knight Riders": "KKR",
  "Mumbai Indians": "MI",
  "Kings XI Punjab": "PBKS",
  "Punjab Kings": "PBKS",
  "Royal Challengers Banglore": "RCB",
  "Royal Challengers Bengaluru": "RCB",
  "Rajasthan Royals": "RR",
  "Sunrisers Hyderabad": "SRH",
  "Delhi Daredevils": "Delhi",
  "Delhi Capitals": "Delhi",
  "DeccanCharges": "Extras",
  "Deccan Chargers": "Extras",
  "Gujarat Titans": "Extras",
  "Gujarat Lions": "Extras",
  "Lucknow Super Giants": "Extras",
  "Rising Pune Super Giants": "Extras",
  "Rising Pune Supergiant": "Extras",
  "Kochi Tuskers Kerala": "Extras",
  "Pune Warriors India": "Extras",
  "Pune Warriors": "Extras",
};

const EXTRAS_TEAM_PREFIX: Record<string, string> = {
  "DeccanCharges": "deccan",
  "Deccan Chargers": "deccan",
  "Gujarat Titans": "GT",
  "Gujarat Lions": "lions",
  "Lucknow Super Giants": "LSG",
  "Rising Pune Super Giants": "RPS",
  "Rising Pune Supergiant": "RPS",
  "Kochi Tuskers Kerala": "KTK",
  "Pune Warriors India": "pw",
  "Pune Warriors": "pw",
};

function readFolder(folderPath: string, urlFolder: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!fs.existsSync(folderPath)) return map;
  for (const f of fs.readdirSync(folderPath)) {
    const stat = fs.statSync(path.join(folderPath, f));
    if (stat.isFile()) {
      map.set(f.toLowerCase(), `${URL_BASE}/${urlFolder}/${f}`);
    }
  }
  return map;
}

function seasonAbbrev(season: string): string {
  return season.slice(-2);
}

function findSeasonMatch(season: string, files: Map<string, string>): string | null {
  for (const [name, url] of files) {
    const base = name.replace(/\.[^.]+$/, "");
    if (base === season) return url;
  }
  for (const [name, url] of files) {
    if (name.startsWith(season)) return url;
  }
  for (const [name, url] of files) {
    const base = name.replace(/\.[^.]+$/, "");
    const parts = base.split(/[-_\s()]/);
    if (parts.includes(season)) return url;
  }
  for (const [name, url] of files) {
    if (name.includes(season)) return url;
  }
  return null;
}

function findImageUrl(team: string, season: string, jerseyType?: string): string | null {
  const folder = TEAM_FOLDER[team];
  if (!folder) return null;

  const folderPath = path.join(PUBLIC_DIR, folder);
  const files = readFolder(folderPath, folder);

  const isSpecial = jerseyType && /special|alternate|away/i.test(jerseyType);

  if (isSpecial && folder === "RCB") {
    const specialFolder = path.join(PUBLIC_DIR, "RCB", "Special");
    const specialFiles = readFolder(specialFolder, "RCB/Special");
    const match = findSeasonMatch(season, specialFiles);
    if (match) return match;
  }

  if (folder === "Extras") {
    const prefix = EXTRAS_TEAM_PREFIX[team]?.toLowerCase() ?? "";
    for (const [name, url] of files) {
      if (prefix && name.includes(prefix) && name.includes(season)) return url;
    }
    for (const [name, url] of files) {
      if (prefix && name.includes(prefix)) return url;
    }
    return null;
  }

  const match = findSeasonMatch(season, files);
  if (match) return match;

  const abbrev = seasonAbbrev(season);
  const abbrevMatch = findSeasonMatch(abbrev, files);
  if (abbrevMatch) return abbrevMatch;

  const trialsFolder = path.join(PUBLIC_DIR, "Trials");
  const trialsFiles = readFolder(trialsFolder, "Trials");
  const teamAbbrevMap: Record<string, string> = {
    "Mumbai Indians": "mi",
    "Kolkata Knight Riders": "kkr",
    "Delhi Daredevils": "dd",
    "Delhi Capitals": "dc",
    "Sunrisers Hyderabad": "srh",
    "Rajasthan Royals": "rr",
    "Pune Warriors India": "pwi",
    "Rising Pune Super Giants": "rps",
    "Kings XI Punjab": "punjab",
    "Punjab Kings": "punjab",
  };
  const abbr = teamAbbrevMap[team]?.toLowerCase();
  if (abbr) {
    for (const [name, url] of trialsFiles) {
      if (name.includes(abbr) && name.includes(season)) return url;
    }
    if (abbrev) {
      for (const [name, url] of trialsFiles) {
        if (name.includes(abbr) && name.includes(abbrev)) return url;
      }
    }
  }

  return null;
}

interface JerseyRow {
  id: string;
  team: string;
  season: string;
  jersey_type: string;
  image_urls: string;
}

function main() {
  console.log("Fetching IPL jerseys from SQLite...");

  const rows = db.prepare(
    "SELECT id, team, season, jersey_type, image_urls FROM jerseys WHERE format = 'IPL'"
  ).all() as JerseyRow[];

  console.log(`Found ${rows.length} IPL jerseys\n`);

  let matched = 0;
  let skipped = 0;
  let unmatched = 0;

  const updateStmt = db.prepare(
    "UPDATE jerseys SET image_urls = ?, updated_at = ? WHERE id = ?"
  );

  const updateMany = db.transaction(() => {
    for (const row of rows) {
      const { team, season, jersey_type } = row;
      const imageUrl = findImageUrl(team, season, jersey_type);

      if (!imageUrl) {
        console.log(`  UNMATCHED: ${team} ${season}`);
        unmatched++;
        continue;
      }

      const existing = JSON.parse(row.image_urls || "[]")[0] ?? "";
      if (existing && !existing.includes("drive.google.com") && !existing.startsWith("http")) {
        skipped++;
        continue;
      }

      updateStmt.run(JSON.stringify([imageUrl]), new Date().toISOString(), row.id);
      console.log(`  ✓ ${team} ${season} → ${imageUrl}`);
      matched++;
    }
  });

  updateMany();
  console.log(`\nDone: ${matched} updated, ${skipped} skipped (already set), ${unmatched} unmatched`);
  db.close();
}

main();
