import { Suspense } from "react";
import { searchJerseys } from "@/lib/db";
import { JerseyGrid } from "@/components/jersey/JerseyGrid";
import { JerseyFilters } from "@/components/jersey/JerseyFilters";
import { FilterBar } from "@/components/jersey/FilterBar";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function CricketPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  // Fetch full cricket aggregations (no team/season filter) so dropdowns always show all options
  let allAggs: Awaited<ReturnType<typeof searchJerseys>>["aggregations"];
  try {
    const base = await searchJerseys({ sport: "cricket", format: sp.format, size: 0 });
    allAggs = base.aggregations;
  } catch (e) {
    console.error(e);
  }

  let result: Awaited<ReturnType<typeof searchJerseys>> = { hits: [], total: 0, aggregations: undefined };
  try {
    result = await searchJerseys({
      sport: "cricket",
      format: sp.format,
      league: sp.league,
      team: sp.team,
      season: sp.season,
      brand: sp.brand,
      jersey_type: sp.jersey_type,
      nation: sp.nation,
      from: parseInt(sp.from || "0"),
      size: 24,
    });
  } catch (e) {
    console.error(e);
  }

  const formats = [
    { key: "IPL", label: "IPL", icon: "🏏" },
    { key: "T20", label: "T20", icon: "⚡" },
    { key: "ODI", label: "ODI", icon: "🌍" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#F4F6FB] via-emerald-50 to-[#F4F6FB] border-b border-[#C8D5EE]">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl md:text-4xl">🏏</span>
            <div>
              <p className="text-xs text-emerald-400 uppercase tracking-widest mb-1">Sport</p>
              <h1 className="text-2xl md:text-3xl font-bold text-[#0F1E3D]">Cricket Jerseys</h1>
            </div>
          </div>
          <p className="text-[#4A6FA5] mt-2 text-sm ml-12 md:ml-16">
            {result.total} jerseys across IPL, T20 World Cup, and ODI formats
          </p>

          {/* Format quick links */}
          <div className="flex gap-2 md:gap-3 mt-4 md:mt-6 ml-0 md:ml-16 overflow-x-auto no-scrollbar pb-1">
            {formats.map((f) => (
              <Link
                key={f.key}
                href={`/cricket?format=${f.key}`}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm border transition-colors shrink-0 ${
                  sp.format === f.key
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                    : "bg-[#FFFFFF] border-[#C8D5EE] text-[#4A6FA5] hover:text-[#0F1E3D] hover:border-[#A8BDD8]"
                }`}
              >
                <span>{f.icon}</span>
                <span>{f.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Top filter bar — Year + Team dropdowns */}
      <Suspense fallback={null}>
        <FilterBar
          aggregations={allAggs}
          baseParams={sp.format ? { format: sp.format } : {}}
        />
      </Suspense>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col md:flex-row gap-6">
          <JerseyFilters aggregations={result.aggregations} />
          <div className="flex-1 min-w-0">
            {(sp.team || sp.season) && (
              <p className="text-sm text-[#4A6FA5] mb-4">
                {result.total} {result.total === 1 ? "jersey" : "jerseys"} found
                {sp.team ? ` · ${sp.team}` : ""}
                {sp.season ? ` · ${sp.season}` : ""}
              </p>
            )}
            <JerseyGrid jerseys={result.hits} emptyMessage="No cricket jerseys found" />
          </div>
        </div>
      </div>
    </div>
  );
}
