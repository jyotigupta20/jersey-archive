import { NextRequest, NextResponse } from "next/server";
import { searchSuggestions } from "@/lib/elasticsearch";

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q") || "";
  if (q.length < 2) return NextResponse.json({ suggestions: [] });
  try {
    const suggestions = await searchSuggestions(q);
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
