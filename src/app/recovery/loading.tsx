export default function RecoveryLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">

      {/* Page header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-3">
          <div className="skeleton h-12 w-44 rounded-lg" />
          <div className="skeleton h-4 w-64 rounded" />
        </div>
        <div className="skeleton h-9 w-36 rounded-lg shrink-0" />
      </div>

      {/* Stat pills */}
      <div className="flex gap-4 flex-wrap mb-6">
        <div className="skeleton h-8 w-28 rounded-full" />
        <div className="skeleton h-8 w-28 rounded-full" />
        <div className="skeleton h-8 w-28 rounded-full" />
      </div>

      {/* Body maps + detail panel */}
      <div className="flex flex-col lg:flex-row lg:items-stretch gap-4">
        {/* Front + Back maps side by side */}
        <div className="flex flex-row gap-4 flex-1 min-w-0">
          <div className="skeleton flex-1 rounded-xl" style={{ minHeight: 360 }} />
          <div className="skeleton flex-1 rounded-xl" style={{ minHeight: 360 }} />
        </div>
        {/* Detail panel */}
        <div className="skeleton lg:w-72 xl:w-80 rounded-xl" style={{ minHeight: 360 }} />
      </div>

    </div>
  );
}
