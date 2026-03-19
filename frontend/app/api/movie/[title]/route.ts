import { NextRequest, NextResponse } from "next/server";
import { getMeta } from "../../../lib/data";
import { fetchPoster } from "../../../lib/poster";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ title: string }> }
) {
  const { title: encoded } = await params;
  const title = decodeURIComponent(encoded);

  const meta = getMeta();
  const m    = meta[title];

  if (!m || !m.overview) {
    return NextResponse.json({ error: "Movie not found" }, { status: 404 });
  }

  const poster = await fetchPoster(title);
  return NextResponse.json({ ...m, poster });
}
