import { Suspense } from "react";
import { searchJerseys } from "@/lib/elasticsearch";
import { SearchParams } from "@/lib/types";
import { JerseyGrid } from "@/components/jersey/JerseyGrid";
import { JerseyFilters } from "@/components/jersey/JerseyFilters";
import { FilterBar } from "@/components/jersey/FilterBar";
import { ExploreClient } from "./ExploreClient";

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

async function ExploreResults({ searchParams }: { searchParams: Record<string, string> }) {
  const params: SearchParams = {
    q: searchParams.q,
    sport: searchParams.sport as SearchParams["sport"],
    format: searchParams.format,
    league: searchParams.league,
    team: searchParams.team,
    season: searchParams.season,
    brand: searchParams.brand,
    jersey_type: searchParams.jersey_type,
    nation: searchParams.nation,
    from: parseInt(searchParams.from || "0"),
    size: 24,
  };

  let result: Awaited<ReturnType<typeof searchJerseys>> = { hits: [], total: 0, aggregations: undefined };
  try {
    result = await searchJerseys(params);
  } catch (e) {
    console.error(e);
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <JerseyFilters aggregations={result.aggregations} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-5 md:mb-6">
          <p className="text-sm text-[#4A6FA5]">
            {result.total.toLocaleString()} {result.total === 1 ? "jersey" : "jerseys"} found
          </p>
        </div>
        <JerseyGrid jerseys={result.hits} />
        {result.total > 24 && (
          <div className="mt-6 md:mt-8 text-center">
            <ExploreClient total={result.total} from={params.from || 0} />
          </div>
        )}
      </div>
    </div>
  );
}

async function ExploreFilterBar({ searchParams }: { searchParams: Record<string, string> }) {
  // Fetch aggregations without team/season filters so dropdowns always show full option list
  const base = await searchJerseys({
    sport: searchParams.sport as SearchParams["sport"],
    format: searchParams.format,
    size: 0,
  }).catch(() => ({ hits: [], total: 0, aggregations: undefined }));

  return (
    <FilterBar aggregations={base.aggregations} />
  );
}

export default async function ExplorePage({ searchParams }: PageProps) {
  const sp = await searchParams;

  return (
    <div>
      {/* Header */}
      <div className="border-b border-[#C8D5EE]">
        <div className="max-w-7xl mx-auto px-4 py-7 md:py-10">
          <p className="text-xs text-[#1B3A7A] uppercase tracking-widest mb-2">Browse</p>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F1E3D]">Explore Jerseys</h1>
          <p className="text-[#4A6FA5] mt-2 text-sm">Filter by sport, league, team, brand, and more</p>
        </div>
      </div>

      {/* Top filter bar — Year + Team dropdowns */}
      <Suspense fallback={null}>
        <ExploreFilterBar searchParams={sp} />
      </Suspense>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-10">
        <Suspense fallback={
          <div className="flex flex-col md:flex-row gap-6">
            <div className="hidden md:block w-56 h-96 bg-[#FFFFFF] rounded-xl animate-pulse" />
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-[#FFFFFF] rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        }>
          <ExploreResults searchParams={sp} />
        </Suspense>
      </div>
    </div>
  );
}
