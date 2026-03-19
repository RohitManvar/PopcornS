"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Calendar, Clock, Bookmark, BookmarkCheck, Target, Share2 } from "lucide-react";
import type { Movie } from "../types";
import { useToast } from "./Toast";

interface Props {
  movie: Movie;
  watchlist: string[];
  onWatchlistToggle: (title: string) => void;
  onGenreClick?: (genre: string) => void;
}

export default function MovieCard({ movie, watchlist, onWatchlistToggle, onGenreClick }: Props) {
  const [imgError, setImgError] = useState(false);
  const inWatchlist = watchlist.includes(movie.title);
  const { showToast } = useToast();

  function handleWatchlist() {
    onWatchlistToggle(movie.title);
    showToast(
      inWatchlist ? `Removed "${movie.title}" from watchlist` : `Added "${movie.title}" to watchlist`,
      inWatchlist ? "info" : "success"
    );
  }

  async function handleShare() {
    const url = `${window.location.origin}/movie/${encodeURIComponent(movie.title)}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied to clipboard!", "success");
    } catch {
      showToast("Could not copy link", "error");
    }
  }

  return (
    <div className="movie-card bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col h-full">
      {/* Poster */}
      <Link href={`/movie/${encodeURIComponent(movie.title)}`} className="block relative aspect-[2/3] bg-white/5 overflow-hidden group">
        {movie.poster && !imgError ? (
          <Image
            src={movie.poster}
            alt={movie.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
            sizes="(max-width: 768px) 50vw, 20vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl text-white/20">
            🎬
          </div>
        )}
        {movie.similarity !== undefined && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 text-xs text-amber-400">
            <Target size={10} />
            {(movie.similarity * 100).toFixed(0)}%
          </div>
        )}
        {/* Share button overlay */}
        <button
          onClick={(e) => { e.preventDefault(); handleShare(); }}
          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 bg-black/70 backdrop-blur-sm rounded-full p-1.5 text-white/60 hover:text-white transition-all"
          title="Copy link"
        >
          <Share2 size={12} />
        </button>
      </Link>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <Link href={`/movie/${encodeURIComponent(movie.title)}`} className="font-semibold text-sm text-white/90 hover:text-amber-400 transition-colors line-clamp-2 leading-tight">
          {movie.title}
        </Link>

        {/* Badges row */}
        <div className="flex flex-wrap gap-1">
          {movie.vote_average > 0 && (
            <span className="flex items-center gap-0.5 bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full border border-amber-500/30">
              <Star size={9} fill="currentColor" /> {movie.vote_average.toFixed(1)}
            </span>
          )}
          {movie.year > 0 && (
            <span className="flex items-center gap-0.5 bg-white/10 text-white/60 text-xs px-2 py-0.5 rounded-full">
              <Calendar size={9} /> {movie.year}
            </span>
          )}
          {movie.runtime && (
            <span className="flex items-center gap-0.5 bg-white/10 text-white/60 text-xs px-2 py-0.5 rounded-full">
              <Clock size={9} /> {movie.runtime}m
            </span>
          )}
        </div>

        {/* Genres (clickable) */}
        {movie.genres?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {movie.genres.slice(0, 2).map((g) => (
              <button
                key={g}
                onClick={() => onGenreClick?.(g)}
                className="text-xs px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/25 transition-colors"
              >
                {g}
              </button>
            ))}
          </div>
        )}

        {/* Watchlist button */}
        <button
          onClick={handleWatchlist}
          className={`mt-auto w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            inWatchlist
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/80"
          }`}
        >
          {inWatchlist ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
          {inWatchlist ? "Saved" : "Watchlist"}
        </button>
      </div>
    </div>
  );
}
