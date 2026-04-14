import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { v4 as uuidv4 } from "uuid";
import { indexJersey } from "@/lib/elasticsearch";
import { Jersey } from "@/lib/types";
import {
  parseRating,
  parseWornBy,
  parseGDriveUrl,
  parseTournamentWon,
  parseStanding,
} from "@/lib/utils";

function autoTags(jersey: Partial<Jersey>): string[] {
  const tags: string[] = [];
  if (jersey.tournament_won) tags.push("championship", "winner");
  if (jersey.standing === 1) tags.push("champions");
  if ((jersey.rating ?? 0) >= 4.5) tags.push("iconic");
  if ((jersey.rating ?? 0) >= 4.0) tags.push("fan-favorite");
  return [...new Set(tags)];
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-admin-password");
  if (auth !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const format = formData.get("format") as string;

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const text = await file.text();
    const rows = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }) as Record<string, string>[];

    const jerseys: Jersey[] = [];

    for (const row of rows) {
      const team = row["Team"]?.trim();
      if (!team) continue;

      const jersey: Jersey = {
        id: uuidv4(),
        sport: format === "UCL" ? "football" : "cricket",
        format: format as Jersey["format"],
        league: row["League"] || format,
        team,
        team_logo_url: parseGDriveUrl(row["Team Logo"] || row["logo without BG"]),
        season: row["Season"]?.trim() || "",
        jersey_type: row["Jersey Type"]?.trim() || "Home",
        design_description: row["Design"]?.trim() || "",
        primary_color: (row["Color"] || row["Colour"])?.trim() || "",
        brand: row["Brand"]?.trim() || "",
        sponsor: row["Sponsor"]?.trim() || "",
        nation: (row["Nation"] || row["Host Nation"])?.trim() || "",
        rating: parseRating(row["Rating"]),
        worn_by: parseWornBy(row["Worn By Player"]),
        captain: (row["Captain name"] || "").trim(),
        image_urls: [row["Image 1"], row["Image 2"], row["Herysey Image"]]
          .map((u) => parseGDriveUrl(u))
          .filter(Boolean),
        tournament_won: parseTournamentWon(row["Tournament won"]),
        standing: parseStanding(row["Standing"] || row[" Standings"]),
        significance: "",
        design_story: "",
        notable_matches: [],
        tags: [],
        image_source: "gdrive_pending",
        cricket_board: row["Cricket Board"]?.trim(),
        host_nation: row["Host Nation"]?.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      jersey.tags = autoTags(jersey);
      jerseys.push(jersey);
    }

    // Index all
    for (const jersey of jerseys) {
      await indexJersey(jersey);
    }

    return NextResponse.json({ imported: jerseys.length, jerseys: jerseys.slice(0, 5) });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
