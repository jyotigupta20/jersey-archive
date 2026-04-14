"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Jersey } from "@/lib/types";

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

function hasImage(j: Jersey) {
  return j.image_urls?.length > 0 && !j.image_urls[0].includes("drive.google");
}

const PAGE_SIZE = 4;

function JerseySlider({ jerseys }: { jerseys: Jersey[] }) {
  const [startIdx, setStartIdx] = useState(0);
  const [animating, setAnimating] = useState(false);

  const canGoLeft = startIdx > 0;
  const canGoRight = startIdx + PAGE_SIZE < jerseys.length;
  const remainingAfter = jerseys.length - startIdx - PAGE_SIZE;
  const visible = jerseys.slice(startIdx, startIdx + PAGE_SIZE);

  function slide(dir: "left" | "right") {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setStartIdx((prev) =>
        dir === "right"
          ? Math.min(prev + PAGE_SIZE, jerseys.length - PAGE_SIZE)
          : Math.max(prev - PAGE_SIZE, 0)
      );
      setAnimating(false);
    }, 500);
  }

  return (
    <div className="flex items-center gap-2 md:gap-3">
      <button
        onClick={() => slide("left")}
        disabled={!canGoLeft || animating}
        aria-label="Previous jerseys"
        className={`shrink-0 w-8 h-8 rounded-full bg-[#172040] border border-[#1e2e50] flex items-center justify-center
          text-white hover:bg-[#1e3260] hover:border-[#2E5FBF] transition-all duration-300 shadow self-center
          ${canGoLeft ? "opacity-100 cursor-pointer" : "opacity-0 pointer-events-none"}`}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M8 10L4 6l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div className="grid gap-2 md:gap-4 flex-1 min-w-0" style={{ gridTemplateColumns: `repeat(${PAGE_SIZE}, 1fr)` }}>
        {visible.map((jersey) => (
          <div
            key={`${jersey.id}-${startIdx}`}
            className="min-w-0"
            style={{ animation: animating ? undefined : "fadeSlideIn 0.5s cubic-bezier(0.22,1,0.36,1) both" }}
          >
            <Link href={`/cricket/${jersey.id}`} className="block group/card">
              <div className={`relative aspect-[3/4] rounded-xl overflow-hidden border transition-all duration-300
                ${jersey.tournament_won
                  ? "border-amber-400/60 shadow-lg shadow-amber-400/15 group-hover/card:border-amber-500"
                  : "border-[#1e2e50] group-hover/card:border-[#2E5FBF]/50"
                } bg-[#111d35]`}
              >
                {hasImage(jersey) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={jersey.image_urls[0]}
                    alt={`${jersey.team} ${jersey.season}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#172040]">
                    <span className="text-3xl opacity-30">🏏</span>
                  </div>
                )}
                {jersey.tournament_won && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-amber-400/80 to-transparent py-1.5 text-center">
                    <span className="text-[9px] font-bold text-[#1B3A7A] uppercase tracking-widest drop-shadow">🏆 Champions</span>
                  </div>
                )}
                <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 bg-[#1B3A7A]/70 backdrop-blur-[2px]">
                  <span className="text-white text-[10px] font-semibold bg-[#1B3A7A]/50 px-2 py-1 rounded-md">View</span>
                </div>
              </div>
              <div className="mt-1.5 px-0.5">
                <span className="text-sm font-bold text-white">{jersey.season}</span>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <button
        onClick={() => slide("right")}
        disabled={!canGoRight || animating}
        aria-label="Next jerseys"
        className={`shrink-0 self-center flex flex-col items-center gap-1.5 transition-all duration-300
          ${canGoRight ? "opacity-100 cursor-pointer" : "opacity-0 pointer-events-none"}`}
      >
        <span className="w-9 h-9 rounded-full bg-[#172040] border border-[#1e2e50] flex items-center justify-center
          text-white hover:bg-[#1e3260] hover:border-[#2E5FBF] hover:scale-110 transition-all duration-300 shadow">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M5 2.5l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        {remainingAfter > 0 && (
          <span className="text-[10px] text-white/60 font-medium leading-tight text-center">+{remainingAfter}</span>
        )}
      </button>
    </div>
  );
}

interface TeamTimelineProps {
  team: string;
  jerseys: Jersey[];
}

export function TeamTimeline({ team, jerseys }: TeamTimelineProps) {
  const sorted = [...jerseys].sort((a, b) => Number(b.season) - Number(a.season));
  const logoSrc = TEAM_LOGOS[team];

  return (
    <div className="space-y-6">
      <div className="group/row">
        <div className="flex items-center justify-between mb-3 md:mb-4 px-1">
          <div className="flex items-center gap-3">
            {logoSrc && (
              <div className="shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-full bg-white border-2 border-[#1e2e50] shadow-md flex items-center justify-center overflow-hidden">
                <Image src={logoSrc} alt={`${team} logo`} width={60} height={60} className="w-13 h-13 md:w-15 md:h-15 object-contain scale-110" />
              </div>
            )}
            <div>
              <h2 className="text-lg md:text-xl font-extrabold text-white tracking-tight leading-tight">{team}</h2>
              <p className="text-xs text-white/60 mt-0.5">
                {sorted.length} jerseys · {sorted[sorted.length - 1]?.season}–{sorted[0]?.season}
              </p>
            </div>
          </div>
          <Link
            href={`/t20wc?team=${encodeURIComponent(team)}`}
            className="text-xs font-medium text-[#4A7FD4] hover:text-white transition-colors shrink-0"
          >
            View all →
          </Link>
        </div>
        <JerseySlider jerseys={sorted} />
      </div>
    </div>
  );
}
