"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

const TEAM_LOGOS: Record<string, string> = {
  "Mumbai Indians":              "/logos/ipl/mi.png",
  "Chennai Super Kings":         "/logos/ipl/csk.png",
  "Kolkata Knight Riders":       "/logos/ipl/kkr.png",
  "Royal Challengers Bengaluru": "/logos/ipl/rcb.png",
  "Rajasthan Royals":            "/logos/ipl/rr.png",
  "Sunrisers Hyderabad":         "/logos/ipl/srh.png",
  "Delhi Capitals":              "/logos/ipl/dc.png",
  "Punjab Kings":                "/logos/ipl/pbks.png",
  "Gujarat Titans":              "/logos/ipl/gt.png",
  "Lucknow Super Giants":        "/logos/ipl/lsg.png",
  "Rising Pune Super Giants":    "/logos/ipl/rps.webp",
  "Pune Warriors India":         "/logos/ipl/pwi.png",
  "Kochi Tuskers Kerala":        "/logos/ipl/ktk.png",
};

const TEAM_SHORT: Record<string, string> = {
  "Mumbai Indians":              "MI",
  "Chennai Super Kings":         "CSK",
  "Kolkata Knight Riders":       "KKR",
  "Royal Challengers Bengaluru": "RCB",
  "Rajasthan Royals":            "RR",
  "Sunrisers Hyderabad":         "SRH",
  "Delhi Capitals":              "DC",
  "Punjab Kings":                "PBKS",
  "Gujarat Titans":              "GT",
  "Lucknow Super Giants":        "LSG",
  "Rising Pune Super Giants":    "RPS",
  "Pune Warriors India":         "PWI",
  "Kochi Tuskers Kerala":        "KTK",
};

const ALL_SEASONS = Array.from({ length: 2025 - 2008 + 1 }, (_, i) => String(2008 + i)).reverse();

interface IPLFiltersProps {
  availableTeams: string[];
  dark?: boolean;
}

export function IPLFilters({ availableTeams, dark = false }: IPLFiltersProps) {
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
    router.push("/ipl", { scroll: false });
  }

  const hasFilter = activeTeam || activeSeason;

  return (
    <div className={`sticky top-16 z-30 backdrop-blur-md border-b ${dark ? "bg-[#0d1b35]/95 border-[#1e2e50]" : "bg-[#F4F6FB]/95 border-[#C8D5EE]"}`}>
      <div className="max-w-7xl mx-auto px-4 py-2 md:py-3 space-y-2">

        {/* Season pills — scrollable row */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <span className={`text-xs uppercase tracking-widest shrink-0 w-[52px] ${dark ? "text-white/50" : "text-[#6B85A8]"}`}>Season</span>
          <div className="flex gap-1.5">
            {ALL_SEASONS.map((year) => (
              <button
                key={year}
                onClick={() => setParam("season", year)}
                className={`shrink-0 w-[60px] h-[36px] rounded-full text-xs font-medium transition-all ${
                  activeSeason === year
                    ? dark ? "bg-white text-[#0F1E3D] font-bold" : "bg-[#1B3A7A] text-white font-bold"
                    : dark ? "bg-white/10 text-white/70 hover:bg-white/20 border border-white/20" : "bg-[#FFFFFF] text-[#4A6FA5] hover:bg-[#EAF0FF] hover:text-[#1B3A7A] border border-[#C8D5EE]"
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        {/* Team tiles — scrollable row */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <span className={`text-xs uppercase tracking-widest shrink-0 w-[52px] ${dark ? "text-white/50" : "text-[#6B85A8]"}`}>Team</span>
          <div className="flex gap-2">
            {availableTeams.filter((t) => t !== "IPL").map((team) => {
              const logo = TEAM_LOGOS[team];
              const short = TEAM_SHORT[team] ?? team.split(" ").map(w => w[0]).join("");
              const isActive = activeTeam === team;
              return (
                <button
                  key={team}
                  onClick={() => setParam("team", team)}
                  title={team}
                  className={`shrink-0 flex flex-col items-center justify-center gap-1.5 w-[80px] py-3 rounded-xl border transition-all duration-200 ${
                    isActive
                      ? dark ? "bg-white/20 border-white/40 shadow-md" : "bg-[#1B3A7A] border-[#1B3A7A] shadow-md"
                      : dark ? "bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/40" : "bg-[#FFFFFF] border-[#C8D5EE] hover:bg-[#EAF0FF] hover:border-[#1B3A7A]/40"
                  }`}
                >
                  {logo ? (
                    <Image
                      src={logo}
                      alt={team}
                      width={48}
                      height={48}
                      className="w-12 h-12 object-contain"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#EAF0FF] flex items-center justify-center text-xs font-bold text-[#1B3A7A]">
                      {short.slice(0, 2)}
                    </div>
                  )}
                  <span className={`text-[11px] font-semibold leading-none ${
                    isActive
                      ? dark ? "text-white font-bold" : "text-white font-bold"
                      : dark ? "text-white/70" : "text-[#4A6FA5]"
                  }`}>
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
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${dark ? "bg-white/10 border-white/30 text-white" : "bg-[#1B3A7A]/10 border-[#1B3A7A]/40 text-[#2E5FBF]"}`}>
                {activeSeason}
                <button onClick={() => setParam("season", activeSeason)} className="ml-0.5 min-w-[16px] min-h-[16px] flex items-center justify-center">×</button>
              </span>
            )}
            {activeTeam && (
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${dark ? "bg-white/10 border-white/30 text-white" : "bg-[#1B3A7A]/10 border-[#1B3A7A]/40 text-[#2E5FBF]"}`}>
                {TEAM_SHORT[activeTeam] ?? activeTeam}
                <button onClick={() => setParam("team", activeTeam)} className="ml-0.5 min-w-[16px] min-h-[16px] flex items-center justify-center">×</button>
              </span>
            )}
            <button onClick={clearAll} className={`text-xs transition-colors py-1 px-1 ${dark ? "text-white/50 hover:text-white" : "text-[#6B85A8] hover:text-[#0F1E3D]"}`}>
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
