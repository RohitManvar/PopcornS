import { NextRequest, NextResponse } from "next/server";

const TMDB_KEY = process.env.TMDB_KEY ?? "71b4aad1ba4567b150fcc24992459c45";
const cache = new Map<string, string | null>();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ title: string }> }
) {
  const { title: encoded } = await params;
  const title = decodeURIComponent(encoded);

  if (cache.has(title)) {
    return NextResponse.json({ trailer: cache.get(title) });
  }

  try {
    const search = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}`,
      { signal: AbortSignal.timeout(6000) }
    );
    const { results } = await search.json();
    if (!results?.length) {
      cache.set(title, null);
      return NextResponse.json({ trailer: null });
    }

    const videos = await fetch(
      `https://api.themoviedb.org/3/movie/${results[0].id}/videos?api_key=${TMDB_KEY}`,
      { signal: AbortSignal.timeout(6000) }
    );
    const { results: vids } = await videos.json();
    const trailer = vids?.find(
      (v: { type: string; site: string; key: string }) =>
        v.type === "Trailer" && v.site === "YouTube"
    );
    const url = trailer ? `https://www.youtube.com/embed/${trailer.key}` : null;
    cache.set(title, url);
    return NextResponse.json({ trailer: url });
  } catch {
    return NextResponse.json({ trailer: null });
  }
}
