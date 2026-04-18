import { Suspense } from "react";
import Image from "next/image";
import { searchJerseys } from "@/lib/db";
import { IPLFilters } from "@/components/ipl/IPLFilters";
import { TeamTimeline } from "@/components/ipl/TeamTimeline";
import { TeamDetail } from "@/components/ipl/TeamDetail";
import { SeasonGrid } from "@/components/ipl/SeasonGrid";
import { Jersey } from "@/lib/types";

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

// Canonical sort order for teams (by IPL pedigree)
const TEAM_ORDER = [
  "Mumbai Indians",
  "Chennai Super Kings",
  "Kolkata Knight Riders",
  "Royal Challengers Bengaluru",
  "Rajasthan Royals",
  "Sunrisers Hyderabad",
  "Delhi Capitals",
  "Punjab Kings",
  "Gujarat Titans",
  "Lucknow Super Giants",
  "Rising Pune Super Giants",
  "Pune Warriors India",
  "Kochi Tuskers Kerala",
];

function teamSortKey(name: string) {
  const idx = TEAM_ORDER.indexOf(name);
  return idx === -1 ? 99 : idx;
}

async function IPLContent({ sp }: { sp: Record<string, string> }) {
  const team = sp.team ?? "";
  const season = sp.season ?? "";

  // Fetch all IPL jerseys matching current filters
  let result: ReturnType<typeof searchJerseys> = { hits: [] as Jersey[], total: 0, aggregations: undefined };
  try {
    result = searchJerseys({
      sport: "cricket",
      format: "IPL",
      team: team || undefined,
      season: season || undefined,
      size: 500,
    });
  } catch { /* use default */ }

  const jerseys = result.hits;

  // Build team list from aggregations for the filter
  const availableTeams = (result.aggregations?.team ?? [])
    .map((b) => b.key)
    .filter(Boolean)
    .sort((a, b) => teamSortKey(a) - teamSortKey(b));

  // ── View: specific team selected ──────────────────────────────────────────
  if (team) {
    return (
      <>
        <IPLFilters availableTeams={availableTeams} />
        <div className="max-w-7xl mx-auto px-4 py-7 md:py-10">
          <TeamDetail
            team={team}
            jerseys={season ? jerseys.filter((j) => j.season === season) : jerseys}
          />
        </div>
      </>
    );
  }

  // ── View: specific season selected ───────────────────────────────────────
  if (season) {
    // Remove duplicate team+jersey_type entries — prefer Home kit if multiple
    const seen = new Map<string, Jersey>();
    for (const j of jerseys) {
      const key = j.team;
      const existing = seen.get(key);
      if (!existing || j.jersey_type?.toLowerCase() === "home") {
        seen.set(key, j);
      }
    }
    const uniqueJerseys = [...seen.values()];

    return (
      <>
        <IPLFilters availableTeams={availableTeams} />
        <div className="max-w-7xl mx-auto px-4 py-7 md:py-10">
          <SeasonGrid season={season} jerseys={uniqueJerseys} />
        </div>
      </>
    );
  }

  // ── View: all teams — the hub ─────────────────────────────────────────────
  // Group jerseys by team
  const byTeam = new Map<string, Jersey[]>();
  for (const j of jerseys) {
    if (!j.team) continue;
    if (!byTeam.has(j.team)) byTeam.set(j.team, []);
    byTeam.get(j.team)!.push(j);
  }

  // Sort teams canonically
  const teams = [...byTeam.keys()].sort((a, b) => teamSortKey(a) - teamSortKey(b));

  // Stats for the header
  const totalJerseys = jerseys.length;
  const totalTeams = teams.length;
  const seasons = [...new Set(jerseys.map((j) => j.season).filter(Boolean))].sort();
  const firstYear = seasons[0];
  const lastYear = seasons[seasons.length - 1];

  return (
    <>
      <IPLFilters availableTeams={availableTeams} />

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-10 space-y-10 md:space-y-14">
        {teams.map((teamName) => (
          <TeamTimeline
            key={teamName}
            team={teamName}
            jerseys={byTeam.get(teamName)!}
          />
        ))}
      </div>

      {/* Bottom stats bar */}
      <div className="border-t border-[#1e2e50] mt-8 md:mt-10">
        <div className="max-w-7xl mx-auto px-4 py-5 md:py-6 flex flex-wrap gap-6 md:gap-8 text-center justify-center">
          <div>
            <p className="text-xl md:text-2xl font-bold text-white">{totalJerseys}</p>
            <p className="text-xs text-white/50 uppercase tracking-widest">Total Kits</p>
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold text-white">{totalTeams}</p>
            <p className="text-xs text-white/50 uppercase tracking-widest">Franchises</p>
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold text-white">{firstYear}–{lastYear}</p>
            <p className="text-xs text-white/50 uppercase tracking-widest">Coverage</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default async function IPLPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  // Fetch aggregations for team list (no filters — always full list)
  let baseAggs: ReturnType<typeof searchJerseys> = { hits: [], total: 0, aggregations: undefined };
  try {
    baseAggs = searchJerseys({ sport: "cricket", format: "IPL", size: 0 });
  } catch { /* use default */ }

  const availableTeams = (baseAggs.aggregations?.team ?? [])
    .map((b) => b.key)
    .filter(Boolean)
    .sort((a, b) => teamSortKey(a) - teamSortKey(b));

  const team = sp.team ?? "";
  const season = sp.season ?? "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1E3D] via-[#1B3A7A] to-[#0a1628]">
      {/* Hero */}
      <div className="relative border-b border-[#C8D5EE] bg-[#F4F6FB] flex items-stretch min-h-[380px] md:min-h-[440px] overflow-hidden">
        {/* Left — text, aligned to max-w-7xl left edge */}
        <div className="flex-1 max-w-[580px] pl-4 md:pl-[max(1rem,calc((100vw-80rem)/2+1rem))] py-10 md:py-14 flex flex-col justify-center pr-6 z-10">
          <Image
            src="/logos/ipl/ipl-logo.png"
            alt="IPL"
            width={280}
            height={168}
            className="w-56 md:w-64 h-auto object-contain mb-2"
          />
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#0F1E3D] leading-tight tracking-tight">
            IPL History,<br />
            <span className="text-[#2E5FBF]">told through jerseys</span>
          </h1>
          <p className="text-[#6B85A8] mt-3 md:mt-4 text-sm md:text-base leading-relaxed max-w-sm">
            {team ? `Viewing ${team}.` : season ? `Viewing ${season} season.` : "From 2008 to 2026 — relive the history of every team, every season, and every jersey worn by your favourite players. All in one place."}
          </p>
        </div>

        {/* Right — image bleeds to the right viewport edge */}
        <div className="hidden md:block absolute right-0 top-0 bottom-0 w-[65%]">
          <Image
            src="/images/ipl-hero.png"
            alt="IPL Hero"
            fill
            className="object-cover object-center"
            quality={100}
            sizes="65vw"
            priority
          />
          {/* Fade left edge into dark background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#F4F6FB] via-[#F4F6FB]/10 to-transparent" />
        </div>
      </div>

      {/* Content with filters */}
      <Suspense fallback={
        <div>
          <div className="h-12 bg-[#FFFFFF] border-b border-[#C8D5EE]" />
          <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="h-5 bg-[#FFFFFF] rounded w-48 mb-4 animate-pulse" />
                <div className="flex gap-3">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <div key={j} className="w-[120px] shrink-0">
                      <div className="aspect-[3/4] bg-[#FFFFFF] rounded-xl animate-pulse" />
                      <div className="h-3 bg-[#FFFFFF] rounded mt-2 animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      }>
        <IPLContent sp={sp} />
      </Suspense>
    </div>
  );
}
