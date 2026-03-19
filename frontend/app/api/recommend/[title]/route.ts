import { NextRequest, NextResponse } from "next/server";
import { getMeta, getSimilar } from "../../../lib/data";
import { fetchPoster } from "../../../lib/poster";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ title: string }> }
) {
  const { title: encoded } = await params;
  const title  = decodeURIComponent(encoded);
  const s      = req.nextUrl.searchParams;
  const n      = Math.min(parseInt(s.get("n") ?? "10"), 20);
  const sortBy = s.get("sort_by") ?? "similarity";

  const { similar } = getSimilar();
  const meta        = getMeta();
  const entries     = similar[title];

  if (!entries) {
    return NextResponse.json({ error: "Movie not found" }, { status: 404 });
  }

  let results = entries.slice(0, n).map(([simTitle, score]) => ({
    ...(meta[simTitle] ?? { title: simTitle }),
    similarity: score,
  }));

  if (sortBy === "rating")     results.sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0));
  else if (sortBy === "popularity") results.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
  else if (sortBy === "year")  results.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));

  // Fetch posters in parallel (best-effort, 5 s timeout per poster)
  const withPosters = await Promise.all(
    results.map(async (m) => ({ ...m, poster: await fetchPoster(m.title) }))
  );

  return NextResponse.json({ movie: title, recommendations: withPosters });
}
