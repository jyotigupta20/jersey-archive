import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "data", "uploads");

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Reject path traversal and any unexpected characters
  if (!/^[A-Za-z0-9._-]+$/.test(filename) || filename.includes("..")) {
    return new NextResponse("Bad filename", { status: 400 });
  }

  const filepath = path.join(UPLOAD_DIR, filename);

  try {
    const stats = await stat(filepath);
    if (!stats.isFile()) {
      return new NextResponse("Not found", { status: 404 });
    }

    const ext = path.extname(filename).toLowerCase();
    const mime = MIME[ext] ?? "application/octet-stream";
    const buf = await readFile(filepath);

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Content-Length": String(stats.size),
        // Allow Cloudflare/browser to cache, but key by filename so a
        // re-uploaded image (different UUID) won't be served stale.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
