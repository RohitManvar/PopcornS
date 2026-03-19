import { NextRequest, NextResponse } from "next/server";
import { getMeta, getSimilar } from "../../lib/data";

export async function GET(req: NextRequest) {
  const s = req.nextUrl.searchParams;
  const q        = s.get("q")        ?? "";
  const genre    = s.get("genre")    ?? "";
  const language = s.get("language") ?? "";
  const yearMin  = parseInt(s.get("year_min")   ?? "0");
  const yearMax  = parseInt(s.get("year_max")   ?? "9999");
  const minRating = parseFloat(s.get("min_rating") ?? "0");

  const meta   = getMeta();
  const { titles } = getSimilar();

  const filtered = titles.filter((title) => {
    const m = meta[title];
    if (!m) return false;
    if (q        && !title.toLowerCase().includes(q.toLowerCase())) return false;
    if (genre    && !m.genres.includes(genre))                       return false;
    if (language && m.original_language !== language)                return false;
    if (yearMin  && m.year < yearMin)                                return false;
    if (yearMax < 9999 && m.year > yearMax)                         return false;
    if (minRating && m.vote_average < minRating)                    return false;
    return true;
  });

  return NextResponse.json({ movies: filtered, total: filtered.length });
}
