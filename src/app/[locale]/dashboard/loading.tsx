export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-[#07090E]">
      {/* Navbar skeleton */}
      <div className="h-16 border-b border-slate-800 bg-[#07090E] animate-pulse" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header skeleton */}
        <div className="h-20 rounded-2xl bg-slate-800/60 animate-pulse" />
        {/* Tabs skeleton */}
        <div className="h-12 rounded-xl bg-slate-800/60 animate-pulse" />
        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-slate-800/60 animate-pulse" />
          ))}
        </div>
      </main>
    </div>
  );
}
