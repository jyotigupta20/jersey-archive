import { NextRequest, NextResponse } from "next/server";
import { searchJerseys, indexJersey } from "@/lib/db";
import { SearchParams } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

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
    console.error("GET /api/jerseys error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Admin only
  const auth = req.headers.get("x-admin-password");
  if (auth !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const jersey = {
      ...body,
      id: body.id || uuidv4(),
      created_at: body.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await indexJersey(jersey);
    return NextResponse.json(jersey, { status: 201 });
  } catch (error) {
    console.error("POST /api/jerseys error:", error);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
