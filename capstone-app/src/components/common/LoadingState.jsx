export function Skeleton({ className = "" }) {
  return <span aria-hidden="true" className={`block rounded-lg bg-slate-200 motion-safe:animate-pulse ${className}`} />;
}

export function PageLoading() {
  return (
    <div role="status" aria-label="Loading page" className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 px-6 font-[Poppins,sans-serif]">
      <img src="/assets/Logo.webp" alt="" className="h-14 w-14 rounded-full object-cover" />
      <span aria-hidden="true" className="h-7 w-7 rounded-full border-3 border-blue-200 border-t-blue-800 motion-safe:animate-spin" />
      <p className="text-sm font-medium text-slate-600">Loading page…</p>
    </div>
  );
}

export function DashboardSkeleton({ hero = false }) {
  return (
    <div role="status" aria-label="Loading dashboard" aria-busy="true">
      <span className="sr-only">Loading dashboard…</span>
      {hero && <div aria-hidden="true" className="flex min-h-80 items-center justify-center bg-slate-50 px-6 sm:min-h-90">
        <div className="w-full max-w-lg space-y-5">
          <Skeleton className="mx-auto h-9 w-3/4" />
          <Skeleton className="mx-auto h-9 w-2/3" />
          <Skeleton className="mx-auto h-4 w-full" />
        </div>
      </div>}
      <div aria-hidden="true" className={`space-y-6 ${hero ? "mx-auto max-w-7xl px-4 py-6 sm:px-6" : ""}`}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((card) => <div key={card} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-8 w-1/2" />
          </div>)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[0, 1].map((panel) => <div key={panel} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
            <Skeleton className="h-5 w-1/2" />
            {[0, 1, 2, 3].map((row) => <Skeleton key={row} className="h-10 w-full" />)}
          </div>)}
        </div>
      </div>
    </div>
  );
}
