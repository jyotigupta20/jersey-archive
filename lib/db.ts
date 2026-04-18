import Database from "better-sqlite3";
import path from "path";
import { Jersey, Tournament, SearchParams, SearchResult } from "./types";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "jersey-archive.db");

let db: Database.Database | null = null;

function getDB(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    ensureTables(db);
  }
  return db;
}

function ensureTables(d: Database.Database) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS jerseys (
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

    CREATE TABLE IF NOT EXISTS tournaments (
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

    CREATE VIRTUAL TABLE IF NOT EXISTS jerseys_fts USING fts5(
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

    CREATE TRIGGER IF NOT EXISTS jerseys_ai AFTER INSERT ON jerseys BEGIN
      INSERT INTO jerseys_fts(rowid, id, team, worn_by, captain, design_description, sponsor, brand, league, nation, season)
      VALUES (new.rowid, new.id, new.team, new.worn_by, new.captain, new.design_description, new.sponsor, new.brand, new.league, new.nation, new.season);
    END;

    CREATE TRIGGER IF NOT EXISTS jerseys_ad AFTER DELETE ON jerseys BEGIN
      INSERT INTO jerseys_fts(jerseys_fts, rowid, id, team, worn_by, captain, design_description, sponsor, brand, league, nation, season)
      VALUES ('delete', old.rowid, old.id, old.team, old.worn_by, old.captain, old.design_description, old.sponsor, old.brand, old.league, old.nation, old.season);
    END;

    CREATE TRIGGER IF NOT EXISTS jerseys_au AFTER UPDATE ON jerseys BEGIN
      INSERT INTO jerseys_fts(jerseys_fts, rowid, id, team, worn_by, captain, design_description, sponsor, brand, league, nation, season)
      VALUES ('delete', old.rowid, old.id, old.team, old.worn_by, old.captain, old.design_description, old.sponsor, old.brand, old.league, old.nation, old.season);
      INSERT INTO jerseys_fts(rowid, id, team, worn_by, captain, design_description, sponsor, brand, league, nation, season)
      VALUES (new.rowid, new.id, new.team, new.worn_by, new.captain, new.design_description, new.sponsor, new.brand, new.league, new.nation, new.season);
    END;
  `);
}

// --- Serialization helpers ---

function serializeJersey(jersey: Jersey): Record<string, unknown> {
  return {
    ...jersey,
    worn_by: JSON.stringify(jersey.worn_by || []),
    image_urls: JSON.stringify(jersey.image_urls || []),
    notable_matches: JSON.stringify(jersey.notable_matches || []),
    tags: JSON.stringify(jersey.tags || []),
    tournament_won: jersey.tournament_won ? 1 : 0,
  };
}

function deserializeJersey(row: Record<string, unknown>): Jersey {
  return {
    ...row,
    worn_by: JSON.parse((row.worn_by as string) || "[]"),
    image_urls: JSON.parse((row.image_urls as string) || "[]"),
    notable_matches: JSON.parse((row.notable_matches as string) || "[]"),
    tags: JSON.parse((row.tags as string) || "[]"),
    tournament_won: Boolean(row.tournament_won),
    standing: row.standing as number | null,
  } as Jersey;
}

// --- Public API (same signatures as elasticsearch.ts) ---

export function createIndexes() {
  // Tables are created lazily in getDB(), but call this to force creation
  getDB();
}

export function indexJersey(jersey: Jersey) {
  const d = getDB();
  const data = serializeJersey(jersey);
  const columns = Object.keys(data);
  const placeholders = columns.map(() => "?").join(", ");
  const updates = columns.filter((c) => c !== "id").map((c) => `${c} = excluded.${c}`).join(", ");

  const stmt = d.prepare(
    `INSERT INTO jerseys (${columns.join(", ")}) VALUES (${placeholders})
     ON CONFLICT(id) DO UPDATE SET ${updates}`
  );
  stmt.run(...columns.map((c) => data[c]));
}

export function indexTournament(tournament: Tournament) {
  const d = getDB();
  const columns = Object.keys(tournament);
  const placeholders = columns.map(() => "?").join(", ");
  const updates = columns.filter((c) => c !== "id").map((c) => `${c} = excluded.${c}`).join(", ");

  const stmt = d.prepare(
    `INSERT INTO tournaments (${columns.join(", ")}) VALUES (${placeholders})
     ON CONFLICT(id) DO UPDATE SET ${updates}`
  );
  stmt.run(...columns.map((c) => (tournament as unknown as Record<string, unknown>)[c]));
}

export function searchJerseys(params: SearchParams): SearchResult<Jersey> {
  const d = getDB();
  const conditions: string[] = [];
  const values: unknown[] = [];

  let matchedIds: Set<string> | null = null;

  // Full-text search
  if (params.q) {
    // Tokenize and use prefix matching for fuzzy-ish search
    const terms = params.q.trim().split(/\s+/).map((t) => `"${t}"*`).join(" ");
    const ftsRows = d.prepare(
      `SELECT id FROM jerseys_fts WHERE jerseys_fts MATCH ?`
    ).all(terms) as { id: string }[];
    matchedIds = new Set(ftsRows.map((r) => r.id));

    if (matchedIds.size === 0) {
      // Fallback: LIKE search across key fields
      const like = `%${params.q}%`;
      const fallbackRows = d.prepare(
        `SELECT id FROM jerseys WHERE team LIKE ? OR worn_by LIKE ? OR captain LIKE ? OR design_description LIKE ? OR brand LIKE ? OR sponsor LIKE ? OR nation LIKE ? OR season LIKE ?`
      ).all(like, like, like, like, like, like, like, like) as { id: string }[];
      matchedIds = new Set(fallbackRows.map((r) => r.id));
    }

    if (matchedIds.size === 0) {
      return { hits: [], total: 0, aggregations: buildAggregations(d, conditions, values) };
    }
  }

  // Filters
  if (params.sport) { conditions.push("sport = ?"); values.push(params.sport); }
  if (params.format) { conditions.push("format = ?"); values.push(params.format); }
  if (params.league) { conditions.push("league = ?"); values.push(params.league); }
  if (params.team) { conditions.push("team = ?"); values.push(params.team); }
  if (params.season) { conditions.push("season = ?"); values.push(params.season); }
  if (params.brand) { conditions.push("brand = ?"); values.push(params.brand); }
  if (params.jersey_type) { conditions.push("jersey_type = ?"); values.push(params.jersey_type); }
  if (params.nation) { conditions.push("nation = ?"); values.push(params.nation); }
  if (params.tournament_won !== undefined) { conditions.push("tournament_won = ?"); values.push(params.tournament_won ? 1 : 0); }

  let where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

  // If FTS matched, add ID filter
  if (matchedIds) {
    const idPlaceholders = [...matchedIds].map(() => "?").join(", ");
    const idCondition = `id IN (${idPlaceholders})`;
    where = where ? `${where} AND ${idCondition}` : `WHERE ${idCondition}`;
    values.push(...matchedIds);
  }

  // Count
  const countRow = d.prepare(`SELECT COUNT(*) as total FROM jerseys ${where}`).get(...values) as { total: number };
  const total = countRow.total;

  // Fetch page
  const offset = params.from || 0;
  const limit = params.size || 24;
  const orderBy = params.q ? "" : "ORDER BY rating DESC";
  const rows = d.prepare(
    `SELECT * FROM jerseys ${where} ${orderBy} LIMIT ? OFFSET ?`
  ).all(...values, limit, offset) as Record<string, unknown>[];

  const hits = rows.map(deserializeJersey);

  // Aggregations (computed on the filtered set, minus pagination)
  const aggregations = buildAggregations(d, conditions, values.slice(0, conditions.length));

  return { hits, total, aggregations };
}

function buildAggregations(
  d: Database.Database,
  conditions: string[],
  values: unknown[]
): Record<string, { key: string; doc_count: number }[]> {
  const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const aggFields = ["sport", "format", "league", "brand", "nation", "jersey_type", "season", "team"];
  const aggs: Record<string, { key: string; doc_count: number }[]> = {};

  for (const field of aggFields) {
    const orderBy = field === "season" ? "ORDER BY key DESC" : field === "team" ? "ORDER BY key ASC" : "ORDER BY doc_count DESC";
    const fieldCondition = `${field} != ''`;
    const fullWhere = where
      ? `${where} AND ${fieldCondition}`
      : `WHERE ${fieldCondition}`;
    const rows = d.prepare(
      `SELECT ${field} as key, COUNT(*) as doc_count FROM jerseys ${fullWhere} GROUP BY ${field} ${orderBy}`
    ).all(...values) as { key: string; doc_count: number }[];
    aggs[field] = rows.filter((r) => r.key);
  }

  return aggs;
}

export function getJersey(id: string): Jersey | null {
  const d = getDB();
  const row = d.prepare("SELECT * FROM jerseys WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return row ? deserializeJersey(row) : null;
}

export function deleteJersey(id: string) {
  const d = getDB();
  d.prepare("DELETE FROM jerseys WHERE id = ?").run(id);
}

export function getStats() {
  const d = getDB();
  const totalRow = d.prepare("SELECT COUNT(*) as total FROM jerseys").get() as { total: number };
  const bySport = d.prepare("SELECT sport as key, COUNT(*) as doc_count FROM jerseys WHERE sport != '' GROUP BY sport").all() as { key: string; doc_count: number }[];
  const byFormat = d.prepare("SELECT format as key, COUNT(*) as doc_count FROM jerseys WHERE format != '' GROUP BY format").all() as { key: string; doc_count: number }[];
  const byLeague = d.prepare("SELECT league as key, COUNT(*) as doc_count FROM jerseys WHERE league != '' GROUP BY league").all() as { key: string; doc_count: number }[];

  return {
    total: totalRow.total,
    by_sport: bySport,
    by_format: byFormat,
    by_league: byLeague,
  };
}

export function getFeaturedJerseys(size = 8): Jersey[] {
  const d = getDB();
  const rows = d.prepare(
    "SELECT * FROM jerseys ORDER BY rating DESC LIMIT ?"
  ).all(size) as Record<string, unknown>[];
  return rows.map(deserializeJersey);
}

export function getRelatedJerseys(jersey: Jersey, size = 4): Jersey[] {
  const d = getDB();
  const rows = d.prepare(
    `SELECT * FROM jerseys
     WHERE id != ? AND (team = ? OR format = ? OR nation = ?)
     ORDER BY rating DESC LIMIT ?`
  ).all(jersey.id, jersey.team, jersey.format, jersey.nation, size + 1) as Record<string, unknown>[];
  return rows.map(deserializeJersey).filter((j) => j.id !== jersey.id).slice(0, size);
}

export function searchSuggestions(q: string): string[] {
  const d = getDB();
  const like = `%${q}%`;
  const rows = d.prepare(
    `SELECT team, worn_by, captain FROM jerseys
     WHERE team LIKE ? OR worn_by LIKE ? OR captain LIKE ?
     LIMIT 20`
  ).all(like, like, like) as { team: string; worn_by: string; captain: string }[];

  const suggestions = new Set<string>();
  const lower = q.toLowerCase();
  for (const row of rows) {
    if (row.team?.toLowerCase().includes(lower)) suggestions.add(row.team);
    if (row.captain?.toLowerCase().includes(lower)) suggestions.add(row.captain);
    try {
      const players: string[] = JSON.parse(row.worn_by || "[]");
      for (const p of players) {
        if (p.toLowerCase().includes(lower)) suggestions.add(p);
      }
    } catch { /* skip */ }
    if (suggestions.size >= 8) break;
  }
  return [...suggestions].slice(0, 8);
}

export function getAllTournaments(): Tournament[] {
  const d = getDB();
  const rows = d.prepare("SELECT * FROM tournaments ORDER BY season DESC").all() as Tournament[];
  return rows;
}
