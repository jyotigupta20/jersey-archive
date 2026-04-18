import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = path.join(process.cwd(), "public", "images", "uploads");

export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-admin-password");
  if (auth !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const urls: string[] = [];

    for (const file of files) {
      const ext = path.extname(file.name).toLowerCase() || ".jpg";
      const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"];
      if (!allowed.includes(ext)) {
        return NextResponse.json(
          { error: `Invalid file type: ${ext}. Allowed: ${allowed.join(", ")}` },
          { status: 400 }
        );
      }

      // Max 10MB per file
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Max 10MB.` },
          { status: 400 }
        );
      }

      const filename = `${uuidv4()}${ext}`;
      const filepath = path.join(UPLOAD_DIR, filename);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filepath, buffer);

      urls.push(`/images/uploads/${filename}`);
    }

    return NextResponse.json({ urls });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
