export default function ProgressLoading() {
  return (
    <div className="px-4 sm:px-6 py-12">

      {/* Page header */}
      <div className="mb-8 space-y-3">
        <div className="skeleton h-12 w-36 rounded-lg" />
        <div className="skeleton h-4 w-56 rounded" />
      </div>

      <div className="space-y-5">

        {/* Exercise search */}
        <div className="skeleton h-[42px] w-full rounded-lg" />

        {/* Date range pills */}
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton h-8 w-20 rounded-full" />
          ))}
        </div>

        {/* Stats — stacked */}
        <div className="flex flex-col gap-3">
          <div className="skeleton h-24 rounded-xl" />
          <div className="skeleton h-24 rounded-xl" />
        </div>

        {/* Charts — side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="skeleton h-72 w-full rounded-xl" />
          <div className="skeleton h-72 w-full rounded-xl" />
        </div>

      </div>
    </div>
  );
}
