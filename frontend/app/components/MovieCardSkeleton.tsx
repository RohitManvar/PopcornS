export default function MovieCardSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col h-full animate-pulse">
      <div className="aspect-[2/3] bg-white/10" />
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <div className="h-4 bg-white/10 rounded w-1/2" />
        <div className="flex gap-1 mt-1">
          <div className="h-5 bg-white/10 rounded-full w-12" />
          <div className="h-5 bg-white/10 rounded-full w-10" />
        </div>
        <div className="flex gap-1">
          <div className="h-5 bg-white/10 rounded w-14" />
          <div className="h-5 bg-white/10 rounded w-12" />
        </div>
        <div className="mt-auto h-7 bg-white/10 rounded-lg" />
      </div>
    </div>
  );
}
