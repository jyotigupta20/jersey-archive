import { NextRequest, NextResponse } from "next/server";
import { getJersey, indexJersey, deleteJersey } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const jersey = await getJersey(id);
    if (!jersey) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(jersey);
  } catch (error) {
    console.error("GET /api/jerseys/[id] error:", error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = req.headers.get("x-admin-password");
  if (auth !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const existing = await getJersey(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = { ...existing, ...body, id, updated_at: new Date().toISOString() };
    await indexJersey(updated);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/jerseys/[id] error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = req.headers.get("x-admin-password");
  if (auth !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await deleteJersey(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/jerseys/[id] error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
