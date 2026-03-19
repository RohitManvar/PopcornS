"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface Props {
  title: string;
  trailerUrl: string;
  onClose: () => void;
}

export default function TrailerModal({ title, trailerUrl, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 text-white/60 hover:text-white bg-black/60 rounded-full p-1.5 transition-colors"
        >
          <X size={18} />
        </button>
        <iframe
          src={`${trailerUrl}?autoplay=1&rel=0`}
          title={`${title} trailer`}
          className="w-full h-full"
          allowFullScreen
          allow="autoplay; encrypted-media"
        />
      </div>
    </div>
  );
}
