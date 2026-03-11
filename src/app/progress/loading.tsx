export default function ProgressLoading() {
  return (
    <div className="px-4 sm:px-6 py-10">

      {/* Page header */}
      <div className="mb-8 space-y-3">
        <div className="skeleton h-12 w-36 rounded-lg" />
        <div className="skeleton h-4 w-56 rounded" />
      </div>

      <div className="space-y-5">

        {/* Date range pills — 5 flex-1 */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton flex-1 h-10 rounded-full" />
          ))}
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: exercise selector + 1RM chart */}
          <div className="space-y-3">
            <div className="skeleton h-10 w-full rounded-lg" />
            <div className="skeleton h-72 w-full rounded-xl" />
          </div>

          {/* Right: body weight chart — same height as left (h-10 + gap 12px + h-72 = 340px) */}
          <div className="skeleton h-[340px] w-full rounded-xl" />
        </div>

      </div>
    </div>
  );
}
