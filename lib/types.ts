export type Sport = "football" | "cricket";
export type Format = "IPL" | "ODI" | "T20" | "UCL" | "Premier League";
export type JerseyType = "Home" | "Away" | "Third" | "Alternate";

export interface Jersey {
  id: string;
  sport: Sport;
  format: Format;
  league: string;
  team: string;
  team_logo_url: string;
  season: string;
  jersey_type: JerseyType | string;
  design_description: string;
  primary_color: string;
  brand: string;
  sponsor: string;
  nation: string;
  rating: number;
  worn_by: string[];
  captain: string;
  image_urls: string[];
  tournament_won: boolean;
  standing: number | null;
  significance: string;
  design_story: string;
  notable_matches: string[];
  tags: string[];
  image_source?: string;
  cricket_board?: string;
  host_nation?: string;
  major_tournament?: string;
  created_at: string;
  updated_at: string;
}

export interface Tournament {
  id: string;
  name: string;
  season: string;
  winner_club: string;
  winner_country: string;
  runner_up_club: string;
  runner_up_country: string;
  score: string;
  venue: string;
  team_logo_url: string;
}

export interface SearchParams {
  q?: string;
  sport?: Sport;
  format?: string;
  league?: string;
  team?: string;
  season?: string;
  brand?: string;
  jersey_type?: string;
  nation?: string;
  tournament_won?: boolean;
  from?: number;
  size?: number;
}

export interface SearchResult<T> {
  hits: T[];
  total: number;
  aggregations?: Record<string, AggregationBucket[]>;
}

export interface AggregationBucket {
  key: string;
  doc_count: number;
}
