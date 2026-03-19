"use client";

import { use, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, Star, Calendar, Clock, Globe,
  Bookmark, BookmarkCheck, Loader2, Share2, Play,
} from "lucide-react";
import { fetchMovie, fetchRecommendations, fetchTrailer } from "../../lib/api";
import MovieCard from "../../components/MovieCard";
import TrailerModal from "../../components/TrailerModal";
import { useToast } from "../../components/Toast";

const RECENTLY_VIEWED_KEY = "popcorn-recently-viewed";

export default function MoviePage({ params }: { params: Promise<{ title: string }> }) {
  const { title: encodedTitle } = use(params);
  const title = decodeURIComponent(encodedTitle);

  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [trailerLoading, setTrailerLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem("cinematic-watchlist");
    if (saved) setWatchlist(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("cinematic-watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  function toggleWatchlist(t: string) {
    const inList = watchlist.includes(t);
    setWatchlist((prev) => inList ? prev.filter((x) => x !== t) : [...prev, t]);
    showToast(
      inList ? `Removed "${t}" from watchlist` : `Added "${t}" to watchlist`,
      inList ? "info" : "success"
    );
  }

  const { data: movie, isLoading, isError } = useQuery({
    queryKey: ["movie", title],
    queryFn: () => fetchMovie(title),
  });

  const { data: recsData } = useQuery({
    queryKey: ["recommendations", title, 10, "similarity"],
    queryFn: () => fetchRecommendations(title, 10, "similarity"),
    enabled: !!movie,
  });

  // Track recently viewed when movie loads
  useEffect(() => {
    if (!movie) return;
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    const prev: { title: string; poster?: string | null }[] = raw ? JSON.parse(raw) : [];
    const filtered = prev.filter((r) => r.title !== movie.title);
    const next = [{ title: movie.title, poster: movie.poster }, ...filtered].slice(0, 10);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
  }, [movie]);

  async function openTrailer() {
    if (trailerUrl) { setShowTrailer(true); return; }
    setTrailerLoading(true);
    try {
      const data = await fetchTrailer(title);
      if (data.trailer) {
        setTrailerUrl(data.trailer);
        setShowTrailer(true);
      } else {
        showToast("No trailer found for this movie", "info");
      }
    } catch {
      showToast("Failed to load trailer", "error");
    } finally {
      setTrailerLoading(false);
    }
  }

  async function handleShare() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied to clipboard!", "success");
    } catch {
      showToast("Could not copy link", "error");
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-3 text-white/40">
        <Loader2 size={24} className="animate-spin text-amber-400" />
        Loading movie…
      </div>
    );
  }

  if (isError || !movie) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-white/50">Movie not found.</p>
        <Link href="/" className="text-amber-400 hover:underline">← Back to search</Link>
      </div>
    );
  }

  const inWatchlist = watchlist.includes(movie.title);

  return (
    <div className="min-h-screen">
      {showTrailer && trailerUrl && (
        <TrailerModal title={movie.title} trailerUrl={trailerUrl} onClose={() => setShowTrailer(false)} />
      )}

      {/* Back nav */}
      <div className="px-4 sm:px-8 pt-4 sm:pt-6">
        <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-amber-400 transition-colors text-sm">
          <ArrowLeft size={16} /> Back to search
        </Link>
      </div>

      {/* Hero */}
      <div className="px-4 sm:px-8 py-6 sm:py-8 flex flex-col sm:flex-row gap-6 sm:gap-8">
        {/* Poster */}
        <div className="relative w-40 sm:w-56 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden bg-white/5 shadow-2xl mx-auto sm:mx-0">
          {movie.poster ? (
            <Image src={movie.poster} alt={movie.title} fill className="object-cover" sizes="(max-width: 640px) 160px, 224px" priority />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-5xl text-white/20">🎬</div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 space-y-4">
          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight text-center sm:text-left">{movie.title}</h1>

          {/* Genres — clickable, link back to home with filter */}
          {movie.genres?.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              {movie.genres.map((g) => (
                <Link
                  key={g}
                  href={`/?genre=${encodeURIComponent(g)}`}
                  className="px-3 py-1 rounded-full text-sm bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/25 transition-colors"
                >
                  {g}
                </Link>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex flex-wrap gap-4 sm:gap-6 justify-center sm:justify-start">
            {movie.vote_average > 0 && (
              <div className="flex items-center gap-2">
                <Star size={18} className="text-amber-400" fill="currentColor" />
                <span className="text-xl sm:text-2xl font-bold text-amber-400">{movie.vote_average.toFixed(1)}</span>
                <span className="text-white/40 text-sm">/ 10 ({movie.vote_count?.toLocaleString()} votes)</span>
              </div>
            )}
            {movie.year > 0 && (
              <div className="flex items-center gap-2 text-white/60"><Calendar size={16} /> {movie.year}</div>
            )}
            {movie.runtime && (
              <div className="flex items-center gap-2 text-white/60"><Clock size={16} /> {movie.runtime} min</div>
            )}
            {movie.original_language && (
              <div className="flex items-center gap-2 text-white/60"><Globe size={16} /> {movie.original_language.toUpperCase()}</div>
            )}
          </div>

          {/* Overview */}
          {movie.overview && (
            <p className="text-white/60 leading-relaxed max-w-2xl text-center sm:text-left">{movie.overview}</p>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
            <button
              onClick={() => toggleWatchlist(movie.title)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                inWatchlist
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-white/5 text-white/70 border border-white/15 hover:bg-white/10"
              }`}
            >
              {inWatchlist ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              {inWatchlist ? "Saved" : "Add to Watchlist"}
            </button>

            <button
              onClick={openTrailer}
              disabled={trailerLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 transition-all disabled:opacity-50"
            >
              {trailerLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              Watch Trailer
            </button>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm bg-white/5 text-white/70 border border-white/15 hover:bg-white/10 transition-all"
            >
              <Share2 size={16} />
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Similar Movies */}
      {recsData?.recommendations && recsData.recommendations.length > 0 && (
        <div className="px-4 sm:px-8 pb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-7 rounded-full bg-amber-400" />
            <h2 className="text-xl font-bold text-amber-400">Similar Movies</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {recsData.recommendations.map((m) => (
              <MovieCard
                key={m.title}
                movie={m}
                watchlist={watchlist}
                onWatchlistToggle={toggleWatchlist}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
