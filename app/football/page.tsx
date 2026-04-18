import { searchJerseys, getAllTournaments } from "@/lib/db";
import { JerseyGrid } from "@/components/jersey/JerseyGrid";
import { JerseyFilters } from "@/components/jersey/JerseyFilters";

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function FootballPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  let result: Awaited<ReturnType<typeof searchJerseys>> = { hits: [], total: 0, aggregations: undefined };
  let tournaments: Awaited<ReturnType<typeof getAllTournaments>> = [];

  try {
    [result, tournaments] = await Promise.all([
      searchJerseys({
        sport: "football",
        from: parseInt(sp.from || "0"),
        size: 24,
      }),
      getAllTournaments(),
    ]);
  } catch (e) {
    console.error(e);
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#F4F6FB] via-blue-950/20 to-[#F4F6FB] border-b border-[#C8D5EE]">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl md:text-4xl">⚽</span>
            <div>
              <p className="text-xs text-blue-400 uppercase tracking-widest mb-1">Sport</p>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0F1E3D]">Football Jerseys</h1>
            </div>
          </div>
          <p className="text-[#4A6FA5] mt-2 text-sm ml-12 md:ml-16">
            UEFA Champions League and beyond — jersey archive coming soon
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {result.total > 0 ? (
          <div className="flex flex-col md:flex-row gap-6">
            <JerseyFilters aggregations={result.aggregations} />
            <div className="flex-1 min-w-0">
              <JerseyGrid jerseys={result.hits} />
            </div>
          </div>
        ) : (
          <div>
            {/* UCL History Table */}
            <div className="mb-8">
              <h2 className="text-lg md:text-xl font-bold text-[#0F1E3D] mb-2">UEFA Champions League History</h2>
              <p className="text-sm text-[#4A6FA5] mb-5 md:mb-6">
                Football jerseys coming soon. Browse {tournaments.length} UCL seasons below.
              </p>
              {tournaments.length > 0 ? (
                <div className="overflow-x-auto -mx-4 px-4">
                  <table className="w-full text-sm min-w-[540px]">
                    <thead>
                      <tr className="border-b border-[#C8D5EE] text-[#4A6FA5] text-xs uppercase tracking-wider">
                        <th className="py-3 px-3 md:px-4 text-left">Season</th>
                        <th className="py-3 px-3 md:px-4 text-left">Winner</th>
                        <th className="py-3 px-3 md:px-4 text-left hidden sm:table-cell">Country</th>
                        <th className="py-3 px-3 md:px-4 text-left">Runner-up</th>
                        <th className="py-3 px-3 md:px-4 text-left">Score</th>
                        <th className="py-3 px-3 md:px-4 text-left hidden md:table-cell">Venue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tournaments.map((t) => (
                        <tr
                          key={t.id}
                          className="border-b border-[#C8D5EE] hover:bg-[#FFFFFF] transition-colors"
                        >
                          <td className="py-3 px-3 md:px-4 text-[#2A4A7A] font-medium">{t.season}</td>
                          <td className="py-3 px-3 md:px-4 text-[#0F1E3D] font-semibold">{t.winner_club}</td>
                          <td className="py-3 px-3 md:px-4 text-[#4A6FA5] hidden sm:table-cell">{t.winner_country}</td>
                          <td className="py-3 px-3 md:px-4 text-[#4A6FA5]">{t.runner_up_club}</td>
                          <td className="py-3 px-3 md:px-4 text-[#2E5FBF] font-mono">{t.score}</td>
                          <td className="py-3 px-3 md:px-4 text-[#6B85A8] text-xs hidden md:table-cell">{t.venue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-[#6B85A8] text-sm">UCL data loading...</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
