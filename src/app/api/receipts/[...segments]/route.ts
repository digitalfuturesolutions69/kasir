import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import { getSession } from "@/lib/auth";
import { resolveReceiptPath, mimeTypeForPath } from "@/lib/receipt-storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ segments: string[] }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { segments } = await params;
  if (!segments || segments.length < 2 || segments[0] !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const relativePath = segments.join("/");
  let absolutePath: string;
  try {
    absolutePath = resolveReceiptPath(relativePath);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const data = await fs.readFile(absolutePath);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": mimeTypeForPath(relativePath),
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
