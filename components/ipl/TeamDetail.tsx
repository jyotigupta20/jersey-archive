import Link from "next/link";
import { Jersey } from "@/lib/types";

interface TeamDetailProps {
  team: string;
  jerseys: Jersey[];
}

function hasImage(j: Jersey) {
  return j.image_urls?.length > 0 && !j.image_urls[0].includes("drive.google");
}

function StandingLabel({ standing, won }: { standing?: number | null; won?: boolean }) {
  if (won) return <span className="text-xs font-bold text-[#2E5FBF]">🏆 Champions</span>;
  if (!standing) return null;
  const suffix = standing === 1 ? "st" : standing === 2 ? "nd" : standing === 3 ? "rd" : "th";
  const color = standing <= 2 ? "text-[#2A4A7A]" : standing <= 4 ? "text-orange-400" : "text-[#7A93B5]";
  return <span className={`text-xs font-medium ${color}`}>{standing}{suffix} place</span>;
}

export function TeamDetail({ team, jerseys }: TeamDetailProps) {
  const sorted = [...jerseys].sort((a, b) => Number(b.season) - Number(a.season));
  const championships = sorted.filter((j) => j.tournament_won).length;
  const seasons = sorted.length;
  const firstSeason = sorted[sorted.length - 1]?.season;
  const latestSeason = sorted[0]?.season;

  // Group home and special/alternate kits
  const home = sorted.filter((j) => j.jersey_type?.toLowerCase() === "home");
  const alts = sorted.filter((j) => j.jersey_type?.toLowerCase() !== "home");

  return (
    <div>
      {/* Team hero header */}
      <div className="mb-8 md:mb-10">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs text-[#1B3A7A] uppercase tracking-widest mb-2">IPL Franchise</p>
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#0F1E3D] leading-tight">{team}</h1>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex flex-wrap gap-4 md:gap-6 mt-4 md:mt-5">
          <div>
            <p className="text-xl md:text-2xl font-bold text-[#0F1E3D]">{seasons}</p>
            <p className="text-xs text-[#6B85A8] uppercase tracking-widest">Seasons</p>
          </div>
          <div className="w-px bg-[#C8D5EE]" />
          <div>
            <p className="text-xl md:text-2xl font-bold text-[#0F1E3D]">{firstSeason}–{latestSeason}</p>
            <p className="text-xs text-[#6B85A8] uppercase tracking-widest">Era</p>
          </div>
          {championships > 0 && (
            <>
              <div className="w-px bg-[#C8D5EE]" />
              <div>
                <p className="text-xl md:text-2xl font-bold text-[#2E5FBF]">{championships}×</p>
                <p className="text-xs text-[#6B85A8] uppercase tracking-widest">Champion</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Home kits section */}
      <section className="mb-12">
        <h2 className="text-sm font-semibold text-[#4A6FA5] uppercase tracking-widest mb-5">
          Home Kits — {home.length} seasons
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {home.map((jersey) => (
            <JerseyCard key={jersey.id} jersey={jersey} />
          ))}
        </div>
      </section>

      {/* Alternate / special kits */}
      {alts.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[#4A6FA5] uppercase tracking-widest mb-5">
            Alternate &amp; Special Kits — {alts.length}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {alts.map((jersey) => (
              <JerseyCard key={jersey.id} jersey={jersey} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function JerseyCard({ jersey }: { jersey: Jersey }) {
  return (
    <Link href={`/cricket/${jersey.id}`} className="group block">
      {/* Image */}
      <div className={`relative aspect-[3/4] rounded-xl overflow-hidden border transition-all duration-300
        ${jersey.tournament_won
          ? "border-yellow-500/50 shadow-lg shadow-yellow-500/15"
          : "border-[#C8D5EE] hover:border-[#A8BDD8]"
        } bg-[#FFFFFF] hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/50`}
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

        {/* Champion gradient */}
        {jersey.tournament_won && (
          <div className="absolute inset-0 bg-gradient-to-t from-yellow-900/50 via-transparent to-yellow-500/5" />
        )}

        {/* Trophy badge */}
        {jersey.tournament_won && (
          <div className="absolute top-2 left-0 right-0 flex justify-center">
            <span className="bg-[#1B3A7A] text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-lg">
              🏆 Champions
            </span>
          </div>
        )}

        {/* Standing top-right */}
        {!jersey.tournament_won && jersey.standing && jersey.standing <= 6 && (
          <div className="absolute top-2 right-2">
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded
              ${jersey.standing === 2 ? "bg-gray-400 text-black" :
                jersey.standing === 3 ? "bg-orange-500 text-[#0F1E3D]" :
                "bg-[#EAF0FF] text-[#4A6FA5] border border-[#A8BDD8]"}`}
            >
              #{jersey.standing}
            </span>
          </div>
        )}

        {/* Hover details */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent
          opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3">
          {jersey.brand && <p className="text-[#4A6FA5] text-[10px] uppercase tracking-wider">{jersey.brand}</p>}
          {jersey.sponsor && <p className="text-[#6B85A8] text-[10px] truncate">{jersey.sponsor}</p>}
          {jersey.worn_by?.length > 0 && (
            <p className="text-[#2A4A7A] text-[10px] mt-1 truncate">{jersey.worn_by.slice(0, 2).join(", ")}</p>
          )}
        </div>
      </div>

      {/* Year + standing */}
      <div className="mt-2 px-0.5">
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-[#0F1E3D]">{jersey.season}</span>
          <StandingLabel standing={jersey.standing} won={jersey.tournament_won} />
        </div>
        {jersey.brand && (
          <p className="text-[10px] text-[#7A93B5] uppercase tracking-wide mt-0.5">{jersey.brand}</p>
        )}
      </div>
    </Link>
  );
}
