"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Sparkles, SlidersHorizontal, Shuffle, Flame, ArrowRight, Clapperboard, Film } from "lucide-react";
import SearchBar from "./components/SearchBar";
import FilterSidebar from "./components/FilterSidebar";
import type { RecentlyViewedItem } from "./components/FilterSidebar";
import RecommendationGrid from "./components/RecommendationGrid";
import MovieCard from "./components/MovieCard";
import MovieCardSkeleton from "./components/MovieCardSkeleton";
import { fetchFilters, fetchMovies, fetchMovie, fetchTrending } from "./lib/api";
import type { FilterState, Movie } from "./types";
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

  useEffect(() => {
    const saved = localStorage.getItem("cinematic-watchlist");
    if (saved) setWatchlist(JSON.parse(saved));
    const rv = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (rv) setRecentlyViewed(JSON.parse(rv));
  }, []);

  useEffect(() => {
    localStorage.setItem("cinematic-watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const genre = params.get("genre");
    if (genre) setFilters((f) => ({ ...f, genre }));
  }, []);

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

  const { data: movieDetail, isLoading: movieLoading } = useQuery<Movie>({
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
    showToast(`Picked "${pick}" for you!`, "info");
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Cinematic Depth Highlights */}
      <div className="fixed top-[10%] left-[10%] w-[35%] h-[35%] rounded-full bg-[#E6A94A]/[0.05] blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[10%] right-[10%] w-[35%] h-[35%] rounded-full bg-[#6366F1]/[0.04] blur-[120px] pointer-events-none z-0" />

      {/* Header */}
      <header className="py-16 sm:py-24 px-8 sm:px-12 relative z-10">
        <div className="max-w-screen-2xl mx-auto w-full flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="gold-text text-5xl sm:text-8xl font-black tracking-tighter leading-none flex items-center gap-3">
              <div className="relative w-12 h-12 sm:w-20 sm:h-20 shrink-0">
                <Image src="/logo.png" alt="PopcornS Logo" fill className="object-contain" />
              </div>
              PopcornS
            </h1>
            <p className="text-[#F5F3EE]/30 text-[10px] sm:text-xs uppercase tracking-[4px] sm:tracking-[8px] font-bold">
              Smart Recommendations for Watch Better
            </p>
          </div>
          
        </div>
      </header>

      {/* Mobile filter button */}
      <div className="md:hidden px-6 mb-6">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#171923] border border-[#2A2E3A] text-[#F5F3EE]/70 text-sm font-bold shadow-xl transition-all active:scale-95"
        >
          <SlidersHorizontal size={18} />
          Filters & Exploration
        </button>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex flex-col md:flex-row gap-12 px-6 sm:px-10 pb-20 max-w-screen-2xl mx-auto w-full">
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
        <div className="flex-1 min-w-0 space-y-16">
          {/* Search + Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 items-stretch">
            <SearchBar
              ref={searchRef}
              movies={movieList}
              value={selectedMovie}
              onChange={setSelectedMovie}
              onSearch={setSelectedMovie}
            />
            <div className="flex gap-4">
              <button
                onClick={surpriseMe}
                title="Surprise me"
                className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 cinematic-blur text-[#E6A94A] rounded-2xl transition-all hover:bg-white/10 active:scale-95 shrink-0 shadow-xl group"
              >
                <Shuffle size={24} className="group-hover:rotate-12 transition-transform duration-300" />
              </button>
              <button
                onClick={() => setRecommending(true)}
                disabled={!selectedMovie}
                className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-10 bg-[#E6A94A] text-[#0F1117] font-black rounded-2xl text-base disabled:opacity-10 disabled:grayscale transition-all hover:brightness-110 active:scale-95 shadow-[0_15px_45px_rgba(230,169,74,0.25)] glow-primary"
              >
                <Sparkles size={20} />
                Discover Matches
              </button>
            </div>
          </div>

          {/* Selected movie detail panel */}
          {movieDetail && (
            <div className="cinematic-blur rounded-[48px] p-8 sm:p-14 shadow-[0_35px_120px_rgba(0,0,0,0.6)] relative overflow-hidden group">
              {/* Subtle background glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#E6A94A]/[0.05] blur-[100px] pointer-events-none" />
              
              <div className="flex flex-col md:flex-row gap-10 sm:gap-16 relative z-10">
                <div className="relative w-40 sm:w-56 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 mx-auto md:mx-0">
                  {movieDetail.poster ? (
                    <Image src={movieDetail.poster} alt={movieDetail.title} fill className="object-cover" sizes="224px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#1A1C26]">
                      <Film size={48} className="text-white/5" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-6">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="space-y-1">
                      <Link href={`/movie/${encodeURIComponent(movieDetail.title)}`} className="text-3xl sm:text-5xl font-black text-[#F5F3EE] hover:text-[#E6A94A] transition-colors leading-none tracking-tight">
                        {movieDetail.title}
                      </Link>
                      <p className="text-[#F5F3EE]/40 text-sm font-medium tracking-wide">
                        {movieDetail.year} • {movieDetail.original_language?.toUpperCase()} • {movieDetail.runtime} min
                      </p>
                    </div>
                    <button
                      onClick={() => toggleWatchlist(movieDetail.title)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold shrink-0 transition-all ${
                        watchlist.includes(movieDetail.title)
                          ? "bg-[#E6A94A] text-[#0F1117] shadow-lg"
                          : "bg-white/5 text-[#F5F3EE]/70 border border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {watchlist.includes(movieDetail.title) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                      {watchlist.includes(movieDetail.title) ? "Saved" : "Save for later"}
                    </button>
                  </div>

                  {movieDetail.genres?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {movieDetail.genres.map((g) => (
                        <button
                          key={g}
                          onClick={() => setFilters((f) => ({ ...f, genre: g }))}
                          className="text-[10px] sm:text-xs font-bold px-4 py-1.5 rounded-full bg-[#E6A94A]/10 text-[#E6A94A] border border-[#E6A94A]/20 hover:bg-[#E6A94A]/20 transition-all uppercase tracking-wider"
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-8 py-4 border-y border-[#2A2E3A]/30">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-[#F5F3EE]/30 uppercase tracking-widest mb-1">Critics Rating</span>
                       <div className="flex items-center gap-2">
                         <Star size={20} className="text-[#E6A94A]" fill="currentColor" />
                         <span className="text-2xl font-black text-[#F5F3EE]">{movieDetail.vote_average.toFixed(1)}</span>
                         <span className="text-[#F5F3EE]/30 font-bold text-sm">/ 10</span>
                       </div>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-[#F5F3EE]/30 uppercase tracking-widest mb-1">Popularity</span>
                       <div className="flex items-center gap-2 text-2xl font-black text-[#F5F3EE]">
                         {Math.round(movieDetail.popularity)}
                         <Flame size={18} className="text-[#E6A94A]" />
                       </div>
                    </div>
                  </div>

                  {movieDetail.overview && (
                    <p className="text-[#F5F3EE]/60 text-base sm:text-lg leading-relaxed line-clamp-4 font-medium italic">
                      "{movieDetail.overview}"
                    </p>
                  )}
                  
                  <Link 
                    href={`/movie/${encodeURIComponent(movieDetail.title)}`}
                    className="inline-flex items-center gap-2 text-[#E6A94A] font-bold hover:underline group"
                  >
                    View full production details
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
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

          {/* Trending Section */}
          {!selectedMovie && !recommending && (
            <section className="space-y-10">
              <div className="flex items-end justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Flame size={24} className="text-[#E6A94A]" />
                    <h2 className="text-3xl sm:text-5xl font-black text-[#F5F3EE] tracking-tight">Trending Now</h2>
                  </div>
                  <p className="text-[#F5F3EE]/30 font-bold uppercase text-[10px] tracking-[4px]">The most talked about films this week</p>
                </div>
                <div className="hidden sm:block w-32 h-px bg-gradient-to-r from-transparent to-[#2A2E3A]" />
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-10">
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

      <footer className="py-12 px-10 border-t border-[#2A2E3A]/50 mt-20">
        <div className="max-w-screen-2xl mx-auto w-full flex flex-col md:flex-row justify-between items-center gap-8">
             <span className="text-[#E6A94A] font-black text-2xl tracking-tighter flex items-center gap-2">
               <div className="relative w-7 h-7 shrink-0">
                 <Image src="/logo.png" alt="PopcornS" fill className="object-contain" />
               </div>
               PopcornS
             </span>
             <span className="text-[#F5F3EE]/20 text-[10px] uppercase font-bold tracking-[4px]">Smart Recommendations</span>
             <div className="text-[#F5F3EE]/20 text-[10px] uppercase font-bold tracking-[2px] text-center md:text-right">
               Built for cinema enthusiasts · Data powered by TMDB & OMDb · © 2024
             </div>
        </div>
      </footer>
    </div>
  );
}
