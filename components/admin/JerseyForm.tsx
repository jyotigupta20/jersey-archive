"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Jersey } from "@/lib/types";

// ── Sport → League mapping ──────────────────────────────────────────────────

const SPORT_LEAGUES: Record<string, { label: string; format: string; league: string }[]> = {
  cricket: [
    { label: "IPL", format: "IPL", league: "IPL" },
    { label: "T20 World Cup", format: "T20", league: "T20 World Cup" },
    { label: "ODI World Cup", format: "ODI", league: "ODI World Cup" },
    { label: "Champions Trophy", format: "ODI", league: "Champions Trophy" },
    { label: "The Ashes", format: "Test", league: "The Ashes" },
    { label: "BBL (Big Bash)", format: "T20", league: "BBL" },
    { label: "CPL (Caribbean Premier)", format: "T20", league: "CPL" },
    { label: "PSL (Pakistan Super)", format: "T20", league: "PSL" },
    { label: "SA20", format: "T20", league: "SA20" },
    { label: "Other Cricket", format: "Other", league: "" },
  ],
  football: [
    { label: "FIFA World Cup", format: "FIFA", league: "FIFA World Cup" },
    { label: "UEFA Champions League", format: "UCL", league: "UEFA Champions League" },
    { label: "UEFA Euro", format: "Euro", league: "UEFA Euro" },
    { label: "Premier League", format: "Premier League", league: "Premier League" },
    { label: "La Liga", format: "La Liga", league: "La Liga" },
    { label: "Serie A", format: "Serie A", league: "Serie A" },
    { label: "Bundesliga", format: "Bundesliga", league: "Bundesliga" },
    { label: "Ligue 1", format: "Ligue 1", league: "Ligue 1" },
    { label: "Copa America", format: "Copa America", league: "Copa America" },
    { label: "Africa Cup of Nations", format: "AFCON", league: "AFCON" },
    { label: "MLS", format: "MLS", league: "MLS" },
    { label: "Other Football", format: "Other", league: "" },
  ],
};

const JERSEY_TYPES = ["Home", "Away", "Third", "Alternate", "Special", "Retro", "Training"];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1990 + 2 }, (_, i) => String(CURRENT_YEAR + 1 - i));

// ── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  sport: string;
  leagueIndex: number;
  league: string;
  format: string;
  team: string;
  season: string;
  jersey_type: string;
  design_description: string;
  primary_color: string;
  brand: string;
  sponsor: string;
  nation: string;
  rating: string;
  worn_by: string;
  captain: string;
  image_urls: string[];
  tournament_won: boolean;
  standing: string;
  significance: string;
  design_story: string;
  tags: string;
  team_logo_url: string;
}

interface JerseyFormProps {
  jersey?: Jersey | null;
  mode: "create" | "edit";
}

function initialForm(jersey?: Jersey | null): FormData {
  if (jersey) {
    // Find the matching league index
    const leagues = SPORT_LEAGUES[jersey.sport] || SPORT_LEAGUES.cricket;
    let leagueIndex = leagues.findIndex(
      (l) => l.league === jersey.league || l.format === jersey.format
    );
    if (leagueIndex === -1) leagueIndex = leagues.length - 1; // "Other"

    return {
      sport: jersey.sport || "cricket",
      leagueIndex,
      league: jersey.league || "",
      format: jersey.format || "",
      team: jersey.team || "",
      season: jersey.season || "",
      jersey_type: jersey.jersey_type || "Home",
      design_description: jersey.design_description || "",
      primary_color: jersey.primary_color || "",
      brand: jersey.brand || "",
      sponsor: jersey.sponsor || "",
      nation: jersey.nation || "",
      rating: jersey.rating ? String(jersey.rating) : "",
      worn_by: (jersey.worn_by || []).join(", "),
      captain: jersey.captain || "",
      image_urls: jersey.image_urls || [],
      tournament_won: jersey.tournament_won || false,
      standing: jersey.standing ? String(jersey.standing) : "",
      significance: jersey.significance || "",
      design_story: jersey.design_story || "",
      tags: (jersey.tags || []).join(", "),
      team_logo_url: jersey.team_logo_url || "",
    };
  }

  return {
    sport: "cricket",
    leagueIndex: 0,
    league: "IPL",
    format: "IPL",
    team: "",
    season: String(CURRENT_YEAR),
    jersey_type: "Home",
    design_description: "",
    primary_color: "",
    brand: "",
    sponsor: "",
    nation: "",
    rating: "",
    worn_by: "",
    captain: "",
    image_urls: [],
    tournament_won: false,
    standing: "",
    significance: "",
    design_story: "",
    tags: "",
    team_logo_url: "",
  };
}

// ── Component ────────────────────────────────────────────────────────────────

export default function JerseyForm({ jersey, mode }: JerseyFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormData>(() => initialForm(jersey));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // When jersey prop changes (edit page load), reset form
  useEffect(() => {
    if (jersey) setForm(initialForm(jersey));
  }, [jersey]);

  const leagues = SPORT_LEAGUES[form.sport] || [];

  function update(key: keyof FormData, value: string | boolean | number | string[]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSportChange(sport: string) {
    const newLeagues = SPORT_LEAGUES[sport] || [];
    setForm((f) => ({
      ...f,
      sport,
      leagueIndex: 0,
      format: newLeagues[0]?.format || "",
      league: newLeagues[0]?.league || "",
    }));
  }

  function handleLeagueChange(index: number) {
    const selected = leagues[index];
    if (!selected) return;
    setForm((f) => ({
      ...f,
      leagueIndex: index,
      format: selected.format,
      league: selected.league || f.league,
    }));
  }

  // ── Image Upload ───────────────────────────────────────────────────────────

  async function handleImageUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");

    const password = sessionStorage.getItem("admin_password") || "";
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "x-admin-password": password },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setForm((f) => ({ ...f, image_urls: [...f.image_urls, ...data.urls] }));
      } else {
        setError(data.error || "Upload failed");
      }
    } catch {
      setError("Upload failed — network error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage(index: number) {
    setForm((f) => ({ ...f, image_urls: f.image_urls.filter((_, i) => i !== index) }));
  }

  function addExternalUrl() {
    const url = prompt("Enter image URL:");
    if (url?.trim()) {
      setForm((f) => ({ ...f, image_urls: [...f.image_urls, url.trim()] }));
    }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const password = sessionStorage.getItem("admin_password") || "";

    // Resolve "Other" league — use custom value from the league text input
    const selectedLeague = leagues[form.leagueIndex];
    const isOther = selectedLeague?.league === "";

    const body = {
      sport: form.sport,
      format: isOther ? form.format : selectedLeague.format,
      league: isOther ? form.league : selectedLeague.league,
      team: form.team,
      team_logo_url: form.team_logo_url,
      season: form.season,
      jersey_type: form.jersey_type,
      design_description: form.design_description,
      primary_color: form.primary_color,
      brand: form.brand,
      sponsor: form.sponsor,
      nation: form.nation,
      rating: parseFloat(form.rating) || 0,
      worn_by: form.worn_by.split(",").map((s) => s.trim()).filter(Boolean),
      captain: form.captain,
      image_urls: form.image_urls,
      tournament_won: form.tournament_won,
      standing: form.standing ? parseInt(form.standing) : null,
      significance: form.significance,
      design_story: form.design_story,
      notable_matches: [],
      tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
    };

    try {
      const url = mode === "edit" ? `/api/jerseys/${jersey?.id}` : "/api/jerseys";
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        if (mode === "create") {
          setSuccess("Jersey created!");
          setTimeout(() => router.push("/admin/jerseys"), 800);
        } else {
          setSuccess("Changes saved!");
          setTimeout(() => setSuccess(""), 3000);
        }
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

  // ── Styles ─────────────────────────────────────────────────────────────────

  const inputClass =
    "w-full bg-[#F4F6FB] border border-[#C8D5EE] rounded-lg px-3 py-2 text-sm text-[#0F1E3D] placeholder-gray-500 focus:outline-none focus:border-[#2E5FBF] transition-colors";
  const labelClass = "block text-xs text-[#4A6FA5] uppercase tracking-wider mb-1";
  const sectionClass = "bg-white border border-[#C8D5EE] rounded-xl p-5 space-y-4";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Section 1: Sport & League ────────────────────────────────────── */}
      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-[#2A4A7A] border-b border-[#C8D5EE] pb-2">
          Sport & Competition
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Sport *</label>
            <select
              value={form.sport}
              onChange={(e) => handleSportChange(e.target.value)}
              className={inputClass}
              required
            >
              <option value="cricket">Cricket</option>
              <option value="football">Football</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>League / Tournament *</label>
            <select
              value={form.leagueIndex}
              onChange={(e) => handleLeagueChange(Number(e.target.value))}
              className={inputClass}
              required
            >
              {leagues.map((l, i) => (
                <option key={i} value={i}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Show custom league/format fields when "Other" is selected */}
        {leagues[form.leagueIndex]?.league === "" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Custom League Name *</label>
              <input
                value={form.league}
                onChange={(e) => update("league", e.target.value)}
                className={inputClass}
                required
                placeholder="e.g. Indian Super League"
              />
            </div>
            <div>
              <label className={labelClass}>Format Code *</label>
              <input
                value={form.format}
                onChange={(e) => update("format", e.target.value)}
                className={inputClass}
                required
                placeholder="e.g. ISL"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Section 2: Team Info ──────────────────────────────────────── */}
      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-[#2A4A7A] border-b border-[#C8D5EE] pb-2">
          Team & Season
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Team / Country *</label>
            <input
              value={form.team}
              onChange={(e) => update("team", e.target.value)}
              className={inputClass}
              required
              placeholder="e.g. Mumbai Indians, Brazil"
            />
          </div>
          <div>
            <label className={labelClass}>Season / Year *</label>
            <select
              value={form.season}
              onChange={(e) => update("season", e.target.value)}
              className={inputClass}
              required
            >
              <option value="">Select year</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Jersey Type</label>
            <select
              value={form.jersey_type}
              onChange={(e) => update("jersey_type", e.target.value)}
              className={inputClass}
            >
              {JERSEY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Nation</label>
            <input
              value={form.nation}
              onChange={(e) => update("nation", e.target.value)}
              className={inputClass}
              placeholder="India, England..."
            />
          </div>
          <div>
            <label className={labelClass}>Primary Color</label>
            <input
              value={form.primary_color}
              onChange={(e) => update("primary_color", e.target.value)}
              className={inputClass}
              placeholder="Blue, Red/White..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Brand</label>
            <input
              value={form.brand}
              onChange={(e) => update("brand", e.target.value)}
              className={inputClass}
              placeholder="Nike, Adidas, PUMA..."
            />
          </div>
          <div>
            <label className={labelClass}>Sponsor</label>
            <input
              value={form.sponsor}
              onChange={(e) => update("sponsor", e.target.value)}
              className={inputClass}
              placeholder="Dream11, Emirates..."
            />
          </div>
          <div>
            <label className={labelClass}>Rating (0–5)</label>
            <input
              value={form.rating}
              onChange={(e) => update("rating", e.target.value)}
              className={inputClass}
              type="number"
              min="0"
              max="5"
              step="0.1"
              placeholder="4.5"
            />
          </div>
        </div>
      </div>

      {/* ── Section 3: Images ─────────────────────────────────────────── */}
      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-[#2A4A7A] border-b border-[#C8D5EE] pb-2">
          Jersey Images
        </h2>

        {/* Current images */}
        {form.image_urls.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {form.image_urls.map((url, i) => (
              <div key={i} className="relative group">
                <div className="aspect-[3/4] rounded-lg overflow-hidden border border-[#C8D5EE] bg-[#F4F6FB]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Jersey image ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "";
                      (e.target as HTMLImageElement).alt = "Failed to load";
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Remove image"
                >
                  x
                </button>
                <p className="text-[10px] text-[#6B85A8] mt-1 truncate" title={url}>{url}</p>
              </div>
            ))}
          </div>
        )}

        {/* Upload area */}
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
            uploading
              ? "border-[#2E5FBF] bg-[#2E5FBF]/5"
              : "border-[#C8D5EE] hover:border-[#A8BDD8]"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleImageUpload(e.target.files)}
            className="hidden"
            id="jersey-image-upload"
          />
          <label htmlFor="jersey-image-upload" className="cursor-pointer block">
            {uploading ? (
              <div className="py-2">
                <div className="w-6 h-6 border-2 border-[#2E5FBF] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-[#2E5FBF]">Uploading...</p>
              </div>
            ) : (
              <div className="py-2">
                <svg
                  className="w-8 h-8 text-[#7A93B5] mx-auto mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm text-[#4A6FA5]">
                  Click to upload images{" "}
                  <span className="text-[#7A93B5]">(JPG, PNG, WebP — max 10MB each)</span>
                </p>
              </div>
            )}
          </label>
        </div>

        <button
          type="button"
          onClick={addExternalUrl}
          className="text-xs text-[#2E5FBF] hover:text-[#1B3A7A] transition-colors"
        >
          + Add image by URL instead
        </button>

        {/* Team logo URL */}
        <div>
          <label className={labelClass}>Team Logo URL (optional)</label>
          <input
            value={form.team_logo_url}
            onChange={(e) => update("team_logo_url", e.target.value)}
            className={inputClass}
            placeholder="https://... or /logos/ipl/csk.png"
          />
        </div>
      </div>

      {/* ── Section 4: Players & Details ──────────────────────────────── */}
      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-[#2A4A7A] border-b border-[#C8D5EE] pb-2">
          Players & Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Captain</label>
            <input
              value={form.captain}
              onChange={(e) => update("captain", e.target.value)}
              className={inputClass}
              placeholder="Virat Kohli"
            />
          </div>
          <div>
            <label className={labelClass}>Standing / Position</label>
            <input
              value={form.standing}
              onChange={(e) => update("standing", e.target.value)}
              className={inputClass}
              type="number"
              min="1"
              placeholder="1"
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Players Who Wore It (comma-separated)</label>
          <input
            value={form.worn_by}
            onChange={(e) => update("worn_by", e.target.value)}
            className={inputClass}
            placeholder="Virat Kohli, Rohit Sharma, Jasprit Bumrah"
          />
        </div>

        <div>
          <label className={labelClass}>Design Description</label>
          <textarea
            value={form.design_description}
            onChange={(e) => update("design_description", e.target.value)}
            className={`${inputClass} h-20 resize-none`}
            placeholder="Blue base with gold chevron pattern..."
          />
        </div>

        <div>
          <label className={labelClass}>Design Story</label>
          <textarea
            value={form.design_story}
            onChange={(e) => update("design_story", e.target.value)}
            className={`${inputClass} h-20 resize-none`}
            placeholder="The story behind this jersey design..."
          />
        </div>

        <div>
          <label className={labelClass}>Significance</label>
          <textarea
            value={form.significance}
            onChange={(e) => update("significance", e.target.value)}
            className={`${inputClass} h-16 resize-none`}
            placeholder="Why this jersey matters..."
          />
        </div>

        <div>
          <label className={labelClass}>Tags (comma-separated)</label>
          <input
            value={form.tags}
            onChange={(e) => update("tags", e.target.value)}
            className={inputClass}
            placeholder="iconic, champion, retro, fan-favorite"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="tournament_won"
            checked={form.tournament_won}
            onChange={(e) => update("tournament_won", e.target.checked)}
            className="w-4 h-4 accent-[#1B3A7A]"
          />
          <label htmlFor="tournament_won" className="text-sm text-[#2A4A7A]">
            Tournament won this season
          </label>
        </div>
      </div>

      {/* ── Actions ───────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
          <p className="text-sm text-emerald-600">{success}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sticky bottom-0 sm:static bg-[#F4F6FB] sm:bg-transparent -mx-4 sm:mx-0 px-4 sm:px-0 py-3 sm:py-0 border-t sm:border-0 border-[#C8D5EE]">
        <button
          type="submit"
          disabled={saving || uploading}
          className="bg-[#1B3A7A] hover:bg-[#122B5F] text-white font-semibold px-6 py-3 rounded-lg text-sm transition-colors disabled:opacity-50 min-h-[48px] order-1 sm:order-none"
        >
          {saving ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Jersey"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/jerseys")}
          className="bg-[#EAF0FF] border border-[#C8D5EE] text-[#2A4A7A] hover:text-[#0F1E3D] px-6 py-3 rounded-lg text-sm transition-colors min-h-[48px] order-2 sm:order-none"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
