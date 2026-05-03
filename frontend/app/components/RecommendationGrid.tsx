"use client";

import { useQuery } from "@tanstack/react-query";
import MovieCard from "./MovieCard";
import MovieCardSkeleton from "./MovieCardSkeleton";
import { fetchRecommendations } from "../lib/api";
import type { FilterState } from "../types";
import { Sparkles, Loader2 } from "lucide-react";

interface Props {
  selectedMovie: string;
  filterState: FilterState;
  watchlist: string[];
  onWatchlistToggle: (title: string) => void;
  onGenreClick?: (genre: string) => void;
}

export default function RecommendationGrid({
  selectedMovie,
  filterState,
  watchlist,
  onWatchlistToggle,
  onGenreClick,
}: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["recommendations", selectedMovie, filterState.numRecs, filterState.sortBy],
    queryFn: () => fetchRecommendations(selectedMovie, filterState.numRecs, filterState.sortBy),
    enabled: !!selectedMovie,
  });

  if (!selectedMovie) return null;

  const recs = data?.recommendations ?? [];

  return (
    <section className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Sparkles size={24} className="text-[#E6A94A]" />
            <h2 className="text-3xl sm:text-5xl font-black text-[#F5F3EE] tracking-tight">
              {isLoading ? "Curating Matches" : "Recommended for You"}
            </h2>
          </div>
          <p className="text-[#F5F3EE]/30 font-bold uppercase text-[10px] tracking-[4px]">
            {isLoading ? "Analyzing cinematic patterns..." : `Based on your interest in ${selectedMovie}`}
          </p>
        </div>
        {isLoading && <Loader2 size={24} className="animate-spin text-[#E6A94A]/20 mb-2" />}
      </div>

      {isError && (
        <div className="text-center py-20 bg-[#171923] rounded-[32px] border border-red-500/10">
          <p className="text-red-400/70 font-medium italic mb-4 text-lg">"Something went wrong in the projection room."</p>
          <p className="text-white/20 text-xs uppercase tracking-widest font-bold">Please check if the engine is running</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-10">
        {isLoading
          ? Array.from({ length: filterState.numRecs }).map((_, i) => <MovieCardSkeleton key={i} />)
          : recs.map((movie) => (
              <MovieCard
                key={movie.title}
                movie={movie}
                watchlist={watchlist}
                onWatchlistToggle={onWatchlistToggle}
                onGenreClick={onGenreClick}
              />
            ))}
      </div>
    </section>
  );
}
