"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewJersey() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    sport: "cricket",
    format: "IPL",
    league: "IPL",
    team: "",
    season: "",
    jersey_type: "Home",
    design_description: "",
    primary_color: "",
    brand: "",
    sponsor: "",
    nation: "",
    rating: "",
    worn_by: "",
    captain: "",
    image_urls: "",
    tournament_won: false,
    standing: "",
    significance: "",
    design_story: "",
    tags: "",
  });

  function update(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const password = sessionStorage.getItem("admin_password") || "";
    try {
      const body = {
        ...form,
        rating: parseFloat(form.rating) || 0,
        worn_by: form.worn_by.split(",").map((s) => s.trim()).filter(Boolean),
        image_urls: form.image_urls.split("\n").map((s) => s.trim()).filter(Boolean),
        tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
        standing: form.standing ? parseInt(form.standing) : null,
        notable_matches: [],
      };
      const res = await fetch("/api/jerseys", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        router.push("/admin/jerseys");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save");
      }
    } catch (e) {
      setError("Network error");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full bg-[#F4F6FB] border border-[#C8D5EE] rounded-lg px-3 py-2 text-sm text-[#0F1E3D] placeholder-gray-600 focus:outline-none focus:border-yellow-500/50";
  const labelClass = "block text-xs text-[#4A6FA5] uppercase tracking-wider mb-1";

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-[#0F1E3D] mb-6">Add New Jersey</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Sport *</label>
            <select value={form.sport} onChange={(e) => update("sport", e.target.value)} className={inputClass} required>
              <option value="cricket">Cricket</option>
              <option value="football">Football</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Format *</label>
            <select value={form.format} onChange={(e) => update("format", e.target.value)} className={inputClass}>
              <option>IPL</option>
              <option>T20</option>
              <option>ODI</option>
              <option>UCL</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Team *</label>
            <input value={form.team} onChange={(e) => update("team", e.target.value)} className={inputClass} required placeholder="e.g. Mumbai Indians" />
          </div>
          <div>
            <label className={labelClass}>Season *</label>
            <input value={form.season} onChange={(e) => update("season", e.target.value)} className={inputClass} required placeholder="e.g. 2024" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Jersey Type</label>
            <select value={form.jersey_type} onChange={(e) => update("jersey_type", e.target.value)} className={inputClass}>
              <option>Home</option>
              <option>Away</option>
              <option>Third</option>
              <option>Alternate</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Brand</label>
            <input value={form.brand} onChange={(e) => update("brand", e.target.value)} className={inputClass} placeholder="PUMA, Nike..." />
          </div>
          <div>
            <label className={labelClass}>Rating (0–5)</label>
            <input value={form.rating} onChange={(e) => update("rating", e.target.value)} className={inputClass} type="number" min="0" max="5" step="0.1" placeholder="4.5" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nation</label>
            <input value={form.nation} onChange={(e) => update("nation", e.target.value)} className={inputClass} placeholder="India" />
          </div>
          <div>
            <label className={labelClass}>Sponsor</label>
            <input value={form.sponsor} onChange={(e) => update("sponsor", e.target.value)} className={inputClass} placeholder="Dream11" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Design Description</label>
          <textarea value={form.design_description} onChange={(e) => update("design_description", e.target.value)} className={`${inputClass} h-20 resize-none`} placeholder="Blue with gold accents..." />
        </div>

        <div>
          <label className={labelClass}>Players Who Wore It (comma-separated)</label>
          <input value={form.worn_by} onChange={(e) => update("worn_by", e.target.value)} className={inputClass} placeholder="Virat Kohli, Rohit Sharma" />
        </div>

        <div>
          <label className={labelClass}>Image URLs (one per line)</label>
          <textarea value={form.image_urls} onChange={(e) => update("image_urls", e.target.value)} className={`${inputClass} h-20 resize-none`} placeholder="https://..." />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="tournament_won"
            checked={form.tournament_won}
            onChange={(e) => update("tournament_won", e.target.checked)}
            className="w-4 h-4 accent-yellow-500"
          />
          <label htmlFor="tournament_won" className="text-sm text-[#2A4A7A]">Tournament won this season</label>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="bg-[#1B3A7A] hover:bg-[#122B5F] text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50">
            {saving ? "Saving..." : "Save Jersey"}
          </button>
          <button type="button" onClick={() => router.push("/admin/jerseys")} className="bg-[#EAF0FF] border border-[#C8D5EE] text-[#2A4A7A] hover:text-[#0F1E3D] px-6 py-2.5 rounded-lg text-sm transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
