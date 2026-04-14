/**
 * Match local IPL jersey images to Elasticsearch records and update image_urls.
 *
 * Images are served from /public/images/ipl/* → URL /images/ipl/*
 * Matching logic: team name → folder, season → filename pattern.
 */

import * as fs from "fs";
import * as path from "path";
import { Client } from "@elastic/elasticsearch";

const ES_URL = process.env.ELASTICSEARCH_URL || "http://localhost:9200";
const INDEX = "jerseys";
const PUBLIC_DIR = path.join(__dirname, "../public/images/ipl");
const URL_BASE = "/images/ipl";

const client = new Client({ node: ES_URL });

// Map ES team name → subfolder under public/images/ipl/
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

// For "Extras" folder, map team+season → specific filename prefix
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

/** Read all files in a directory, return map of lowercase-name → full URL path */
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

// Two-digit season abbreviations used in some filenames (e.g. "punjab22" = 2022)
function seasonAbbrev(season: string): string {
  return season.slice(-2); // "2022" → "22"
}

/** Find best matching image URL for a team + season */
function findImageUrl(team: string, season: string, jerseyType?: string): string | null {
  const folder = TEAM_FOLDER[team];
  if (!folder) return null;

  const folderPath = path.join(PUBLIC_DIR, folder);
  const files = readFolder(folderPath, folder);

  const isSpecial = jerseyType && /special|alternate|away/i.test(jerseyType);

  if (isSpecial && folder === "RCB") {
    // Try RCB/Special subfolder
    const specialFolder = path.join(PUBLIC_DIR, "RCB", "Special");
    const specialFiles = readFolder(specialFolder, "RCB/Special");
    const match = findSeasonMatch(season, specialFiles);
    if (match) return match;
  }

  // For "Extras" teams, match by prefix + season
  if (folder === "Extras") {
    const prefix = EXTRAS_TEAM_PREFIX[team]?.toLowerCase() ?? "";
    for (const [name, url] of files) {
      if (prefix && name.includes(prefix) && name.includes(season)) return url;
    }
    // Looser: just prefix
    for (const [name, url] of files) {
      if (prefix && name.includes(prefix)) return url;
    }
    return null;
  }

  const match = findSeasonMatch(season, files);
  if (match) return match;

  // Try two-digit year abbreviation (e.g. "punjab22" for 2022)
  const abbrev = seasonAbbrev(season);
  const abbrevMatch = findSeasonMatch(abbrev, files);
  if (abbrevMatch) return abbrevMatch;

  // Fallback: search Trials folder using team abbreviation + season
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

/** Given a season string and a file map, find the best match */
function findSeasonMatch(season: string, files: Map<string, string>): string | null {
  // 1. Exact: filename starts with season or equals season
  for (const [name, url] of files) {
    const base = name.replace(/\.[^.]+$/, ""); // strip extension
    if (base === season) return url;
  }

  // 2. Filename starts with season (handles "2008-2009-2010.png" etc)
  for (const [name, url] of files) {
    if (name.startsWith(season)) return url;
  }

  // 3. Filename contains season as a standalone number
  for (const [name, url] of files) {
    const base = name.replace(/\.[^.]+$/, "");
    // Split by common delimiters and check if season is one of the parts
    const parts = base.split(/[-_\s()]/);
    if (parts.includes(season)) return url;
  }

  // 4. Filename contains season anywhere
  for (const [name, url] of files) {
    if (name.includes(season)) return url;
  }

  return null;
}

interface JerseyHit {
  _id: string;
  _source: {
    id: string;
    team: string;
    season: string;
    format: string;
    jersey_type?: string;
    image_urls?: string[];
  };
}

async function main() {
  console.log("Fetching IPL jerseys from Elasticsearch...");

  // Fetch all IPL jerseys
  const res = await client.search<JerseyHit["_source"]>({
    index: INDEX,
    size: 500,
    query: { term: { format: "IPL" } },
  });

  const hits = res.hits.hits;
  console.log(`Found ${hits.length} IPL jerseys\n`);

  let matched = 0;
  let skipped = 0;
  let unmatched = 0;

  for (const hit of hits) {
    const src = hit._source!;
    const { team, season, jersey_type } = src;

    const imageUrl = findImageUrl(team, season, jersey_type);

    if (!imageUrl) {
      console.log(`  UNMATCHED: ${team} ${season}`);
      unmatched++;
      continue;
    }

    // Skip if already set to a non-gdrive URL
    const existing = src.image_urls?.[0] ?? "";
    if (existing && !existing.includes("drive.google.com") && !existing.startsWith("http")) {
      skipped++;
      continue;
    }

    // Update the document
    await client.update({
      index: INDEX,
      id: hit._id!,
      doc: {
        image_urls: [imageUrl],
        updated_at: new Date().toISOString(),
      },
    });

    console.log(`  ✓ ${team} ${season} → ${imageUrl}`);
    matched++;
  }

  console.log(`\nDone: ${matched} updated, ${skipped} skipped (already set), ${unmatched} unmatched`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
