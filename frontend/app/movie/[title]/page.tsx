"use client";

import { use, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, Star, Calendar, Clock, Globe,
  Bookmark, BookmarkCheck, Loader2, Share2, Play, Flame, Info, Film
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

  useEffect(() => {
    if (movie?.title) {
      document.title = `${movie.title} | PopcornS`;
    }
    return () => { document.title = "PopcornS"; };
  }, [movie]);

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
        showToast("No trailer found for this masterpiece", "info");
      }
    } catch {
      showToast("Could not reach the trailer server", "error");
    } finally {
      setTrailerLoading(false);
    }
  }

  async function handleShare() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Production link copied!", "success");
    } catch {
      showToast("Could not copy link", "error");
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#0F1117]">
        <div className="relative w-20 h-20">
           <Loader2 size={80} className="animate-spin text-[#E6A94A]/20" />
           <div className="absolute inset-0 flex items-center justify-center text-[#E6A94A] font-black text-xl animate-pulse">P</div>
        </div>
        <p className="text-[#F5F3EE]/30 font-bold uppercase tracking-[6px] text-[10px]">Loading Production Details</p>
      </div>
    );
  }

  if (isError || !movie) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#0F1117]">
        <p className="text-[#F5F3EE]/40 text-xl font-medium italic">Production not found.</p>
        <Link href="/" className="px-8 py-3 bg-[#E6A94A] text-[#0F1117] font-black rounded-2xl hover:brightness-110 transition-all">
          Return Home
        </Link>
      </div>
    );
  }

  const inWatchlist = watchlist.includes(movie.title);

  return (
    <div className="min-h-screen relative bg-[#0F1117]">
      {showTrailer && trailerUrl && (
        <TrailerModal title={movie.title} trailerUrl={trailerUrl} onClose={() => setShowTrailer(false)} />
      )}

      {/* Cinematic Hero Background */}
      <div className="absolute top-0 left-0 right-0 h-[70vh] pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#E6A94A]/[0.08] via-transparent to-transparent" />
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[80%] rounded-full bg-[#E6A94A]/[0.02] blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-screen-2xl mx-auto w-full px-6 sm:px-10">
        {/* Navigation */}
        <nav className="py-8">
          <Link href="/" className="inline-flex items-center gap-3 text-[#F5F3EE]/30 hover:text-[#E6A94A] transition-colors font-bold text-sm uppercase tracking-widest group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
            Back to Discovery
          </Link>
        </nav>

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row gap-12 sm:gap-20 items-center md:items-start pt-4 sm:pt-10">
          {/* Poster with shadow layer */}
          <div className="relative w-48 sm:w-60 md:w-72 shrink-0 aspect-[2/3] rounded-[32px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.8)] ring-1 ring-white/10">
            {movie.poster ? (
              <Image src={movie.poster} alt={movie.title} fill className="object-cover" sizes="(max-width: 768px) 192px, 288px" priority />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[#1A1C26]">
                <Film size={64} className="text-white/5" />
              </div>
            )}
          </div>

          {/* Details Content */}
          <div className="flex-1 min-w-0 space-y-8 text-center md:text-left">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-7xl font-black text-[#F5F3EE] leading-none tracking-tighter">{movie.title}</h1>
              
              {/* Metadata Badges */}
              {movie.genres?.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {movie.genres.map((g) => (
                    <Link
                      key={g}
                      href={`/?genre=${encodeURIComponent(g)}`}
                      className="px-5 py-2 rounded-full text-xs font-bold bg-[#E6A94A]/10 text-[#E6A94A] border border-[#E6A94A]/20 hover:bg-[#E6A94A]/20 transition-all uppercase tracking-widest"
                    >
                      {g}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 py-8 border-y border-[#2A2E3A]/40">
              <div className="space-y-1">
                 <span className="text-[10px] font-bold text-[#F5F3EE]/30 uppercase tracking-[3px]">Critics</span>
                 <div className="flex items-center justify-center md:justify-start gap-2">
                   <Star size={20} className="text-[#E6A94A]" fill="currentColor" />
                   <span className="text-2xl font-black text-[#F5F3EE]">{movie.vote_average.toFixed(1)}</span>
                 </div>
              </div>
              <div className="space-y-1">
                 <span className="text-[10px] font-bold text-[#F5F3EE]/30 uppercase tracking-[3px]">Release</span>
                 <div className="flex items-center justify-center md:justify-start gap-2 text-xl font-bold text-[#F5F3EE]/80">
                   <Calendar size={18} className="text-[#E6A94A]/40" /> {movie.year}
                 </div>
              </div>
              <div className="space-y-1">
                 <span className="text-[10px] font-bold text-[#F5F3EE]/30 uppercase tracking-[3px]">Duration</span>
                 <div className="flex items-center justify-center md:justify-start gap-2 text-xl font-bold text-[#F5F3EE]/80">
                   <Clock size={18} className="text-[#E6A94A]/40" /> {movie.runtime}m
                 </div>
              </div>
              <div className="space-y-1">
                 <span className="text-[10px] font-bold text-[#F5F3EE]/30 uppercase tracking-[3px]">Language</span>
                 <div className="flex items-center justify-center md:justify-start gap-2 text-xl font-bold text-[#F5F3EE]/80 uppercase">
                   <Globe size={18} className="text-[#E6A94A]/40" /> {movie.original_language}
                 </div>
              </div>
            </div>

            {/* Overview */}
            {movie.overview && (
              <div className="space-y-4">
                 <h3 className="text-[#E6A94A] font-black text-sm uppercase tracking-widest flex items-center gap-2 justify-center md:justify-start">
                   <Info size={14} /> Synopsis
                 </h3>
                 <p className="text-[#F5F3EE]/60 text-lg sm:text-2xl font-medium italic leading-relaxed max-w-4xl">
                   "{movie.overview}"
                 </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-6">
              <button
                onClick={openTrailer}
                disabled={trailerLoading}
                className="inline-flex items-center gap-3 px-10 py-4.5 rounded-[24px] font-black text-lg bg-[#E6A94A] text-[#0F1117] shadow-[0_15px_40px_rgba(230,169,74,0.3)] hover:brightness-110 active:scale-95 transition-all group"
              >
                {trailerLoading ? <Loader2 size={22} className="animate-spin" /> : <Play size={22} className="fill-current" />}
                Watch Presentation
              </button>

              <button
                onClick={() => toggleWatchlist(movie.title)}
                className={`inline-flex items-center gap-3 px-8 py-4.5 rounded-[24px] font-bold text-base transition-all border border-[#2A2E3A] ${
                  inWatchlist
                    ? "bg-[#E6A94A]/10 text-[#E6A94A] border-[#E6A94A]/40"
                    : "bg-white/5 text-[#F5F3EE]/60 hover:bg-white/10 hover:text-[#F5F3EE]"
                }`}
              >
                {inWatchlist ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                {inWatchlist ? "Saved to list" : "Add to list"}
              </button>

              <button
                onClick={handleShare}
                className="inline-flex items-center justify-center w-[60px] h-[60px] rounded-[24px] bg-white/5 text-[#F5F3EE]/40 border border-[#2A2E3A] hover:bg-white/10 hover:text-[#F5F3EE] transition-all"
              >
                <Share2 size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Similar Productions Section */}
        {recsData?.recommendations && recsData.recommendations.length > 0 && (
          <div className="mt-40 pb-20">
            <div className="flex items-center gap-4 mb-12">
              <div className="w-2 h-10 rounded-full bg-[#E6A94A]" />
              <div className="space-y-1">
                <h2 className="text-3xl sm:text-5xl font-black text-[#F5F3EE] tracking-tight">Similar Productions</h2>
                <p className="text-[#F5F3EE]/30 font-bold uppercase text-[10px] tracking-[4px]">Curated based on cinematic profile</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-10">
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
      
      {/* Footer (Simplified) */}
      <footer className="py-12 border-t border-[#2A2E3A]/30 mt-20 text-center">
         <p className="text-[#F5F3EE]/10 text-[10px] font-bold uppercase tracking-[4px]">PopcornS Cinematic Engine · 2024</p>
      </footer>
    </div>
  );
}
