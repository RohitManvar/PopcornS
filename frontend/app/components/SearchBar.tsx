"use client";

import { useState, useRef, useEffect, forwardRef } from "react";
import { Search, ChevronDown, Sparkles } from "lucide-react";

interface Props {
  movies: string[];
  value: string;
  onChange: (v: string) => void;
  onSearch: (v: string) => void;
}

const SearchBar = forwardRef<HTMLInputElement, Props>(function SearchBar(
  { movies, value, onChange, onSearch },
  ref
) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = query.length > 0
    ? movies.filter((m) => m.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : movies.slice(0, 8);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function select(movie: string) {
    setQuery(movie);
    onChange(movie);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative flex-1">
      <div className="relative group">
        <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#F5F3EE]/20 group-focus-within:text-[#E6A94A] transition-colors" />
        <input
          ref={ref}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "Enter" && suggestions.length > 0) select(suggestions[0]);
          }}
          placeholder="Search for a cinematic masterpiece…"
          className="w-full bg-[#171923] border border-[#2A2E3A] rounded-2xl pl-14 pr-12 py-4 text-[#F5F3EE] placeholder:text-[#F5F3EE]/20 focus:outline-none focus:border-[#E6A94A]/40 text-base shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] transition-all"
        />
        <ChevronDown
          size={18}
          onClick={() => setOpen((o) => !o)}
          className="absolute right-5 top-1/2 -translate-y-1/2 text-[#F5F3EE]/20 cursor-pointer hover:text-[#E6A94A] transition-colors"
        />
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-3 bg-[#171923] border border-[#2A2E3A] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-h-80 overflow-y-auto backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
          {suggestions.map((m) => (
            <li
              key={m}
              onMouseDown={() => select(m)}
              className={`px-5 py-3.5 text-sm cursor-pointer transition-all hover:bg-[#E6A94A]/10 hover:text-[#E6A94A] flex items-center gap-3 ${m === value ? "text-[#E6A94A] bg-[#E6A94A]/5 font-bold" : "text-[#F5F3EE]/80"}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full transition-all ${m === value ? "bg-[#E6A94A] scale-125" : "bg-transparent"}`} />
              {m}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

export default SearchBar;
