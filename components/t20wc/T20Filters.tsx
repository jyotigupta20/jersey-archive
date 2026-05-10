"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

const TEAM_LOGOS: Record<string, string> = {
  "Afghanistan":  "/logos/t20wc/afg.jpg",
  "Australia":    "/logos/t20wc/aus.jpg",
  "Bangladesh":   "/logos/t20wc/ban.jpg",
  "Canada":       "/logos/t20wc/can.jpg",
  "England":      "/logos/t20wc/eng.png",
  "India":        "/logos/t20wc/ind.png",
  "Ireland":      "/logos/t20wc/ire.jpg",
  "Namibia":      "/logos/t20wc/nam.png",
  "Nepal":        "/logos/t20wc/nep.png",
  "Netherlands":  "/logos/t20wc/ned.jpg",
  "New Zealand":  "/logos/t20wc/nz.png",
  "Oman":         "/logos/t20wc/oma.jpg",
  "Pakistan":     "/logos/t20wc/pak.jpg",
  "South Africa": "/logos/t20wc/sa.png",
  "Scotland":     "/logos/t20wc/sco.webp",
  "Sri Lanka":    "/logos/t20wc/sl.png",
  "Uganda":       "/logos/t20wc/uga.jpg",
  "USA":          "/logos/t20wc/usa.png",
  "West Indies":  "/logos/t20wc/wi.jpg",
  "Zimbabwe":     "/logos/t20wc/zim.jpg",
};

const TEAM_SHORT: Record<string, string> = {
  "Afghanistan":  "AFG",
  "Australia":    "AUS",
  "Bangladesh":   "BAN",
  "Canada":       "CAN",
  "England":      "ENG",
  "India":        "IND",
  "Ireland":      "IRE",
  "Namibia":      "NAM",
  "Nepal":        "NEP",
  "Netherlands":  "NED",
  "New Zealand":  "NZ",
  "Oman":         "OMA",
  "Pakistan":     "PAK",
  "South Africa": "SA",
  "Scotland":     "SCO",
  "Sri Lanka":    "SL",
  "Uganda":       "UGA",
  "USA":          "USA",
  "West Indies":  "WI",
  "Zimbabwe":     "ZIM",
};

const ALL_SEASONS = ["2024", "2022", "2021", "2016", "2014", "2012", "2010", "2009", "2007"];

interface T20FiltersProps {
  availableTeams: string[];
}

export function T20Filters({ availableTeams }: T20FiltersProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const activeTeam = sp.get("team") ?? "";
  const activeSeason = sp.get("season") ?? "";

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (params.get(key) === value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  }

  function clearAll() {
    router.push("/t20wc", { scroll: false });
  }

  const hasFilter = activeTeam || activeSeason;

  return (
    <div className="sticky top-16 z-30 bg-[#F4F6FB]/95 backdrop-blur-md border-b border-[#C8D5EE]">
      <div className="max-w-7xl mx-auto px-4 py-2 md:py-3 space-y-2">

        {/* Season pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <span className="text-xs text-[#6B85A8] uppercase tracking-widest shrink-0 w-[52px]">Season</span>
          <div className="flex gap-1.5">
            {ALL_SEASONS.map((year) => (
              <button
                key={year}
                onClick={() => setParam("season", year)}
                className={`shrink-0 w-[60px] h-[36px] rounded-full text-xs font-medium transition-all ${
                  activeSeason === year
                    ? "bg-[#1B3A7A] text-white font-bold"
                    : "bg-[#FFFFFF] text-[#4A6FA5] hover:bg-[#EAF0FF] hover:text-[#1B3A7A] border border-[#C8D5EE]"
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        {/* Team tiles */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <span className="text-xs text-[#6B85A8] uppercase tracking-widest shrink-0 w-[52px]">Team</span>
          <div className="flex gap-2">
            {availableTeams.map((team) => {
              const logo = TEAM_LOGOS[team];
              const short = TEAM_SHORT[team] ?? team.slice(0, 3).toUpperCase();
              const isActive = activeTeam === team;
              return (
                <button
                  key={team}
                  onClick={() => setParam("team", team)}
                  title={team}
                  className={`shrink-0 flex flex-col items-center justify-center gap-1 w-[64px] py-2 rounded-xl border transition-all duration-200
                    ${isActive
                      ? "bg-[#1B3A7A] border-[#1B3A7A] shadow-md"
                      : "bg-[#FFFFFF] border-[#C8D5EE] hover:bg-[#EAF0FF] hover:border-[#1B3A7A]/40"
                    }`}
                >
                  {logo ? (
                    <Image src={logo} alt={team} width={36} height={36} className="w-9 h-9 object-contain" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#EAF0FF] flex items-center justify-center text-[10px] font-bold text-[#1B3A7A]">
                      {short.slice(0, 2)}
                    </div>
                  )}
                  <span className={`text-[10px] font-semibold leading-none ${isActive ? "text-white" : "text-[#4A6FA5]"}`}>
                    {short}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active filters + clear */}
        {hasFilter && (
          <div className="flex items-center gap-2 flex-wrap pb-0.5">
            {activeSeason && (
              <span className="inline-flex items-center gap-1 bg-[#1B3A7A]/10 border border-[#1B3A7A]/40 text-[#2E5FBF] text-xs px-2.5 py-1 rounded-full">
                {activeSeason}
                <button onClick={() => setParam("season", activeSeason)} className="ml-0.5 hover:text-[#0F1E3D] min-w-[16px] min-h-[16px] flex items-center justify-center">×</button>
              </span>
            )}
            {activeTeam && (
              <span className="inline-flex items-center gap-1 bg-[#1B3A7A]/10 border border-[#1B3A7A]/40 text-[#2E5FBF] text-xs px-2.5 py-1 rounded-full">
                {TEAM_SHORT[activeTeam] ?? activeTeam}
                <button onClick={() => setParam("team", activeTeam)} className="ml-0.5 hover:text-[#0F1E3D] min-w-[16px] min-h-[16px] flex items-center justify-center">×</button>
              </span>
            )}
            <button onClick={clearAll} className="text-xs text-[#6B85A8] hover:text-[#0F1E3D] transition-colors py-1 px-1">
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
