"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  total: number;
  by_sport: { key: string; doc_count: number }[];
  by_format: { key: string; doc_count: number }[];
  by_league: { key: string; doc_count: number }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/jerseys?size=0")
      .then((r) => r.json())
      .then((data) => {
        // Build stats from aggregations
        const aggs = data.aggregations || {};
        setStats({
          total: data.total || 0,
          by_sport: aggs.sport || [],
          by_format: aggs.format || [],
          by_league: aggs.league || [],
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0F1E3D]">Dashboard</h1>
        <p className="text-sm text-[#4A6FA5] mt-1">Overview of Jersey Archive</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-[#FFFFFF] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <>
          {/* Top stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Jerseys", value: stats.total },
              { label: "Cricket", value: stats.by_sport.find((s) => s.key === "cricket")?.doc_count || 0 },
              { label: "Football", value: stats.by_sport.find((s) => s.key === "football")?.doc_count || 0 },
              { label: "Formats", value: stats.by_format.length },
            ].map((item) => (
              <div key={item.label} className="bg-[#FFFFFF] border border-[#C8D5EE] rounded-xl p-5">
                <div className="text-3xl font-bold text-[#0F1E3D] tabular-nums">{item.value}</div>
                <div className="text-xs text-[#6B85A8] uppercase tracking-wider mt-1">{item.label}</div>
              </div>
            ))}
          </div>

          {/* By format */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#FFFFFF] border border-[#C8D5EE] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-[#2A4A7A] mb-4">By Format</h3>
              <div className="space-y-2">
                {stats.by_format.map((f) => (
                  <div key={f.key} className="flex items-center justify-between">
                    <span className="text-sm text-[#4A6FA5]">{f.key}</span>
                    <span className="text-sm font-medium text-[#0F1E3D]">{f.doc_count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#C8D5EE] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-[#2A4A7A] mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { href: "/admin/jerseys/new", label: "Add New Jersey", icon: "➕" },
                  { href: "/admin/import", label: "Import from CSV", icon: "📂" },
                  { href: "/admin/jerseys", label: "Manage Jerseys", icon: "👕" },
                  { href: "/explore", label: "View Public Site", icon: "🌐" },
                ].map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#4A6FA5] hover:bg-[#EAF0FF] hover:text-[#1B3A7A] transition-colors"
                  >
                    <span>{action.icon}</span>
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className="text-[#6B85A8]">Could not load stats.</p>
      )}
    </div>
  );
}
