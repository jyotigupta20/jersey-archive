import { Suspense } from "react";
import Image from "next/image";
import { searchJerseys } from "@/lib/db";
import { T20Filters } from "@/components/t20wc/T20Filters";
import { TeamTimeline } from "@/components/t20wc/TeamTimeline";
import { Jersey } from "@/lib/types";

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

const TEAM_ORDER = [
  "India", "Australia", "England", "Pakistan", "West Indies",
  "South Africa", "New Zealand", "Sri Lanka", "Bangladesh",
  "Afghanistan", "Zimbabwe", "Ireland", "Scotland", "Nepal",
  "Netherlands", "Namibia", "Oman", "Canada", "USA", "Uganda",
];

function teamSortKey(name: string) {
  const idx = TEAM_ORDER.indexOf(name);
  return idx === -1 ? 99 : idx;
}

async function T20Content({ sp }: { sp: Record<string, string> }) {
  const team = sp.team ?? "";
  const season = sp.season ?? "";

  let result: ReturnType<typeof searchJerseys> = { hits: [] as Jersey[], total: 0, aggregations: undefined };
  try {
    result = searchJerseys({
      league: "T20 World Cup",
      team: team || undefined,
      season: season || undefined,
      size: 500,
    });
  } catch { /* use default */ }

  const jerseys = result.hits;

  const availableTeams = (result.aggregations?.team ?? [])
    .map((b) => b.key)
    .filter(Boolean)
    .sort((a, b) => teamSortKey(a) - teamSortKey(b));

  // ── Season view ─────────────────────────────────────────────────────────────
  if (season) {
    const sorted = [...jerseys].sort((a, b) => teamSortKey(a.team) - teamSortKey(b.team));
    return (
      <>
        <T20Filters availableTeams={availableTeams} />
        <div className="max-w-7xl mx-auto px-4 py-7 md:py-10">
          <div className="mb-6 border-b border-[#1e2e50] pb-4">
            <p className="text-xs text-[#4A7FD4] uppercase tracking-widest mb-1">T20 World Cup</p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white">{season} Season</h1>
            <p className="text-white/50 text-sm mt-1">{sorted.length} teams</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {sorted.map((jersey) => (
              <a key={jersey.id} href={`/cricket/${jersey.id}`} className="group">
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-[#1e2e50] bg-[#111d35] hover:border-[#2E5FBF]/50 transition-all duration-300">
                  {jersey.image_urls?.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={jersey.image_urls[0]} alt={`${jersey.team} ${jersey.season}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><span className="text-3xl opacity-20">🏏</span></div>
                  )}
                  {jersey.tournament_won && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-amber-400/80 to-transparent py-1.5 text-center">
                      <span className="text-[9px] font-bold text-[#1B3A7A] uppercase tracking-widest">🏆 Champions</span>
                    </div>
                  )}
                </div>
                <div className="mt-1.5 px-0.5">
                  <p className="text-xs font-semibold text-white truncate">{jersey.team}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </>
    );
  }

  // ── Team view ────────────────────────────────────────────────────────────────
  if (team) {
    const sorted = [...jerseys].sort((a, b) => Number(b.season) - Number(a.season));
    return (
      <>
        <T20Filters availableTeams={availableTeams} />
        <div className="max-w-7xl mx-auto px-4 py-7 md:py-10">
          <div className="mb-8 border-b border-[#1e2e50] pb-4">
            <p className="text-xs text-[#4A7FD4] uppercase tracking-widest mb-1">T20 World Cup</p>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white">{team}</h1>
            <p className="text-white/50 text-sm mt-1">{sorted.length} jerseys · {sorted[sorted.length - 1]?.season}–{sorted[0]?.season}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {sorted.map((jersey) => (
              <a key={jersey.id} href={`/cricket/${jersey.id}`} className="group block">
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-[#1e2e50] bg-[#111d35] hover:border-[#2E5FBF]/50 hover:scale-[1.02] hover:shadow-xl transition-all duration-300">
                  {jersey.image_urls?.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={jersey.image_urls[0]} alt={`${jersey.team} ${jersey.season}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><span className="text-3xl opacity-20">🏏</span></div>
                  )}
                </div>
                <div className="mt-2 px-0.5">
                  <span className="text-base font-bold text-white">{jersey.season}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </>
    );
  }

  // ── Hub view — all teams ─────────────────────────────────────────────────────
  const byTeam = new Map<string, Jersey[]>();
  for (const j of jerseys) {
    if (!j.team) continue;
    if (!byTeam.has(j.team)) byTeam.set(j.team, []);
    byTeam.get(j.team)!.push(j);
  }
  const teams = [...byTeam.keys()].sort((a, b) => teamSortKey(a) - teamSortKey(b));
  const totalJerseys = jerseys.length;
  const seasons = [...new Set(jerseys.map((j) => j.season).filter(Boolean))].sort();

  return (
    <>
      <T20Filters availableTeams={availableTeams} />
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-10 space-y-10 md:space-y-14">
        {teams.map((teamName) => (
          <TeamTimeline key={teamName} team={teamName} jerseys={byTeam.get(teamName)!} />
        ))}
      </div>
      <div className="border-t border-[#1e2e50] mt-8 md:mt-10">
        <div className="max-w-7xl mx-auto px-4 py-5 md:py-6 flex flex-wrap gap-6 md:gap-8 text-center justify-center">
          <div>
            <p className="text-xl md:text-2xl font-bold text-white">{totalJerseys}</p>
            <p className="text-xs text-white/50 uppercase tracking-widest">Total Kits</p>
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold text-white">{teams.length}</p>
            <p className="text-xs text-white/50 uppercase tracking-widest">Nations</p>
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold text-white">{seasons[0]}–{seasons[seasons.length - 1]}</p>
            <p className="text-xs text-white/50 uppercase tracking-widest">Coverage</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default async function T20WCPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  let baseAggs: ReturnType<typeof searchJerseys> = { hits: [], total: 0, aggregations: undefined };
  try {
    baseAggs = searchJerseys({ league: "T20 World Cup", size: 0 });
  } catch { /* use default */ }

  const availableTeams = (baseAggs.aggregations?.team ?? [])
    .map((b) => b.key)
    .filter(Boolean)
    .sort((a, b) => teamSortKey(a) - teamSortKey(b));

  const season = sp.season ?? "";
  const team = sp.team ?? "";

  return (
    <div className="min-h-screen bg-[#0F1E3D]">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0F1E3D] via-[#1B3A7A] to-[#0a1628] border-b border-[#1e2e50]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(46,95,191,0.15)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.05)_0%,transparent_60%)]" />

        <div className="relative max-w-7xl mx-auto px-4 py-8 md:py-12">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-6 min-w-0">
              {/* ICC T20 WC Logo */}
              <div className="hidden md:flex shrink-0 items-center">
                <Image
                  src="/logos/ipl/ipl.webp"
                  alt="T20 World Cup"
                  width={120}
                  height={120}
                  className="w-20 h-20 object-contain opacity-90 drop-shadow-lg"
                />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/80 text-xs px-3 py-1.5 rounded-full mb-3 md:mb-4 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 bg-white rounded-full" />
                  ICC T20 World Cup
                </div>
                <h1 className="text-3xl md:text-6xl font-extrabold text-white leading-tight tracking-tight">
                  T20 World Cup<br />
                  <span className="text-[#4A7FD4]">Archive</span>
                </h1>
                <p className="text-white/60 mt-3 md:mt-4 text-sm md:text-base max-w-xl leading-relaxed">
                  Every international kit from every nation across all T20 World Cup editions.
                  {team ? ` Viewing ${team}.` : season ? ` Viewing ${season}.` : " Browse by team or edition."}
                </p>
              </div>
            </div>

            {(season || team) && (
              <div className="hidden md:flex flex-col items-end gap-2 shrink-0">
                {season && (
                  <div className="bg-white/10 border border-white/20 rounded-2xl px-5 py-3 text-center">
                    <p className="text-4xl font-black text-white">{season}</p>
                    <p className="text-xs text-white/50 uppercase tracking-widest mt-1">Edition</p>
                  </div>
                )}
                {team && (
                  <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 max-w-[180px]">
                    <p className="text-sm font-semibold text-white truncate">{team}</p>
                    <p className="text-xs text-white/50">Nation</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Suspense fallback={
        <div>
          <div className="h-12 bg-[#0F1E3D] border-b border-[#1e2e50]" />
          <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="h-5 bg-[#1e2e50] rounded w-48 mb-4 animate-pulse" />
                <div className="flex gap-3">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="w-[120px] shrink-0">
                      <div className="aspect-[3/4] bg-[#1e2e50] rounded-xl animate-pulse" />
                      <div className="h-3 bg-[#1e2e50] rounded mt-2 animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      }>
        <T20Content sp={sp} />
      </Suspense>
    </div>
  );
}
