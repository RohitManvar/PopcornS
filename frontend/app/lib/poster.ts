const OMDB_KEY = process.env.OMDB_KEY ?? "e80b3c2d";

// In-memory cache per function instance
const cache = new Map<string, string | null>();

export async function fetchPoster(title: string): Promise<string | null> {
  if (cache.has(title)) return cache.get(title)!;
  try {
    const res = await fetch(
      `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${OMDB_KEY}`,
      { next: { revalidate: 86400 }, signal: AbortSignal.timeout(5000) }
    );
    const data = await res.json();
    const poster =
      data.Response === "True" && data.Poster && data.Poster !== "N/A"
        ? data.Poster
        : null;
    cache.set(title, poster);
    return poster;
  } catch {
    return null;
  }
}
