export function PageSkeleton() {
  return (
    <div className="flex min-h-screen animate-pulse">
      {/* Sidebar skeleton — mirrors Sidebar.tsx spacing (pr-10 pl-4 py-12 mt-5) */}
      <div className="w-[500px] shrink-0 space-y-10 border-r border-white/10 pr-10 pl-4 py-12 mt-5">
        <div className="space-y-3">
          <div className="h-3 w-20 bg-white/5" />
          <div className="h-4 w-40 bg-white/5" />
          <div className="space-y-2 pt-1">
            <div className="h-3 w-full bg-white/5" />
            <div className="h-3 w-5/6 bg-white/5" />
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 space-y-3">
          <div className="h-3 w-24 bg-white/5" />
          <div className="h-6 w-32 bg-white/5" />
          <div className="h-3 w-40 bg-white/5" />
          <div className="mt-6 grid grid-cols-2 gap-2">
            <div className="h-9 bg-white/5" />
            <div className="h-9 bg-white/5" />
          </div>
        </div>
      </div>

      {/* Main content skeleton — eyebrow + big display line, neutral for hero or countdown */}
      <div className="flex flex-1 items-center px-16">
        <div className="w-full max-w-2xl space-y-6">
          <div className="h-3 w-28 bg-white/5" />
          <div className="h-16 w-full bg-white/5 md:h-20" />
          <div className="h-16 w-2/3 bg-white/5 md:h-20" />
        </div>
      </div>
    </div>
  )
}