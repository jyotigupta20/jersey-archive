"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Jersey } from "@/lib/types";

export default function AdminJerseysList() {
  const [jerseys, setJerseys] = useState<Jersey[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(0);
  const [q, setQ] = useState("");
  const size = 20;

  async function load(query = q, offset = from) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ from: String(offset), size: String(size) });
      if (query) params.set("q", query);
      const res = await fetch(`/api/jerseys?${params}`);
      const data = await res.json();
      setJerseys(data.hits || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete(id: string) {
    if (!confirm("Delete this jersey?")) return;
    const password = sessionStorage.getItem("admin_password") || "";
    await fetch(`/api/jerseys/${id}`, {
      method: "DELETE",
      headers: { "x-admin-password": password },
    });
    load();
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-[#0F1E3D]">Jerseys</h1>
          <p className="text-sm text-[#4A6FA5] mt-1">{total} total</p>
        </div>
        <Link
          href="/admin/jerseys/new"
          className="shrink-0 bg-[#1B3A7A] hover:bg-[#122B5F] text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors min-h-[44px] flex items-center"
        >
          + Add
        </Link>
      </div>

      {/* Search */}
      <div className="flex gap-2 md:gap-3 mb-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { setFrom(0); load(q, 0); } }}
          placeholder="Search jerseys..."
          className="flex-1 min-w-0 bg-[#FFFFFF] border border-[#C8D5EE] rounded-lg px-3 py-2.5 text-sm text-[#0F1E3D] placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
        />
        <button
          onClick={() => { setFrom(0); load(q, 0); }}
          className="shrink-0 bg-[#EAF0FF] border border-[#C8D5EE] hover:border-[#A8BDD8] px-4 py-2.5 rounded-lg text-sm text-[#2A4A7A] hover:text-[#0F1E3D] transition-colors min-h-[44px]"
        >
          Search
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-[#FFFFFF] rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-[#FFFFFF] border border-[#C8D5EE] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-[#C8D5EE] text-[#4A6FA5] text-xs uppercase tracking-wider">
                <th className="py-3 px-4 text-left">Team</th>
                <th className="py-3 px-4 text-left">Season</th>
                <th className="py-3 px-4 text-left">Format</th>
                <th className="py-3 px-4 text-left">Sport</th>
                <th className="py-3 px-4 text-left">Rating</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jerseys.map((jersey) => (
                <tr key={jersey.id} className="border-b border-[#C8D5EE] hover:bg-[#EAF0FF] transition-colors">
                  <td className="py-3 px-4 text-[#0F1E3D] font-medium">{jersey.team}</td>
                  <td className="py-3 px-4 text-[#4A6FA5]">{jersey.season}</td>
                  <td className="py-3 px-4 text-[#4A6FA5]">{jersey.format}</td>
                  <td className="py-3 px-4 text-[#6B85A8]">{jersey.sport}</td>
                  <td className="py-3 px-4 text-[#2E5FBF]">{jersey.rating || "—"}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/${jersey.sport}/${jersey.id}`}
                        className="text-xs text-[#4A6FA5] hover:text-[#0F1E3D] transition-colors"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/jerseys/${jersey.id}/edit`}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(jersey.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#C8D5EE]">
            <span className="text-xs text-[#6B85A8]">
              {from + 1}–{Math.min(from + size, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => { const newFrom = Math.max(0, from - size); setFrom(newFrom); load(q, newFrom); }}
                disabled={from === 0}
                className="px-3 py-1 text-xs bg-[#EAF0FF] border border-[#C8D5EE] rounded text-[#4A6FA5] hover:text-[#0F1E3D] disabled:opacity-30 transition-colors"
              >
                Prev
              </button>
              <button
                onClick={() => { const newFrom = from + size; setFrom(newFrom); load(q, newFrom); }}
                disabled={from + size >= total}
                className="px-3 py-1 text-xs bg-[#EAF0FF] border border-[#C8D5EE] rounded text-[#4A6FA5] hover:text-[#0F1E3D] disabled:opacity-30 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
