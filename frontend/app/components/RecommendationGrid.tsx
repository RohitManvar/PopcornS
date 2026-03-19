"use client";

import { useQuery } from "@tanstack/react-query";
import MovieCard from "./MovieCard";
import MovieCardSkeleton from "./MovieCardSkeleton";
import { fetchRecommendations } from "../lib/api";
import type { FilterState } from "../types";

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
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-1 h-7 rounded-full ${isLoading ? "bg-amber-400/30 animate-pulse" : "bg-amber-400"}`} />
        <h2 className="text-xl font-bold text-amber-400">
          {isLoading ? (
            <span className="text-white/40">Finding best matches…</span>
          ) : (
            <>Top {recs.length} recommendations for{" "}
              <span className="italic text-white/80">{selectedMovie}</span>
            </>
          )}
        </h2>
      </div>

      {isError && (
        <div className="text-center py-16 text-red-400/70">
          Failed to load recommendations. Is the backend running?
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
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
