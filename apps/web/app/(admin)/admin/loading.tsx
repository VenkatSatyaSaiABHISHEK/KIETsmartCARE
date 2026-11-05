import React from "react";

export default function AdminLoading() {
  return (
    <div className="w-full py-6 flex flex-col gap-6 animate-pulse select-none">
      {/* Admin Dashboard Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
        <div>
          <div className="h-7 w-48 bg-neutral-200 rounded-lg" />
          <div className="h-4 w-60 bg-neutral-100 rounded-md mt-2" />
        </div>
        <div className="h-9 w-28 bg-neutral-200 rounded-lg" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-white border border-neutral-200 p-4 shadow-sm flex flex-col justify-between">
            <div className="h-3 w-24 bg-neutral-200 rounded" />
            <div className="h-7 w-16 bg-neutral-300 rounded" />
            <div className="h-2.5 w-32 bg-neutral-100 rounded" />
          </div>
        ))}
      </div>

      {/* Data Table Skeleton */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-44 bg-neutral-200 rounded" />
          <div className="h-8 w-28 bg-neutral-100 rounded-lg" />
        </div>

        <div className="flex flex-col gap-2.5 mt-2">
          {[1, 2, 3, 4].map((r) => (
            <div key={r} className="h-12 w-full bg-neutral-50 rounded-xl border border-neutral-100 flex items-center justify-between px-4">
              <div className="h-4 w-40 bg-neutral-200 rounded" />
              <div className="h-4 w-24 bg-neutral-100 rounded" />
              <div className="h-4 w-16 bg-neutral-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
