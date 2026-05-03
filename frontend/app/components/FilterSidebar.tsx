"use client";

import { SlidersHorizontal, X, Clock, Download, Trash2, Film, Bookmark } from "lucide-react";
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
  const labelCls = "block text-[10px] font-bold uppercase tracking-[2px] text-[#F5F3EE]/40 mb-2";
  const selectCls =
    "w-full bg-[#1A1C26] border border-[#2A2E3A] rounded-xl px-4 py-2.5 text-sm text-[#F5F3EE]/80 focus:outline-none focus:border-[#E6A94A]/40 transition-colors [&>option]:bg-[#1A1C26] [&>option]:text-[#F5F3EE]";
  const inputCls =
    "w-full bg-[#1A1C26] border border-[#2A2E3A] rounded-xl px-4 py-2.5 text-sm text-[#F5F3EE]/80 focus:outline-none focus:border-[#E6A94A]/40 transition-colors";

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
    <div className="space-y-8">
      {/* Mobile header */}
      <div className="flex items-center justify-between md:hidden">
        <div className="flex items-center gap-2 text-[#E6A94A] font-bold tracking-tight">
          <SlidersHorizontal size={18} />
          <span className="text-lg">Filters</span>
        </div>
        <button onClick={onMobileClose} className="text-[#F5F3EE]/40 hover:text-[#F5F3EE]/80 transition-colors">
          <X size={24} />
        </button>
      </div>

      {/* Filters panel */}
      <div className="space-y-10">
        <div className="hidden md:flex items-center gap-3 text-[#E6A94A] font-bold tracking-tight mb-2">
          <SlidersHorizontal size={20} />
          <span className="text-xl">Filters</span>
        </div>

        <div className="space-y-8 cinematic-blur p-8 rounded-[32px] shadow-2xl">
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
            <div className="flex gap-3">
              <input type="number" className={inputCls} placeholder={String(filters?.year_min ?? 1900)}
                value={state.yearMin || ""} onChange={(e) => onChange({ yearMin: Number(e.target.value) || 0 })} />
              <input type="number" className={inputCls} placeholder={String(filters?.year_max ?? 2025)}
                value={state.yearMax === 9999 ? "" : state.yearMax || ""}
                onChange={(e) => onChange({ yearMax: Number(e.target.value) || 9999 })} />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className={labelCls}>Min rating</label>
              <span className="text-xs font-bold text-[#E6A94A]">{state.minRating.toFixed(1)}</span>
            </div>
            <input type="range" min={0} max={10} step={0.5} value={state.minRating}
              onChange={(e) => onChange({ minRating: Number(e.target.value) })}
              className="w-full accent-[#E6A94A] h-1.5 bg-[#2A2E3A] rounded-lg appearance-none cursor-pointer" />
          </div>

          <button
            onClick={() => onChange({ genre: "", language: "", yearMin: 0, yearMax: 9999, minRating: 0 })}
            className="w-full text-xs font-bold text-[#F5F3EE]/30 hover:text-[#E6A94A] py-2.5 border border-[#2A2E3A] rounded-xl transition-all hover:bg-[#E6A94A]/5"
          >
            Reset all criteria
          </button>
        </div>

        {/* Options panel */}
        <div className="space-y-8 cinematic-blur p-8 rounded-[32px] shadow-2xl">
          <div className="text-[#E6A94A] font-bold text-sm tracking-widest uppercase">System Options</div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className={labelCls}>Recommendations</label>
              <span className="text-xs font-bold text-[#E6A94A]">{state.numRecs}</span>
            </div>
            <input type="range" min={5} max={20} step={5} value={state.numRecs}
              onChange={(e) => onChange({ numRecs: Number(e.target.value) })}
              className="w-full accent-[#E6A94A] h-1.5 bg-[#2A2E3A] rounded-lg appearance-none cursor-pointer" />
          </div>

          <div>
            <label className={labelCls}>Sort by</label>
            <select className={selectCls} value={state.sortBy} onChange={(e) => onChange({ sortBy: e.target.value })}>
              <option value="similarity">Similarity</option>
              <option value="rating">Rating</option>
              <option value="popularity">Popularity</option>
              <option value="year">Year (Newest)</option>
            </select>
          </div>
        </div>

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <div className="cinematic-blur p-8 rounded-[32px]">
            <div className="flex items-center gap-3 mb-6">
              <Clock size={16} className="text-[#E6A94A]" />
              <div className="text-[#E6A94A] font-bold text-sm tracking-widest uppercase">History</div>
            </div>
            <ul className="space-y-3">
              {recentlyViewed.map((item) => (
                <li key={item.title}>
                  <Link
                    href={`/movie/${encodeURIComponent(item.title)}`}
                    className="text-xs text-[#F5F3EE]/60 hover:text-[#E6A94A] transition-colors truncate block flex items-center gap-2 group"
                    onClick={onMobileClose}
                  >
                    <Film size={12} className="text-[#E6A94A]/40 group-hover:text-[#E6A94A]" />
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Watchlist */}
        <div className="cinematic-blur p-8 rounded-[32px]">
          <div className="flex items-center justify-between mb-6">
            <div className="text-[#E6A94A] font-bold text-sm tracking-widest uppercase flex items-center gap-2">
              <Bookmark size={14} />
              Watchlist
            </div>
            {watchlist.length > 0 && (
              <div className="flex items-center gap-3">
                <button onClick={exportWatchlist} title="Export" className="text-[#F5F3EE]/20 hover:text-[#E6A94A] transition-colors">
                  <Download size={16} />
                </button>
                <button onClick={onClearWatchlist} title="Clear all" className="text-[#F5F3EE]/20 hover:text-red-400 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {watchlist.length === 0 ? (
            <p className="text-[#F5F3EE]/20 text-xs font-medium italic">No movies saved yet.</p>
          ) : (
            <ul className="space-y-3">
              {watchlist.map((title) => (
                <li key={title} className="flex items-center justify-between gap-3 group">
                  <Link
                    href={`/movie/${encodeURIComponent(title)}`}
                    className="text-xs text-[#F5F3EE]/70 hover:text-[#E6A94A] transition-colors truncate flex-1 flex items-center gap-2"
                  >
                    <Film size={12} className="text-[#F5F3EE]/20" />
                    {title}
                  </Link>
                  <button 
                    onClick={() => onRemoveWatchlist(title)} 
                    className="opacity-0 group-hover:opacity-100 text-[#F5F3EE]/20 hover:text-red-400 transition-all"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden" onClick={onMobileClose} />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-80 lg:w-96 shrink-0 h-fit sticky top-6">
        {content}
      </aside>

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[90vw] bg-[#0F1117] border-r border-[#2A2E3A] overflow-y-auto p-6 transition-transform duration-500 cubic-bezier(0.22, 1, 0.36, 1) md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {content}
      </aside>
    </>
  );
}
