"use client";

import { useState, useRef, useEffect, forwardRef } from "react";
import { Search, ChevronDown } from "lucide-react";

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
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
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
          placeholder="Search or select a movie… (press / to focus)"
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-10 py-3.5 text-white/90 placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 text-sm"
        />
        <ChevronDown
          size={16}
          onClick={() => setOpen((o) => !o)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 cursor-pointer"
        />
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-2 bg-[#1a1a2e] border border-white/10 rounded-xl overflow-hidden shadow-2xl max-h-72 overflow-y-auto">
          {suggestions.map((m) => (
            <li
              key={m}
              onMouseDown={() => select(m)}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors hover:bg-amber-500/10 hover:text-amber-400 ${m === value ? "text-amber-400 bg-amber-500/10" : "text-white/80"}`}
            >
              {m}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

export default SearchBar;
