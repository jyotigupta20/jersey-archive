"use client";

import { AggregationBucket } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface FiltersProps {
  aggregations?: Record<string, AggregationBucket[]>;
}

export function JerseyFilters({ aggregations }: FiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(key) === value) {
      params.delete(key);
    } else {
      params.set(key, value);
      params.delete("from");
    }
    router.push(`?${params.toString()}`);
  }

  function clearAll() {
    const q = searchParams.get("q");
    router.push(q ? `?q=${encodeURIComponent(q)}` : "?");
  }

  const active = Array.from(searchParams.entries()).filter(
    ([k]) => !["q", "from", "size"].includes(k)
  );

  const sections = [
    { key: "sport", label: "Sport", buckets: aggregations?.sport || [] },
    { key: "format", label: "Format / League", buckets: aggregations?.format || [] },
    { key: "brand", label: "Brand", buckets: aggregations?.brand || [] },
    { key: "nation", label: "Nation", buckets: aggregations?.nation || [] },
    { key: "jersey_type", label: "Jersey Type", buckets: aggregations?.jersey_type || [] },
    { key: "season", label: "Season", buckets: (aggregations?.season || []).slice(0, 15) },
  ];

  const filterContent = (
    <>
      {active.length > 0 && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[#4A6FA5]">{active.length} filter(s) active</span>
          <button
            onClick={clearAll}
            className="text-xs text-[#1B3A7A] hover:text-[#2E5FBF] transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {sections.map((section) =>
        section.buckets.length === 0 ? null : (
          <div key={section.key} className="mb-4">
            <h4 className="text-xs font-semibold text-[#4A6FA5] uppercase tracking-widest mb-2">
              {section.label}
            </h4>
            <div className="space-y-1">
              {section.buckets.map((b) => {
                const isActive = searchParams.get(section.key) === b.key;
                return (
                  <button
                    key={b.key}
                    onClick={() => setFilter(section.key, b.key)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors min-h-[32px] ${
                      isActive
                        ? "bg-[#1B3A7A]/20 text-[#2E5FBF] border border-[#1B3A7A]/40"
                        : "text-[#4A6FA5] hover:bg-[#EAF0FF] hover:text-[#1B3A7A]"
                    }`}
                  >
                    <span className="truncate">{b.key}</span>
                    <span className={`ml-1 flex-shrink-0 ${isActive ? "text-[#1B3A7A]" : "text-[#7A93B5]"}`}>
                      {b.doc_count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )
      )}
    </>
  );

  return (
    <>
      {/* Mobile: collapsible filter toggle button */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#FFFFFF] border border-[#C8D5EE] rounded-xl text-sm text-[#2A4A7A] hover:text-[#0F1E3D] transition-colors w-full"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          <span>Filters</span>
          {active.length > 0 && (
            <span className="ml-1 bg-[#1B3A7A] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {active.length}
            </span>
          )}
          <svg
            className={`w-4 h-4 ml-auto transition-transform ${mobileOpen ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {mobileOpen && (
          <div className="mt-2 bg-[#FFFFFF] border border-[#C8D5EE] rounded-xl p-4">
            {filterContent}
          </div>
        )}
      </div>

      {/* Desktop: sticky sidebar */}
      <aside data-testid="jersey-filters" className="hidden md:block w-56 flex-shrink-0">
        <div className="sticky top-20 space-y-4">
          {filterContent}
        </div>
      </aside>
    </>
  );
}
