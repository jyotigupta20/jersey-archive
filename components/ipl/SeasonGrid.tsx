import Link from "next/link";
import { Jersey } from "@/lib/types";

interface SeasonGridProps {
  season: string;
  jerseys: Jersey[];
}

function hasImage(j: Jersey) {
  return j.image_urls?.length > 0 && !j.image_urls[0].includes("drive.google");
}

export function SeasonGrid({ season, jerseys }: SeasonGridProps) {
  // Sort by standing asc (winner first), then by team name
  const sorted = [...jerseys].sort((a, b) => {
    if (a.tournament_won && !b.tournament_won) return -1;
    if (!a.tournament_won && b.tournament_won) return 1;
    const sa = a.standing ?? 99;
    const sb = b.standing ?? 99;
    return sa - sb;
  });

  const winner = sorted.find((j) => j.tournament_won);

  return (
    <div>
      {/* Season banner */}
      <div className="mb-6 md:mb-8 flex items-end justify-between border-b border-[#C8D5EE] pb-4">
        <div>
          <p className="text-xs text-[#1B3A7A] uppercase tracking-widest mb-1">IPL Season</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#0F1E3D]">{season}</h1>
        </div>
        {winner && (
          <div className="text-right">
            <p className="text-xs text-[#6B85A8] mb-1">Champion</p>
            <p className="text-base md:text-lg font-bold text-[#2E5FBF]">🏆 {winner.team}</p>
          </div>
        )}
      </div>

      {/* Jersey mosaic */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {sorted.map((jersey) => (
          <Link
            key={jersey.id}
            href={`/cricket/${jersey.id}`}
            className="group relative"
          >
            <div className={`relative aspect-[3/4] rounded-xl overflow-hidden border transition-all duration-300
              ${jersey.tournament_won
                ? "border-yellow-500/50 ring-1 ring-yellow-500/20 shadow-xl shadow-yellow-500/10 scale-[1.02]"
                : "border-[#C8D5EE] hover:border-[#A8BDD8]"
              } bg-[#FFFFFF] hover:scale-[1.03] hover:shadow-xl`}
            >
              {hasImage(jersey) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={jersey.image_urls[0]}
                  alt={`${jersey.team} ${jersey.season}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl opacity-20">🏏</span>
                </div>
              )}

              {/* Champion overlay */}
              {jersey.tournament_won && (
                <div className="absolute inset-0 bg-gradient-to-t from-yellow-900/60 via-transparent to-transparent" />
              )}

              {/* Standing badge */}
              {jersey.standing && jersey.standing <= 4 && (
                <div className="absolute top-2 right-2">
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md
                    ${jersey.standing === 1 ? "bg-[#1B3A7A] text-black" :
                      jersey.standing === 2 ? "bg-gray-400 text-black" :
                      jersey.standing === 3 ? "bg-orange-500 text-[#0F1E3D]" :
                      "bg-[#C8D5EE] text-[#4A6FA5]"}`}
                  >
                    #{jersey.standing}
                  </span>
                </div>
              )}

              {/* Alt kit badge */}
              {jersey.jersey_type?.toLowerCase() === "special" && (
                <div className="absolute top-2 left-2">
                  <span className="bg-purple-600/90 text-[#0F1E3D] text-[9px] font-bold px-1.5 py-0.5 rounded">ALT</span>
                </div>
              )}

              {/* Hover info */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent
                opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                <p className="text-[#0F1E3D] text-xs font-semibold leading-tight">{jersey.team}</p>
                {jersey.brand && <p className="text-[#4A6FA5] text-[10px] uppercase mt-0.5">{jersey.brand}</p>}
              </div>
            </div>

            {/* Label */}
            <div className="mt-2 px-0.5">
              <p className="text-xs font-semibold text-[#0F1E3D] truncate">{jersey.team}</p>
              {jersey.tournament_won && (
                <p className="text-[10px] text-[#1B3A7A] font-medium">🏆 Champions</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
