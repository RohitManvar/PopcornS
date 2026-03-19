import { NextRequest, NextResponse } from "next/server";
import { getMeta } from "../../lib/data";
import { fetchPoster } from "../../lib/poster";

export async function GET(req: NextRequest) {
  const s    = req.nextUrl.searchParams;
  const sort = s.get("sort") ?? "popularity";
  const n    = Math.min(parseInt(s.get("n") ?? "10"), 20);

  const meta   = getMeta();
  let   movies = Object.values(meta).filter((m) => m.vote_count >= 100);

  if (sort === "rating") {
    movies.sort((a, b) => b.vote_average - a.vote_average);
  } else {
    movies.sort((a, b) => b.popularity - a.popularity);
  }

  const top = movies.slice(0, n);
  const withPosters = await Promise.all(
    top.map(async (m) => ({ ...m, poster: await fetchPoster(m.title) }))
  );

  return NextResponse.json({ movies: withPosters });
}
