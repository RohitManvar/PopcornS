import { NextResponse } from "next/server";
import { getMeta } from "../../lib/data";

export async function GET() {
  const meta   = getMeta();
  const movies = Object.values(meta);

  const genres    = [...new Set(movies.flatMap((m) => m.genres))].sort();
  const languages = [...new Set(movies.map((m) => m.original_language).filter(Boolean))].sort();
  const years     = movies.map((m) => m.year).filter((y) => y > 0);

  return NextResponse.json({
    genres,
    languages,
    year_min: Math.min(...years),
    year_max: Math.max(...years),
  });
}
