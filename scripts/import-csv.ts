import { parse } from "csv-parse/sync";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";
import { Client } from "@elastic/elasticsearch";
import {
  parseRating,
  parseWornBy,
  parseGDriveUrl,
  parseTournamentWon,
  parseStanding,
} from "../lib/utils";

const ES_URL = process.env.ELASTICSEARCH_URL || "http://localhost:9200";
const DATA_DIR = path.join(__dirname, "../data");
const JERSEYS_INDEX = "jerseys";
const TOURNAMENTS_INDEX = "tournaments";

const client = new Client({ node: ES_URL });

async function ensureIndexes() {
  for (const index of [JERSEYS_INDEX, TOURNAMENTS_INDEX]) {
    const exists = await client.indices.exists({ index });
    if (exists) {
      await client.indices.delete({ index });
      console.log(`Deleted existing index: ${index}`);
    }
  }

  await client.indices.create({
    index: JERSEYS_INDEX,
    mappings: {
      properties: {
        id: { type: "keyword" },
        sport: { type: "keyword" },
        format: { type: "keyword" },
        league: { type: "keyword" },
        team: { type: "text", fields: { keyword: { type: "keyword" } } },
        team_logo_url: { type: "keyword", index: false },
        season: { type: "keyword" },
        jersey_type: { type: "keyword" },
        design_description: { type: "text" },
        primary_color: { type: "keyword" },
        brand: { type: "keyword" },
        sponsor: { type: "keyword" },
        nation: { type: "keyword" },
        rating: { type: "float" },
        worn_by: { type: "text", fields: { keyword: { type: "keyword" } } },
        captain: { type: "text", fields: { keyword: { type: "keyword" } } },
        image_urls: { type: "keyword", index: false },
        tournament_won: { type: "boolean" },
        standing: { type: "integer" },
        significance: { type: "text" },
        design_story: { type: "text" },
        notable_matches: { type: "text" },
        tags: { type: "keyword" },
        image_source: { type: "keyword" },
        cricket_board: { type: "keyword" },
        host_nation: { type: "keyword" },
        major_tournament: { type: "text" },
        created_at: { type: "date" },
        updated_at: { type: "date" },
      },
    },
  });

  await client.indices.create({
    index: TOURNAMENTS_INDEX,
    mappings: {
      properties: {
        id: { type: "keyword" },
        name: { type: "keyword" },
        season: { type: "keyword" },
        winner_club: { type: "text", fields: { keyword: { type: "keyword" } } },
        winner_country: { type: "keyword" },
        runner_up_club: { type: "text", fields: { keyword: { type: "keyword" } } },
        runner_up_country: { type: "keyword" },
        score: { type: "keyword" },
        venue: { type: "text" },
        team_logo_url: { type: "keyword", index: false },
      },
    },
  });

  console.log("Indexes created.");
}

type BulkDoc = Record<string, unknown>;

async function bulkIndex(docs: BulkDoc[], index: string): Promise<void> {
  if (docs.length === 0) return;
  const operations = docs.flatMap((doc) => [
    { index: { _index: index, _id: doc.id as string } },
    doc,
  ]);
  const res = await client.bulk({ operations });
  if (res.errors) {
    const errors = res.items.filter((i) => i.index?.error).map((i) => i.index?.error);
    console.error("Bulk errors:", errors.slice(0, 3));
  }
}

function parseCSV(filename: string): Record<string, string>[] {
  const filepath = path.join(DATA_DIR, filename);
  const content = fs.readFileSync(filepath, "utf-8");
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });
}

function buildImageUrls(...urls: (string | undefined)[]): { urls: string[]; source: string } {
  const filtered = urls.map((u) => parseGDriveUrl(u)).filter((u) => u && u.includes("drive.google.com"));
  return { urls: filtered.length ? filtered : [], source: filtered.length ? "gdrive_pending" : "none" };
}

function autoTags(jersey: { tournament_won?: boolean; standing?: number | null; rating?: number; season?: string }): string[] {
  const tags: string[] = [];
  if (jersey.tournament_won) tags.push("championship", "winner");
  if (jersey.standing === 1) tags.push("champions");
  if ((jersey.rating ?? 0) >= 4.5) tags.push("iconic");
  if ((jersey.rating ?? 0) >= 4.0) tags.push("fan-favorite");
  if (jersey.season && parseInt(jersey.season) < 2000) tags.push("classic");
  if (jersey.season && parseInt(jersey.season) < 2010) tags.push("retro");
  return [...new Set(tags)];
}

async function importIPL() {
  const rows = parseCSV("Jerseys Archive - IPL Data.csv");
  const jerseys: BulkDoc[] = [];
  for (const row of rows) {
    if (!row["Team"]?.trim()) continue;
    const { urls, source } = buildImageUrls(row["Image 1"], row["Image 2"]);
    const jersey = {
      id: uuidv4(), sport: "cricket", format: "IPL", league: row["League"] || "IPL",
      team: row["Team"].trim(), team_logo_url: parseGDriveUrl(row["Team Logo"]),
      season: row["Season"]?.trim() || "", jersey_type: row["Jersey Type"]?.trim() || "Home",
      design_description: row["Design"]?.trim() || "", primary_color: row["Color"]?.trim() || "",
      brand: row["Brand"]?.trim() || "", sponsor: row["Sponsor"]?.trim() || "",
      nation: row["Nation"]?.trim() || "India", rating: parseRating(row["Rating"]),
      worn_by: parseWornBy(row["Worn By Player"]), captain: "",
      image_urls: urls, tournament_won: parseTournamentWon(row["Tournament won"]),
      standing: parseStanding(row["Standing"]), significance: "", design_story: "",
      notable_matches: [], tags: [], image_source: source,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    jersey.tags = autoTags(jersey) as never[];
    jerseys.push(jersey);
  }
  await bulkIndex(jerseys, JERSEYS_INDEX);
  console.log(`IPL: indexed ${jerseys.length} jerseys`);
}

async function importODI() {
  const rows = parseCSV("Jerseys Archive - ODI.csv");
  const jerseys: BulkDoc[] = [];
  for (const row of rows) {
    if (!row["Team"]?.trim()) continue;
    const imageField = row["Herysey Image"] || row["Jersey Image"] || "";
    const { urls, source } = buildImageUrls(imageField);
    const jersey = {
      id: uuidv4(), sport: "cricket", format: "ODI", league: row["League"] || "ODI 50-50",
      team: row["Team"].trim(), team_logo_url: parseGDriveUrl(row["logo without BG"]),
      season: row["Season"]?.trim() || "", jersey_type: row["Jersey Type"]?.trim() || "Home",
      design_description: row["Design"]?.trim() || "", primary_color: row["Color"]?.trim() || "",
      brand: row["Brand"]?.trim() || "", sponsor: row["Sponsor"]?.trim() || "",
      nation: row["Nation"]?.trim() || "", rating: parseRating(row["Rating"]),
      worn_by: parseWornBy(row["Worn By Player"]), captain: "", image_urls: urls,
      tournament_won: parseTournamentWon(row["Tournament won"]), standing: null,
      significance: "", design_story: "", notable_matches: [], tags: [], image_source: source,
      major_tournament: row["Major Tournament Played"]?.trim() || "",
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    jersey.tags = autoTags(jersey) as never[];
    jerseys.push(jersey);
  }
  await bulkIndex(jerseys, JERSEYS_INDEX);
  console.log(`ODI: indexed ${jerseys.length} jerseys`);
}

async function importT20() {
  const rows = parseCSV("Jerseys Archive - T 20.csv");
  const jerseys: BulkDoc[] = [];
  for (const row of rows) {
    if (!row["Team"]?.trim()) continue;
    const { urls, source } = buildImageUrls(row["Image 1"], row["Image 2"]);
    const jersey = {
      id: uuidv4(), sport: "cricket", format: "T20",
      league: row["Tourament"] || row["Tournament"] || "T20 World Cup",
      team: row["Team"].trim(), team_logo_url: parseGDriveUrl(row["Team Logo"]),
      season: row["Season"]?.trim() || "", jersey_type: row["Jersey Type"]?.trim() || "Home",
      design_description: row["Design"]?.trim() || "",
      primary_color: (row["Colour"] || row["Color"])?.trim() || "",
      brand: row["Brand"]?.trim() || "", sponsor: row["Sponsor"]?.trim() || "",
      nation: row["Host Nation"]?.trim() || "", rating: parseRating(row["Rating"]),
      worn_by: parseWornBy(row["Worn By Player"]), captain: (row["Captain name"] || "").trim(),
      image_urls: urls, tournament_won: parseTournamentWon(row["Tournament won"]),
      standing: parseStanding(row[" Standings"] || row["Standings"]),
      significance: "", design_story: "", notable_matches: [], tags: [], image_source: source,
      cricket_board: row["Cricket Board"]?.trim() || "", host_nation: row["Host Nation"]?.trim() || "",
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    jersey.tags = autoTags(jersey) as never[];
    jerseys.push(jersey);
  }
  await bulkIndex(jerseys, JERSEYS_INDEX);
  console.log(`T20: indexed ${jerseys.length} jerseys`);
}

async function importUCL() {
  const rows = parseCSV("Jerseys Archive - UCL Updated.csv");
  const tournaments: BulkDoc[] = [];
  for (const row of rows) {
    if (!row["Season"]?.trim()) continue;
    if (!row["Winner Club"] && !row["Winner Country"]) continue;
    tournaments.push({
      id: uuidv4(), name: "UEFA Champions League",
      season: row["Season"].trim(), winner_club: row["Winner Club"]?.trim() || "",
      winner_country: row["Winner Country"]?.trim() || "", runner_up_club: row["Runner-up Club"]?.trim() || "",
      runner_up_country: row["Runner-up Country"]?.trim() || "", score: row["Score"]?.trim() || "",
      venue: row["Venue"]?.trim() || "", team_logo_url: parseGDriveUrl(row["Team Logo"]),
    });
  }
  await bulkIndex(tournaments, TOURNAMENTS_INDEX);
  console.log(`UCL: indexed ${tournaments.length} tournament results`);
}

async function main() {
  console.log("Connecting to Elasticsearch at", ES_URL);
  try {
    await client.ping();
    console.log("Connected!");
  } catch (e) {
    console.error("Cannot connect to Elasticsearch:", e);
    process.exit(1);
  }
  await ensureIndexes();
  await importIPL();
  await importODI();
  await importT20();
  await importUCL();
  const count = await client.count({ index: JERSEYS_INDEX });
  const tCount = await client.count({ index: TOURNAMENTS_INDEX });
  console.log(`\nDone! Total jerseys: ${count.count}, tournaments: ${tCount.count}`);
}

main().catch(console.error);
