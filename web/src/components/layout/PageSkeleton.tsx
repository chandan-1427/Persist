export function PageSkeleton() {
  return (
    <div className="flex min-h-screen animate-pulse">
      <div className="w-[500px] shrink-0 space-y-6 px-10 py-12">
        <div className="h-8 w-32 rounded bg-white/5" />
        <div className="h-4 w-48 rounded bg-white/5" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-white/5" />
          <div className="h-4 w-5/6 rounded bg-white/5" />
          <div className="h-4 w-4/6 rounded bg-white/5" />
        </div>
        <div className="h-24 w-full rounded bg-white/5" />
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div className="h-20 w-96 rounded bg-white/5" />
      </div>
    </div>
  )
}