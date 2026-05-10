"use client";

import { AggregationBucket } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

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

  // Body scroll lock when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [mobileOpen]);

  // Close on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

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
      {sections.map((section) =>
        section.buckets.length === 0 ? null : (
          <div key={section.key} className="mb-5">
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
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors min-h-[40px] ${
                      isActive
                        ? "bg-[#1B3A7A]/20 text-[#2E5FBF] border border-[#1B3A7A]/40"
                        : "text-[#4A6FA5] hover:bg-[#EAF0FF] hover:text-[#1B3A7A] active:bg-[#EAF0FF]"
                    }`}
                  >
                    <span className="truncate">{b.key}</span>
                    <span className={`ml-1 flex-shrink-0 text-xs ${isActive ? "text-[#1B3A7A]" : "text-[#7A93B5]"}`}>
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

  // Desktop sidebar: tighter spacing version of the same content
  const desktopContent = (
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
      {/* Mobile: trigger button */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-[#FFFFFF] border border-[#C8D5EE] rounded-xl text-sm font-medium text-[#2A4A7A] hover:text-[#0F1E3D] active:bg-[#EAF0FF] transition-colors w-full min-h-[48px]"
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
          <span className="ml-auto text-xs text-[#7A93B5]">Tap to open</span>
        </button>
      </div>

      {/* Mobile: bottom-sheet drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Filters">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            style={{ animation: "fadeIn 0.2s ease-out" }}
          />

          {/* Sheet */}
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-[#F4F6FB] rounded-t-2xl shadow-2xl flex flex-col"
            style={{ animation: "slideUp 0.25s cubic-bezier(0.22,1,0.36,1)" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1.5 rounded-full bg-[#C8D5EE]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#C8D5EE]">
              <h3 className="text-base font-bold text-[#0F1E3D]">
                Filters
                {active.length > 0 && (
                  <span className="ml-2 text-xs font-medium text-[#7A93B5]">
                    {active.length} active
                  </span>
                )}
              </h3>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close filters"
                className="w-9 h-9 flex items-center justify-center rounded-full text-[#4A6FA5] hover:bg-[#EAF0FF] active:bg-[#C8D5EE] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 overscroll-contain">
              {filterContent}
            </div>

            {/* Footer actions */}
            <div className="border-t border-[#C8D5EE] px-4 py-3 flex gap-2 bg-white">
              {active.length > 0 && (
                <button
                  onClick={() => {
                    clearAll();
                  }}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-medium text-[#4A6FA5] bg-[#EAF0FF] active:bg-[#C8D5EE] transition-colors min-h-[48px]"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={() => setMobileOpen(false)}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white bg-[#1B3A7A] active:bg-[#122B5F] transition-colors min-h-[48px]"
              >
                Show results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop: sticky sidebar */}
      <aside data-testid="jersey-filters" className="hidden md:block w-56 flex-shrink-0">
        <div className="sticky top-20 space-y-4">
          {desktopContent}
        </div>
      </aside>
    </>
  );
}
