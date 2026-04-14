import { Suspense } from "react";
import { searchJerseys } from "@/lib/elasticsearch";
import { JerseyGrid } from "@/components/jersey/JerseyGrid";
import { JerseyFilters } from "@/components/jersey/JerseyFilters";

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

async function SearchResults({ q, searchParams }: { q: string; searchParams: Record<string, string> }) {
  let result: Awaited<ReturnType<typeof searchJerseys>> = { hits: [], total: 0, aggregations: undefined };
  try {
    result = await searchJerseys({
      q,
      sport: searchParams.sport as "cricket" | "football" | undefined,
      format: searchParams.format,
      from: parseInt(searchParams.from || "0"),
      size: 24,
    });
  } catch (e) {
    console.error(e);
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <JerseyFilters aggregations={result.aggregations} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#4A6FA5] mb-5 md:mb-6">
          {result.total.toLocaleString()} results for &quot;<span className="text-[#0F1E3D]">{q}</span>&quot;
        </p>
        <JerseyGrid
          jerseys={result.hits}
          emptyMessage={`No jerseys found for "${q}"`}
        />
      </div>
    </div>
  );
}

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = sp.q || "";

  return (
    <div className="max-w-7xl mx-auto px-4 py-7 md:py-10">
      <div className="mb-6 md:mb-8">
        <p className="text-xs text-[#1B3A7A] uppercase tracking-widest mb-2">Search</p>
        <h1 className="text-2xl md:text-3xl font-bold text-[#0F1E3D]">
          {q ? `Results for "${q}"` : "Search Jerseys"}
        </h1>
      </div>
      {q ? (
        <Suspense fallback={
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-[#FFFFFF] rounded-xl animate-pulse" />
            ))}
          </div>
        }>
          <SearchResults q={q} searchParams={sp} />
        </Suspense>
      ) : (
        <div className="text-center py-20">
          <p className="text-[#6B85A8]">Enter a search term to find jerseys</p>
        </div>
      )}
    </div>
  );
}
