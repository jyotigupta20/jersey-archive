import { Client } from "@elastic/elasticsearch";
import { Jersey, Tournament, SearchParams, SearchResult } from "./types";

const JERSEYS_INDEX = "jerseys";
const TOURNAMENTS_INDEX = "tournaments";

let client: Client | null = null;

export function getESClient(): Client {
  if (!client) {
    client = new Client({
      node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
    });
  }
  return client;
}

const jerseyMappings = {
  properties: {
    id: { type: "keyword" as const },
    sport: { type: "keyword" as const },
    format: { type: "keyword" as const },
    league: { type: "keyword" as const },
    team: { type: "text" as const, fields: { keyword: { type: "keyword" as const } } },
    team_logo_url: { type: "keyword" as const, index: false },
    season: { type: "keyword" as const },
    jersey_type: { type: "keyword" as const },
    design_description: { type: "text" as const },
    primary_color: { type: "keyword" as const },
    brand: { type: "keyword" as const },
    sponsor: { type: "keyword" as const },
    nation: { type: "keyword" as const },
    rating: { type: "float" as const },
    worn_by: { type: "text" as const, fields: { keyword: { type: "keyword" as const } } },
    captain: { type: "text" as const, fields: { keyword: { type: "keyword" as const } } },
    image_urls: { type: "keyword" as const, index: false },
    tournament_won: { type: "boolean" as const },
    standing: { type: "integer" as const },
    significance: { type: "text" as const },
    design_story: { type: "text" as const },
    notable_matches: { type: "text" as const },
    tags: { type: "keyword" as const },
    image_source: { type: "keyword" as const },
    cricket_board: { type: "keyword" as const },
    host_nation: { type: "keyword" as const },
    major_tournament: { type: "text" as const },
    created_at: { type: "date" as const },
    updated_at: { type: "date" as const },
  },
};

const tournamentMappings = {
  properties: {
    id: { type: "keyword" as const },
    name: { type: "keyword" as const },
    season: { type: "keyword" as const },
    winner_club: { type: "text" as const, fields: { keyword: { type: "keyword" as const } } },
    winner_country: { type: "keyword" as const },
    runner_up_club: { type: "text" as const, fields: { keyword: { type: "keyword" as const } } },
    runner_up_country: { type: "keyword" as const },
    score: { type: "keyword" as const },
    venue: { type: "text" as const },
    team_logo_url: { type: "keyword" as const, index: false },
  },
};

export async function createIndexes() {
  const es = getESClient();

  const jerseysExists = await es.indices.exists({ index: JERSEYS_INDEX });
  if (!jerseysExists) {
    await es.indices.create({ index: JERSEYS_INDEX, mappings: jerseyMappings });
  }

  const tournamentsExists = await es.indices.exists({ index: TOURNAMENTS_INDEX });
  if (!tournamentsExists) {
    await es.indices.create({ index: TOURNAMENTS_INDEX, mappings: tournamentMappings });
  }
}

export async function indexJersey(jersey: Jersey) {
  const es = getESClient();
  await es.index({ index: JERSEYS_INDEX, id: jersey.id, document: jersey });
}

export async function indexTournament(tournament: Tournament) {
  const es = getESClient();
  await es.index({ index: TOURNAMENTS_INDEX, id: tournament.id, document: tournament });
}

export async function searchJerseys(
  params: SearchParams
): Promise<SearchResult<Jersey>> {
  const es = getESClient();

  const must: object[] = [];
  const filter: object[] = [];

  if (params.q) {
    must.push({
      multi_match: {
        query: params.q,
        fields: ["team^3", "worn_by^2", "captain^2", "design_description", "sponsor", "brand", "league", "nation", "season"],
        fuzziness: "AUTO",
      },
    });
  }

  if (params.sport) filter.push({ term: { sport: params.sport } });
  if (params.format) filter.push({ term: { format: params.format } });
  if (params.league) filter.push({ term: { league: params.league } });
  if (params.team) filter.push({ term: { "team.keyword": params.team } });
  if (params.season) filter.push({ term: { season: params.season } });
  if (params.brand) filter.push({ term: { brand: params.brand } });
  if (params.jersey_type) filter.push({ term: { jersey_type: params.jersey_type } });
  if (params.nation) filter.push({ term: { nation: params.nation } });
  if (params.tournament_won !== undefined) filter.push({ term: { tournament_won: params.tournament_won } });

  const query = must.length || filter.length ? { bool: { must, filter } } : { match_all: {} as object };

  const response = await es.search<Jersey>({
    index: JERSEYS_INDEX,
    from: params.from || 0,
    size: params.size || 24,
    query,
    sort: params.q ? undefined : [{ rating: { order: "desc" as const } }],
    aggs: {
      sport: { terms: { field: "sport", size: 10 } },
      format: { terms: { field: "format", size: 20 } },
      league: { terms: { field: "league", size: 20 } },
      brand: { terms: { field: "brand", size: 20 } },
      nation: { terms: { field: "nation", size: 30 } },
      jersey_type: { terms: { field: "jersey_type", size: 10 } },
      season: { terms: { field: "season", size: 30, order: { _key: "desc" as const } } },
      team: { terms: { field: "team.keyword", size: 50, order: { _key: "asc" as const } } },
    },
  });

  const hits = response.hits.hits.map((h) => ({
    ...(h._source as Jersey),
    id: h._id || (h._source as Jersey).id,
  }));

  const aggs: Record<string, { key: string; doc_count: number }[]> = {};
  if (response.aggregations) {
    for (const [key, val] of Object.entries(response.aggregations)) {
      const buckets = (val as { buckets: { key: string; doc_count: number }[] }).buckets;
      aggs[key] = buckets;
    }
  }

  return {
    hits,
    total: typeof response.hits.total === "number"
      ? response.hits.total
      : (response.hits.total?.value ?? 0),
    aggregations: aggs,
  };
}

export async function getJersey(id: string): Promise<Jersey | null> {
  const es = getESClient();
  try {
    const response = await es.get<Jersey>({ index: JERSEYS_INDEX, id });
    return response._source as Jersey;
  } catch {
    return null;
  }
}

export async function deleteJersey(id: string) {
  const es = getESClient();
  await es.delete({ index: JERSEYS_INDEX, id });
}

export async function getStats() {
  const es = getESClient();
  const response = await es.search({
    index: JERSEYS_INDEX,
    size: 0,
    aggs: {
      by_sport: { terms: { field: "sport" } },
      by_format: { terms: { field: "format", size: 20 } },
      by_league: { terms: { field: "league", size: 20 } },
    },
  });

  const aggs = response.aggregations as Record<string, { buckets: { key: string; doc_count: number }[] }>;

  return {
    total: typeof response.hits.total === "number" ? response.hits.total : (response.hits.total?.value ?? 0),
    by_sport: aggs?.by_sport?.buckets || [],
    by_format: aggs?.by_format?.buckets || [],
    by_league: aggs?.by_league?.buckets || [],
  };
}

export async function getFeaturedJerseys(size = 8): Promise<Jersey[]> {
  const result = await searchJerseys({ size });
  return result.hits.slice(0, size);
}

export async function getRelatedJerseys(jersey: Jersey, size = 4): Promise<Jersey[]> {
  const es = getESClient();
  const response = await es.search<Jersey>({
    index: JERSEYS_INDEX,
    size: size + 1,
    query: {
      bool: {
        must_not: [{ term: { id: jersey.id } }],
        should: [
          { term: { team: jersey.team } },
          { term: { format: jersey.format } },
          { term: { nation: jersey.nation } },
        ],
        minimum_should_match: 1,
      },
    },
  });
  return response.hits.hits
    .map((h) => h._source as Jersey)
    .filter((j) => j.id !== jersey.id)
    .slice(0, size);
}

export async function searchSuggestions(q: string): Promise<string[]> {
  const es = getESClient();
  const response = await es.search<Jersey>({
    index: JERSEYS_INDEX,
    size: 5,
    _source: ["team", "worn_by", "captain", "season"],
    query: {
      multi_match: {
        query: q,
        fields: ["team^3", "worn_by^2", "captain^2", "season"],
        type: "phrase_prefix",
      },
    },
  });

  const suggestions = new Set<string>();
  for (const hit of response.hits.hits) {
    const src = hit._source as Jersey;
    if (src.team?.toLowerCase().includes(q.toLowerCase())) suggestions.add(src.team);
    if (src.captain?.toLowerCase().includes(q.toLowerCase())) suggestions.add(src.captain);
    for (const p of src.worn_by || []) {
      if (p.toLowerCase().includes(q.toLowerCase())) suggestions.add(p);
    }
  }
  return [...suggestions].slice(0, 8);
}

export async function getAllTournaments(): Promise<Tournament[]> {
  const es = getESClient();
  const response = await es.search<Tournament>({
    index: TOURNAMENTS_INDEX,
    size: 200,
    sort: [{ season: { order: "desc" as const } }],
  });
  return response.hits.hits.map((h) => h._source as Tournament);
}
