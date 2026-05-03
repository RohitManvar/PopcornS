"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Calendar, Bookmark, BookmarkCheck, Target, Share2, Play, Film } from "lucide-react";
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

  function handleWatchlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onWatchlistToggle(movie.title);
    showToast(
      inWatchlist ? `Removed "${movie.title}" from watchlist` : `Added "${movie.title}" to watchlist`,
      inWatchlist ? "info" : "success"
    );
  }

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/movie/${encodeURIComponent(movie.title)}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied to clipboard!", "success");
    } catch {
      showToast("Could not copy link", "error");
    }
  }

  return (
    <div className="group flex flex-col h-full">
      {/* Poster Section */}
      <Link 
        href={`/movie/${encodeURIComponent(movie.title)}`} 
        className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.5)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-2 group-hover:shadow-[0_30px_60px_rgba(0,0,0,0.6)] bg-[#171923]"
      >
        {movie.poster && !imgError ? (
          <Image
            src={movie.poster}
            alt={movie.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImgError(true)}
            sizes="(max-width: 768px) 50vw, 20vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1A1C26]">
            <Film size={48} className="text-white/5" />
          </div>
        )}

        {/* Cinematic Overlay (Visible on Hover) */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1117] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Quick Actions (Top) */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-[-10px] group-hover:translate-y-0">
          <button
            onClick={handleShare}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white/70 hover:text-white hover:bg-black/60 transition-colors"
            title="Share"
          >
            <Share2 size={14} />
          </button>
          
          {movie.similarity !== undefined && (
            <div className="bg-[#E6A94A] text-[#0F1117] font-bold text-[10px] px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
              <Target size={10} />
              {(movie.similarity * 100).toFixed(0)}%
            </div>
          )}
        </div>

        {/* Meta Info (Bottom Overlay) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-[20px] group-hover:translate-y-0">
          <div className="flex items-center gap-3 mb-4">
            <button
            onClick={handleWatchlist}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cinematic-blur ${
              inWatchlist
                ? "bg-[#E6A94A] text-[#0F1117]"
                : "text-[#F5F3EE] hover:bg-white/10"
            }`}
          >
              {inWatchlist ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
              {inWatchlist ? "Saved" : "Add to list"}
            </button>
          </div>
        </div>

        {/* Center Play Icon on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-50 group-hover:scale-100 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-[#E6A94A]/20 backdrop-blur-sm border border-[#E6A94A]/30 flex items-center justify-center text-[#E6A94A]">
            <Play size={24} className="fill-current ml-1" />
          </div>
        </div>
      </Link>

      {/* Info Section (Static) */}
      <div className="mt-4 px-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-lg text-[#F5F3EE] leading-tight group-hover:text-[#E6A94A] transition-colors duration-300 line-clamp-1">
            {movie.title}
          </h3>
          {movie.vote_average > 0 && (
            <div className="flex items-center gap-1 text-[#E6A94A] font-bold text-sm">
              <Star size={14} fill="currentColor" />
              <span>{movie.vote_average.toFixed(1)}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-[#F5F3EE]/40 font-medium">
          <span>{movie.year}</span>
          <span>•</span>
          <span className="line-clamp-1">{movie.genres?.slice(0, 2).join(", ")}</span>
        </div>
      </div>
    </div>
  );
}
