export function parseRating(raw: string | number | undefined): number {
  if (!raw) return 0;
  if (typeof raw === "number") return raw;
  const match = String(raw).match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

export function parseWornBy(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseGDriveUrl(url: string | undefined): string {
  if (!url) return "";
  return url.trim();
}

export function parseTournamentWon(raw: string | boolean | undefined): boolean {
  if (typeof raw === "boolean") return raw;
  if (!raw) return false;
  const s = String(raw).toLowerCase().trim();
  return s === "yes" || s === "true" || s === "1" || s === "won";
}

export function parseStanding(raw: string | number | undefined): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = parseInt(String(raw));
  return isNaN(n) ? null : n;
}

export function colorToClass(color: string): string {
  const colorMap: Record<string, string> = {
    red: "text-red-400",
    blue: "text-blue-400",
    green: "text-green-400",
    yellow: "text-yellow-400",
    orange: "text-orange-400",
    purple: "text-purple-400",
    white: "text-gray-100",
    black: "text-gray-400",
    gold: "text-yellow-500",
    pink: "text-pink-400",
    teal: "text-teal-400",
    cyan: "text-cyan-400",
  };
  const key = color?.toLowerCase().split("/")[0].trim();
  return colorMap[key] || "text-gray-300";
}

export function colorToGlow(color: string): string {
  const glowMap: Record<string, string> = {
    red: "shadow-red-500/30",
    blue: "shadow-blue-500/30",
    green: "shadow-green-500/30",
    yellow: "shadow-yellow-500/30",
    orange: "shadow-orange-500/30",
    purple: "shadow-purple-500/30",
    gold: "shadow-yellow-500/30",
    teal: "shadow-teal-500/30",
    cyan: "shadow-cyan-500/30",
  };
  const key = color?.toLowerCase().split("/")[0].trim();
  return glowMap[key] || "shadow-blue-500/20";
}

export function formatSeason(season: string): string {
  return season || "Unknown";
}

export function ratingToStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
