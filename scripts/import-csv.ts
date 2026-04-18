import { parse } from "csv-parse/sync";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";
import Database from "better-sqlite3";
import {
  parseRating,
  parseWornBy,
  parseGDriveUrl,
  parseTournamentWon,
  parseStanding,
} from "../lib/utils";

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "../data/jersey-archive.db");
const DATA_DIR = path.join(__dirname, "../data");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

function ensureTables() {
  db.exec(`
    DROP TABLE IF EXISTS jerseys_fts;
    DROP TABLE IF EXISTS jerseys;
    DROP TABLE IF EXISTS tournaments;

    CREATE TABLE jerseys (
      id TEXT PRIMARY KEY,
      sport TEXT,
      format TEXT,
      league TEXT,
      team TEXT,
      team_logo_url TEXT,
      season TEXT,
      jersey_type TEXT,
      design_description TEXT,
      primary_color TEXT,
      brand TEXT,
      sponsor TEXT,
      nation TEXT,
      rating REAL,
      worn_by TEXT,
      captain TEXT,
      image_urls TEXT,
      tournament_won INTEGER,
      standing INTEGER,
      significance TEXT,
      design_story TEXT,
      notable_matches TEXT,
      tags TEXT,
      image_source TEXT,
      cricket_board TEXT,
      host_nation TEXT,
      major_tournament TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE tournaments (
      id TEXT PRIMARY KEY,
      name TEXT,
      season TEXT,
      winner_club TEXT,
      winner_country TEXT,
      runner_up_club TEXT,
      runner_up_country TEXT,
      score TEXT,
      venue TEXT,
      team_logo_url TEXT
    );

    CREATE VIRTUAL TABLE jerseys_fts USING fts5(
      id UNINDEXED,
      team,
      worn_by,
      captain,
      design_description,
      sponsor,
      brand,
      league,
      nation,
      season,
      content='jerseys',
      content_rowid='rowid'
    );

    CREATE TRIGGER jerseys_ai AFTER INSERT ON jerseys BEGIN
      INSERT INTO jerseys_fts(rowid, id, team, worn_by, captain, design_description, sponsor, brand, league, nation, season)
      VALUES (new.rowid, new.id, new.team, new.worn_by, new.captain, new.design_description, new.sponsor, new.brand, new.league, new.nation, new.season);
    END;

    CREATE TRIGGER jerseys_ad AFTER DELETE ON jerseys BEGIN
      INSERT INTO jerseys_fts(jerseys_fts, rowid, id, team, worn_by, captain, design_description, sponsor, brand, league, nation, season)
      VALUES ('delete', old.rowid, old.id, old.team, old.worn_by, old.captain, old.design_description, old.sponsor, old.brand, old.league, old.nation, old.season);
    END;

    CREATE TRIGGER jerseys_au AFTER UPDATE ON jerseys BEGIN
      INSERT INTO jerseys_fts(jerseys_fts, rowid, id, team, worn_by, captain, design_description, sponsor, brand, league, nation, season)
      VALUES ('delete', old.rowid, old.id, old.team, old.worn_by, old.captain, old.design_description, old.sponsor, old.brand, old.league, old.nation, old.season);
      INSERT INTO jerseys_fts(rowid, id, team, worn_by, captain, design_description, sponsor, brand, league, nation, season)
      VALUES (new.rowid, new.id, new.team, new.worn_by, new.captain, new.design_description, new.sponsor, new.brand, new.league, new.nation, new.season);
    END;
  `);
  console.log("Tables created.");
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

let insertJersey: ReturnType<typeof db.prepare>;
let insertTournament: ReturnType<typeof db.prepare>;

function prepareStatements() {
  insertJersey = db.prepare(`
    INSERT INTO jerseys (id, sport, format, league, team, team_logo_url, season, jersey_type,
      design_description, primary_color, brand, sponsor, nation, rating, worn_by, captain,
      image_urls, tournament_won, standing, significance, design_story, notable_matches,
      tags, image_source, cricket_board, host_nation, major_tournament, created_at, updated_at)
    VALUES (@id, @sport, @format, @league, @team, @team_logo_url, @season, @jersey_type,
      @design_description, @primary_color, @brand, @sponsor, @nation, @rating, @worn_by, @captain,
      @image_urls, @tournament_won, @standing, @significance, @design_story, @notable_matches,
      @tags, @image_source, @cricket_board, @host_nation, @major_tournament, @created_at, @updated_at)
  `);

  insertTournament = db.prepare(`
    INSERT INTO tournaments (id, name, season, winner_club, winner_country, runner_up_club,
      runner_up_country, score, venue, team_logo_url)
    VALUES (@id, @name, @season, @winner_club, @winner_country, @runner_up_club,
      @runner_up_country, @score, @venue, @team_logo_url)
  `);
}

function importIPL() {
  const rows = parseCSV("Jerseys Archive - IPL Data.csv");
  let count = 0;
  const insertMany = db.transaction(() => {
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
        worn_by: JSON.stringify(parseWornBy(row["Worn By Player"])), captain: "",
        image_urls: JSON.stringify(urls), tournament_won: parseTournamentWon(row["Tournament won"]) ? 1 : 0,
        standing: parseStanding(row["Standing"]), significance: "", design_story: "",
        notable_matches: JSON.stringify([]), tags: JSON.stringify([]), image_source: source,
        cricket_board: null, host_nation: null, major_tournament: null,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };
      jersey.tags = JSON.stringify(autoTags({ ...jersey, tournament_won: Boolean(jersey.tournament_won) }));
      insertJersey.run(jersey);
      count++;
    }
  });
  insertMany();
  console.log(`IPL: inserted ${count} jerseys`);
}

function importODI() {
  const rows = parseCSV("Jerseys Archive - ODI.csv");
  let count = 0;
  const insertMany = db.transaction(() => {
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
        worn_by: JSON.stringify(parseWornBy(row["Worn By Player"])), captain: "",
        image_urls: JSON.stringify(urls), tournament_won: parseTournamentWon(row["Tournament won"]) ? 1 : 0,
        standing: null, significance: "", design_story: "",
        notable_matches: JSON.stringify([]), tags: JSON.stringify([]), image_source: source,
        cricket_board: null, host_nation: null,
        major_tournament: row["Major Tournament Played"]?.trim() || "",
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };
      jersey.tags = JSON.stringify(autoTags({ ...jersey, tournament_won: Boolean(jersey.tournament_won) }));
      insertJersey.run(jersey);
      count++;
    }
  });
  insertMany();
  console.log(`ODI: inserted ${count} jerseys`);
}

function importT20() {
  const rows = parseCSV("Jerseys Archive - T 20.csv");
  let count = 0;
  const insertMany = db.transaction(() => {
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
        worn_by: JSON.stringify(parseWornBy(row["Worn By Player"])),
        captain: (row["Captain name"] || "").trim(),
        image_urls: JSON.stringify(urls), tournament_won: parseTournamentWon(row["Tournament won"]) ? 1 : 0,
        standing: parseStanding(row[" Standings"] || row["Standings"]),
        significance: "", design_story: "",
        notable_matches: JSON.stringify([]), tags: JSON.stringify([]), image_source: source,
        cricket_board: row["Cricket Board"]?.trim() || "",
        host_nation: row["Host Nation"]?.trim() || "",
        major_tournament: null,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };
      jersey.tags = JSON.stringify(autoTags({ ...jersey, tournament_won: Boolean(jersey.tournament_won) }));
      insertJersey.run(jersey);
      count++;
    }
  });
  insertMany();
  console.log(`T20: inserted ${count} jerseys`);
}

function importUCL() {
  const rows = parseCSV("Jerseys Archive - UCL Updated.csv");
  let count = 0;
  const insertMany = db.transaction(() => {
    for (const row of rows) {
      if (!row["Season"]?.trim()) continue;
      if (!row["Winner Club"] && !row["Winner Country"]) continue;
      insertTournament.run({
        id: uuidv4(), name: "UEFA Champions League",
        season: row["Season"].trim(), winner_club: row["Winner Club"]?.trim() || "",
        winner_country: row["Winner Country"]?.trim() || "",
        runner_up_club: row["Runner-up Club"]?.trim() || "",
        runner_up_country: row["Runner-up Country"]?.trim() || "",
        score: row["Score"]?.trim() || "",
        venue: row["Venue"]?.trim() || "",
        team_logo_url: parseGDriveUrl(row["Team Logo"]),
      });
      count++;
    }
  });
  insertMany();
  console.log(`UCL: inserted ${count} tournament results`);
}

function main() {
  console.log("Using SQLite database at", DB_PATH);
  ensureTables();
  prepareStatements();
  importIPL();
  importODI();
  importT20();
  importUCL();

  const jerseyCount = (db.prepare("SELECT COUNT(*) as c FROM jerseys").get() as { c: number }).c;
  const tournamentCount = (db.prepare("SELECT COUNT(*) as c FROM tournaments").get() as { c: number }).c;
  console.log(`\nDone! Total jerseys: ${jerseyCount}, tournaments: ${tournamentCount}`);
  db.close();
}

main();
