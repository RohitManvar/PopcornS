"use client";

import { SlidersHorizontal, X, Clock, Download } from "lucide-react";
import Link from "next/link";
import type { FiltersData, FilterState } from "../types";

export interface RecentlyViewedItem {
  title: string;
  poster?: string | null;
}

interface Props {
  filters: FiltersData | undefined;
  state: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
  watchlist: string[];
  onRemoveWatchlist: (title: string) => void;
  onClearWatchlist: () => void;
  recentlyViewed: RecentlyViewedItem[];
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function FilterSidebar({
  filters,
  state,
  onChange,
  watchlist,
  onRemoveWatchlist,
  onClearWatchlist,
  recentlyViewed,
  mobileOpen = false,
  onMobileClose,
}: Props) {
  const labelCls = "block text-xs font-semibold uppercase tracking-wider text-white/40 mb-1.5";
  const selectCls =
    "w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-amber-500/50 [&>option]:bg-[#1a1a2e] [&>option]:text-white";
  const inputCls =
    "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-amber-500/50";

  function exportWatchlist() {
    const lines = ["# My PopcornS Watchlist", "", ...watchlist.map((t, i) => `${i + 1}. ${t}`)];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "popcorn-watchlist.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  const content = (
    <div className="space-y-6">
      {/* Mobile header */}
      <div className="flex items-center justify-between md:hidden">
        <div className="flex items-center gap-2 text-amber-400 font-semibold">
          <SlidersHorizontal size={16} />
          <span>Filters</span>
        </div>
        <button onClick={onMobileClose} className="text-white/40 hover:text-white/80 transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Filters panel */}
      <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 space-y-5">
        <div className="hidden md:flex items-center gap-2 text-amber-400 font-semibold">
          <SlidersHorizontal size={16} />
          <span>Filters</span>
        </div>

        <div>
          <label className={labelCls}>Genre</label>
          <select className={selectCls} value={state.genre} onChange={(e) => onChange({ genre: e.target.value })}>
            <option value="">All genres</option>
            {filters?.genres.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls}>Language</label>
          <select className={selectCls} value={state.language} onChange={(e) => onChange({ language: e.target.value })}>
            <option value="">All languages</option>
            {filters?.languages.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls}>Year range</label>
          <div className="flex gap-2">
            <input type="number" className={inputCls} placeholder={String(filters?.year_min ?? 1900)}
              value={state.yearMin || ""} onChange={(e) => onChange({ yearMin: Number(e.target.value) || 0 })} />
            <input type="number" className={inputCls} placeholder={String(filters?.year_max ?? 2025)}
              value={state.yearMax === 9999 ? "" : state.yearMax || ""}
              onChange={(e) => onChange({ yearMax: Number(e.target.value) || 9999 })} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Min rating: {state.minRating.toFixed(1)}</label>
          <input type="range" min={0} max={10} step={0.5} value={state.minRating}
            onChange={(e) => onChange({ minRating: Number(e.target.value) })}
            className="w-full accent-amber-400" />
        </div>

        <button
          onClick={() => onChange({ genre: "", language: "", yearMin: 0, yearMax: 9999, minRating: 0 })}
          className="w-full text-xs text-white/40 hover:text-white/70 py-1.5 border border-white/10 rounded-lg transition-colors"
        >
          Reset filters
        </button>
      </div>

      {/* Options panel */}
      <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 space-y-5">
        <div className="text-amber-400 font-semibold text-sm">Options</div>

        <div>
          <label className={labelCls}>Recommendations: {state.numRecs}</label>
          <input type="range" min={5} max={20} step={5} value={state.numRecs}
            onChange={(e) => onChange({ numRecs: Number(e.target.value) })}
            className="w-full accent-amber-400" />
        </div>

        <div>
          <label className={labelCls}>Sort by</label>
          <select className={selectCls} value={state.sortBy} onChange={(e) => onChange({ sortBy: e.target.value })}>
            <option value="similarity">🎯 Similarity</option>
            <option value="rating">⭐ Rating</option>
            <option value="popularity">🔥 Popularity</option>
            <option value="year">📅 Year (Newest)</option>
          </select>
        </div>
      </div>

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={14} className="text-amber-400" />
            <div className="text-amber-400 font-semibold text-sm">Recently Viewed</div>
          </div>
          <ul className="space-y-2">
            {recentlyViewed.map((item) => (
              <li key={item.title}>
                <Link
                  href={`/movie/${encodeURIComponent(item.title)}`}
                  className="text-xs text-white/70 hover:text-amber-400 transition-colors truncate block"
                  onClick={onMobileClose}
                >
                  🎬 {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Watchlist */}
      <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-amber-400 font-semibold text-sm">🍿 Watchlist</div>
          {watchlist.length > 0 && (
            <div className="flex items-center gap-2">
              <button onClick={exportWatchlist} title="Export watchlist" className="text-white/30 hover:text-amber-400 transition-colors">
                <Download size={14} />
              </button>
              <button onClick={onClearWatchlist} className="text-xs text-white/30 hover:text-red-400 transition-colors">
                Clear all
              </button>
            </div>
          )}
        </div>

        {watchlist.length === 0 ? (
          <p className="text-white/30 text-xs">No movies saved yet.</p>
        ) : (
          <ul className="space-y-2">
            {watchlist.map((title) => (
              <li key={title} className="flex items-center justify-between gap-2 group">
                <a
                  href={`/movie/${encodeURIComponent(title)}`}
                  className="text-xs text-white/70 hover:text-amber-400 transition-colors truncate"
                >
                  🎬 {title}
                </a>
                <button onClick={() => onRemoveWatchlist(title)} className="text-white/20 hover:text-red-400 transition-colors shrink-0">
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={onMobileClose} />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-72 shrink-0">
        {content}
      </aside>

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[90vw] bg-[#0d0d1a] overflow-y-auto p-5 transition-transform duration-300 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {content}
      </aside>
    </>
  );
}
