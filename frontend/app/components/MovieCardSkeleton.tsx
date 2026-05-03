export default function MovieCardSkeleton() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      <div className="aspect-[2/3] bg-[#1A1C26] rounded-2xl shadow-lg border border-[#2A2E3A]/50" />
      <div className="mt-4 px-1 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="h-5 bg-[#1A1C26] rounded-md w-3/4" />
          <div className="h-4 bg-[#1A1C26] rounded-full w-8" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 bg-[#1A1C26] rounded-full w-10" />
          <div className="h-3 bg-[#1A1C26] rounded-full w-2" />
          <div className="h-3 bg-[#1A1C26] rounded-full w-16" />
        </div>
      </div>
    </div>
  );
}
