"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Jersey } from "@/lib/types";

export default function EditJersey() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [jersey, setJersey] = useState<Jersey | null>(null);
  const [form, setForm] = useState<Record<string, string | boolean>>({});

  useEffect(() => {
    fetch(`/api/jerseys/${id}`)
      .then((r) => r.json())
      .then((data: Jersey) => {
        setJersey(data);
        setForm({
          team: data.team || "",
          season: data.season || "",
          sport: data.sport || "cricket",
          format: data.format || "IPL",
          jersey_type: data.jersey_type || "Home",
          brand: data.brand || "",
          sponsor: data.sponsor || "",
          nation: data.nation || "",
          rating: String(data.rating || ""),
          design_description: data.design_description || "",
          primary_color: data.primary_color || "",
          worn_by: (data.worn_by || []).join(", "),
          captain: data.captain || "",
          image_urls: (data.image_urls || []).join("\n"),
          tournament_won: data.tournament_won || false,
          standing: String(data.standing || ""),
          significance: data.significance || "",
          design_story: data.design_story || "",
          tags: (data.tags || []).join(", "),
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

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
        ...jersey,
        ...form,
        rating: parseFloat(form.rating as string) || 0,
        worn_by: (form.worn_by as string).split(",").map((s) => s.trim()).filter(Boolean),
        image_urls: (form.image_urls as string).split("\n").map((s) => s.trim()).filter(Boolean),
        tags: (form.tags as string).split(",").map((s) => s.trim()).filter(Boolean),
        standing: form.standing ? parseInt(form.standing as string) : null,
      };
      const res = await fetch(`/api/jerseys/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        router.push("/admin/jerseys");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full bg-[#F4F6FB] border border-[#C8D5EE] rounded-lg px-3 py-2 text-sm text-[#0F1E3D] placeholder-gray-600 focus:outline-none focus:border-yellow-500/50";
  const labelClass = "block text-xs text-[#4A6FA5] uppercase tracking-wider mb-1";

  if (loading) return <div className="p-8 text-[#4A6FA5]">Loading...</div>;
  if (!jersey) return <div className="p-8 text-red-400">Jersey not found</div>;

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-[#0F1E3D] mb-1">Edit Jersey</h1>
      <p className="text-sm text-[#4A6FA5] mb-6">{jersey.team} · {jersey.season}</p>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Team</label>
            <input value={form.team as string} onChange={(e) => update("team", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Season</label>
            <input value={form.season as string} onChange={(e) => update("season", e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Brand</label>
            <input value={form.brand as string} onChange={(e) => update("brand", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Sponsor</label>
            <input value={form.sponsor as string} onChange={(e) => update("sponsor", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Rating</label>
            <input value={form.rating as string} onChange={(e) => update("rating", e.target.value)} className={inputClass} type="number" min="0" max="5" step="0.1" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Design Description</label>
          <textarea value={form.design_description as string} onChange={(e) => update("design_description", e.target.value)} className={`${inputClass} h-20 resize-none`} />
        </div>

        <div>
          <label className={labelClass}>The Story Behind the Design</label>
          <textarea value={form.design_story as string} onChange={(e) => update("design_story", e.target.value)} className={`${inputClass} h-24 resize-none`} placeholder="Tell the story of this jersey design..." />
        </div>

        <div>
          <label className={labelClass}>Significance</label>
          <textarea value={form.significance as string} onChange={(e) => update("significance", e.target.value)} className={`${inputClass} h-20 resize-none`} placeholder="Why this jersey matters..." />
        </div>

        <div>
          <label className={labelClass}>Players (comma-separated)</label>
          <input value={form.worn_by as string} onChange={(e) => update("worn_by", e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Image URLs (one per line)</label>
          <textarea value={form.image_urls as string} onChange={(e) => update("image_urls", e.target.value)} className={`${inputClass} h-20 resize-none`} />
        </div>

        <div>
          <label className={labelClass}>Tags (comma-separated)</label>
          <input value={form.tags as string} onChange={(e) => update("tags", e.target.value)} className={inputClass} placeholder="iconic, champion, retro" />
        </div>

        <div className="flex items-center gap-3">
          <input type="checkbox" id="tournament_won" checked={form.tournament_won as boolean} onChange={(e) => update("tournament_won", e.target.checked)} className="w-4 h-4 accent-yellow-500" />
          <label htmlFor="tournament_won" className="text-sm text-[#2A4A7A]">Tournament won</label>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="bg-[#1B3A7A] hover:bg-[#122B5F] text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button type="button" onClick={() => router.push("/admin/jerseys")} className="bg-[#EAF0FF] border border-[#C8D5EE] text-[#2A4A7A] hover:text-[#0F1E3D] px-6 py-2.5 rounded-lg text-sm transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
