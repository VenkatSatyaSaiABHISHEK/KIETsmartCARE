import React from "react";

export default function OfficerLoading() {
  return (
    <div className="w-full py-6 flex flex-col gap-6 animate-pulse select-none">
      {/* Officer Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
        <div>
          <div className="h-7 w-52 bg-neutral-200 rounded-lg" />
          <div className="h-4 w-64 bg-neutral-100 rounded-md mt-2" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 bg-neutral-100 rounded-lg" />
          <div className="h-8 w-28 bg-neutral-200 rounded-lg" />
        </div>
      </div>

      {/* Surveillance Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-neutral-50 border border-neutral-200/60 p-4 flex flex-col justify-between">
            <div className="h-3 w-20 bg-neutral-200 rounded" />
            <div className="h-8 w-16 bg-neutral-300 rounded" />
            <div className="h-3 w-28 bg-neutral-100 rounded" />
          </div>
        ))}
      </div>

      {/* Live Table / Feed Skeleton */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-40 bg-neutral-200 rounded" />
          <div className="h-4 w-20 bg-neutral-100 rounded" />
        </div>

        <div className="flex flex-col divide-y divide-neutral-100">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-neutral-200" />
                <div>
                  <div className="h-4 w-36 bg-neutral-200 rounded" />
                  <div className="h-3 w-24 bg-neutral-100 rounded mt-1.5" />
                </div>
              </div>
              <div className="h-6 w-20 bg-neutral-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
