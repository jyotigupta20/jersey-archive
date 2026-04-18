import { NextRequest, NextResponse } from "next/server";
import { searchJerseys } from "@/lib/db";
import { SearchParams } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const params: SearchParams = {
      q: searchParams.get("q") || undefined,
      sport: (searchParams.get("sport") as SearchParams["sport"]) || undefined,
      format: searchParams.get("format") || undefined,
      league: searchParams.get("league") || undefined,
      team: searchParams.get("team") || undefined,
      season: searchParams.get("season") || undefined,
      brand: searchParams.get("brand") || undefined,
      jersey_type: searchParams.get("jersey_type") || undefined,
      nation: searchParams.get("nation") || undefined,
      from: parseInt(searchParams.get("from") || "0"),
      size: parseInt(searchParams.get("size") || "24"),
    };
    const result = await searchJerseys(params);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
