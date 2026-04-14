"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AggregationBucket } from "@/lib/types";

interface FilterBarProps {
  aggregations?: Record<string, AggregationBucket[]>;
  /** If set, these params are always added to every URL push (e.g. sport=cricket) */
  baseParams?: Record<string, string>;
}

export function FilterBar({ aggregations, baseParams = {} }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function buildParams(overrides: Record<string, string | null>) {
    const params = new URLSearchParams();
    // Carry forward base params (e.g. sport=cricket)
    for (const [k, v] of Object.entries(baseParams)) {
      params.set(k, v);
    }
    // Carry forward existing filter params (except from/size)
    for (const [k, v] of searchParams.entries()) {
      if (!["from", "size"].includes(k)) params.set(k, v);
    }
    // Apply overrides
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null) params.delete(k);
      else params.set(k, v);
    }
    // Reset pagination on filter change
    params.delete("from");
    return params.toString();
  }

  function setFilter(key: string, value: string) {
    const current = searchParams.get(key);
    const qs = current === value
      ? buildParams({ [key]: null })   // toggle off
      : buildParams({ [key]: value });
    router.push(`?${qs}`);
  }

  function clearAll() {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(baseParams)) params.set(k, v);
    router.push(`?${params.toString()}`);
  }

  const seasons = (aggregations?.season ?? []).filter((b) => b.key && b.key !== "");
  const teams = (aggregations?.team ?? []).filter((b) => b.key && b.key !== "");

  const activeSeason = searchParams.get("season") ?? "";
  const activeTeam = searchParams.get("team") ?? "";

  const hasActiveFilters = activeSeason || activeTeam ||
    searchParams.get("brand") || searchParams.get("jersey_type") || searchParams.get("nation");

  return (
    <div className="bg-[#FFFFFF] border-b border-[#C8D5EE]">
      <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center gap-2 md:gap-3 overflow-x-auto no-scrollbar pb-1 md:pb-0 md:flex-wrap">

          {/* Season dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs text-[#6B85A8] uppercase tracking-widest whitespace-nowrap hidden sm:inline">
              Year
            </label>
            <select
              value={activeSeason}
              onChange={(e) => setFilter("season", e.target.value)}
              className="bg-[#F4F6FB] border border-[#C8D5EE] text-sm text-[#0F1E3D] rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-500/50 cursor-pointer min-w-[100px] md:min-w-[110px] min-h-[36px]"
            >
              <option value="">All Years</option>
              {seasons.map((b) => (
                <option key={b.key} value={b.key}>
                  {b.key} ({b.doc_count})
                </option>
              ))}
            </select>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-[#C8D5EE] shrink-0 hidden sm:block" />

          {/* Team dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs text-[#6B85A8] uppercase tracking-widest whitespace-nowrap hidden sm:inline">
              Team
            </label>
            <select
              value={activeTeam}
              onChange={(e) => setFilter("team", e.target.value)}
              className="bg-[#F4F6FB] border border-[#C8D5EE] text-sm text-[#0F1E3D] rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-500/50 cursor-pointer min-w-[140px] md:min-w-[200px] min-h-[36px]"
            >
              <option value="">All Teams</option>
              {teams.map((b) => (
                <option key={b.key} value={b.key}>
                  {b.key} ({b.doc_count})
                </option>
              ))}
            </select>
          </div>

          {/* Active filter pills */}
          {activeSeason && (
            <span className="inline-flex items-center gap-1.5 bg-[#1B3A7A]/10 border border-[#1B3A7A]/30 text-[#2E5FBF] text-xs px-2.5 py-1 rounded-full shrink-0">
              {activeSeason}
              <button
                onClick={() => setFilter("season", activeSeason)}
                className="hover:text-yellow-200 leading-none min-w-[14px] min-h-[14px] flex items-center justify-center"
                aria-label="Remove year filter"
              >
                ×
              </button>
            </span>
          )}
          {activeTeam && (
            <span className="inline-flex items-center gap-1.5 bg-[#1B3A7A]/10 border border-[#1B3A7A]/30 text-[#2E5FBF] text-xs px-2.5 py-1 rounded-full shrink-0 max-w-[140px]">
              <span className="truncate">{activeTeam}</span>
              <button
                onClick={() => setFilter("team", activeTeam)}
                className="hover:text-yellow-200 leading-none min-w-[14px] min-h-[14px] flex items-center justify-center flex-shrink-0"
                aria-label="Remove team filter"
              >
                ×
              </button>
            </span>
          )}

          {/* Clear all */}
          {hasActiveFilters && (
            <>
              <div className="h-6 w-px bg-[#C8D5EE] shrink-0 hidden sm:block" />
              <button
                onClick={clearAll}
                className="text-xs text-[#4A6FA5] hover:text-[#0F1E3D] transition-colors shrink-0 py-1 px-1"
              >
                Clear all
              </button>
            </>
          )}

          {/* Result count pushed to the right — desktop only */}
          <div className="ml-auto text-xs text-[#6B85A8] hidden md:block shrink-0">
            {activeSeason || activeTeam ? "Filtered" : "Showing all"}
          </div>
        </div>
      </div>
    </div>
  );
}
