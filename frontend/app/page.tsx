"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, SlidersHorizontal, Shuffle, Flame } from "lucide-react";
import SearchBar from "./components/SearchBar";
import FilterSidebar from "./components/FilterSidebar";
import type { RecentlyViewedItem } from "./components/FilterSidebar";
import RecommendationGrid from "./components/RecommendationGrid";
import MovieCard from "./components/MovieCard";
import MovieCardSkeleton from "./components/MovieCardSkeleton";
import { fetchFilters, fetchMovies, fetchMovie, fetchTrending } from "./lib/api";
import type { FilterState, Movie } from "./types";
import Image from "next/image";
import Link from "next/link";
import { Star, Calendar, Clock, Globe, Bookmark, BookmarkCheck } from "lucide-react";
import { useToast } from "./components/Toast";

const DEFAULT_FILTERS: FilterState = {
  genre: "",
  language: "",
  yearMin: 0,
  yearMax: 9999,
  minRating: 0,
  numRecs: 10,
  sortBy: "similarity",
};

const RECENTLY_VIEWED_KEY = "popcorn-recently-viewed";

export default function Home() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selectedMovie, setSelectedMovie] = useState("");
  const [recommending, setRecommending] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  // Load persisted data
  useEffect(() => {
    const saved = localStorage.getItem("cinematic-watchlist");
    if (saved) setWatchlist(JSON.parse(saved));
    const rv = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (rv) setRecentlyViewed(JSON.parse(rv));
  }, []);

  useEffect(() => {
    localStorage.setItem("cinematic-watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  // Read genre from URL param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const genre = params.get("genre");
    if (genre) setFilters((f) => ({ ...f, genre }));
  }, []);

  // Global keyboard shortcut: / to focus search
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function toggleWatchlist(title: string) {
    setWatchlist((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  }

  const { data: filterData } = useQuery({
    queryKey: ["filters"],
    queryFn: fetchFilters,
  });

  const { data: moviesData } = useQuery({
    queryKey: ["movies", filters],
    queryFn: () =>
      fetchMovies({
        genre: filters.genre,
        language: filters.language,
        year_min: filters.yearMin || undefined,
        year_max: filters.yearMax < 9999 ? filters.yearMax : undefined,
        min_rating: filters.minRating || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const { data: movieDetail } = useQuery<Movie>({
    queryKey: ["movie", selectedMovie],
    queryFn: () => fetchMovie(selectedMovie),
    enabled: !!selectedMovie,
  });

  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ["trending"],
    queryFn: () => fetchTrending("popularity"),
    staleTime: 10 * 60 * 1000,
  });

  const movieList = moviesData?.movies ?? [];

  function surpriseMe() {
    if (movieList.length === 0) return;
    const pick = movieList[Math.floor(Math.random() * movieList.length)];
    setSelectedMovie(pick);
    setRecommending(true);
    showToast(`🎲 Picked "${pick}" for you!`, "info");
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="text-center py-8 px-4">
        <h1 className="gold-text text-4xl sm:text-5xl font-black tracking-tight mb-2">🍿 Popcorn</h1>
        <p className="text-white/40 text-xs sm:text-sm uppercase tracking-[4px]">Intelligent Movie Discovery</p>
      </header>

      {/* Mobile filter button */}
      <div className="md:hidden px-4 mb-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm hover:bg-white/10 transition-colors"
        >
          <SlidersHorizontal size={16} />
          Filters & Options
        </button>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex gap-6 px-4 sm:px-6 pb-10 max-w-screen-2xl mx-auto w-full">
        <FilterSidebar
          filters={filterData}
          state={filters}
          onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
          watchlist={watchlist}
          onRemoveWatchlist={(t) => toggleWatchlist(t)}
          onClearWatchlist={() => setWatchlist([])}
          recentlyViewed={recentlyViewed}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
        />

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Search + Buttons */}
          <div className="flex gap-2 sm:gap-3 items-stretch">
            <SearchBar
              ref={searchRef}
              movies={movieList}
              value={selectedMovie}
              onChange={setSelectedMovie}
              onSearch={setSelectedMovie}
            />
            <button
              onClick={surpriseMe}
              title="Surprise me"
              className="flex items-center gap-2 px-3 sm:px-4 py-3.5 bg-white/5 border border-white/10 text-white/70 rounded-xl text-sm hover:bg-white/10 hover:text-amber-400 transition-all shrink-0"
            >
              <Shuffle size={16} />
            </button>
            <button
              onClick={() => setRecommending(true)}
              disabled={!selectedMovie}
              className="flex items-center gap-2 px-4 sm:px-6 py-3.5 bg-gradient-to-r from-orange-500 to-amber-400 text-black font-bold rounded-xl text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 transition-all shrink-0"
            >
              <Sparkles size={16} />
              <span className="hidden sm:inline">Recommend</span>
            </button>
          </div>

          {/* Selected movie detail panel */}
          {movieDetail && (
            <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                <div className="relative w-24 sm:w-32 shrink-0 aspect-[2/3] rounded-xl overflow-hidden bg-white/5 mx-auto sm:mx-0">
                  {movieDetail.poster ? (
                    <Image src={movieDetail.poster} alt={movieDetail.title} fill className="object-cover" sizes="128px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-3xl text-white/20">🎬</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <Link href={`/movie/${encodeURIComponent(movieDetail.title)}`} className="text-lg sm:text-2xl font-bold text-white hover:text-amber-400 transition-colors">
                      {movieDetail.title}
                    </Link>
                    <button
                      onClick={() => toggleWatchlist(movieDetail.title)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all ${
                        watchlist.includes(movieDetail.title)
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {watchlist.includes(movieDetail.title) ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
                      {watchlist.includes(movieDetail.title) ? "Saved" : "Save"}
                    </button>
                  </div>

                  {movieDetail.genres?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {movieDetail.genres.map((g) => (
                        <button
                          key={g}
                          onClick={() => setFilters((f) => ({ ...f, genre: g }))}
                          className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/25 transition-colors"
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 mb-3">
                    {movieDetail.vote_average > 0 && (
                      <div className="flex items-center gap-1.5 text-sm text-white/70">
                        <Star size={14} className="text-amber-400" fill="currentColor" />
                        <span><strong className="text-amber-400">{movieDetail.vote_average.toFixed(1)}</strong>/10</span>
                      </div>
                    )}
                    {movieDetail.year > 0 && (
                      <div className="flex items-center gap-1.5 text-sm text-white/70">
                        <Calendar size={14} className="text-white/40" /> {movieDetail.year}
                      </div>
                    )}
                    {movieDetail.runtime && (
                      <div className="flex items-center gap-1.5 text-sm text-white/70">
                        <Clock size={14} className="text-white/40" /> {movieDetail.runtime} min
                      </div>
                    )}
                    {movieDetail.original_language && (
                      <div className="flex items-center gap-1.5 text-sm text-white/70">
                        <Globe size={14} className="text-white/40" /> {movieDetail.original_language.toUpperCase()}
                      </div>
                    )}
                  </div>

                  {movieDetail.overview && (
                    <p className="text-white/50 text-sm leading-relaxed line-clamp-3">{movieDetail.overview}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommending && selectedMovie && (
            <RecommendationGrid
              selectedMovie={selectedMovie}
              filterState={filters}
              watchlist={watchlist}
              onWatchlistToggle={toggleWatchlist}
              onGenreClick={(g) => setFilters((f) => ({ ...f, genre: g }))}
            />
          )}

          {/* Trending (shown when nothing selected) */}
          {!selectedMovie && !recommending && (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1 h-7 rounded-full bg-orange-500" />
                <Flame size={18} className="text-orange-400" />
                <h2 className="text-xl font-bold text-white">Trending Now</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {trendingLoading
                  ? Array.from({ length: 10 }).map((_, i) => <MovieCardSkeleton key={i} />)
                  : trendingData?.movies.map((movie) => (
                      <MovieCard
                        key={movie.title}
                        movie={movie}
                        watchlist={watchlist}
                        onWatchlistToggle={toggleWatchlist}
                        onGenreClick={(g) => setFilters((f) => ({ ...f, genre: g }))}
                      />
                    ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <footer className="text-center py-4 text-white/20 text-xs border-t border-white/5">
        Popcorn · Built with Next.js + FastAPI · TMDB Dataset
      </footer>
    </div>
  );
}
