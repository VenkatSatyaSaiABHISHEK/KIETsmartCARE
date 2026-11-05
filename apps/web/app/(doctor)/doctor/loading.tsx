import React from "react";

export default function DoctorLoading() {
  return (
    <div className="w-full py-6 flex flex-col gap-6 animate-pulse select-none">
      {/* Top Banner Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
        <div>
          <div className="h-7 w-48 bg-neutral-200 rounded-lg" />
          <div className="h-4 w-72 bg-neutral-100 rounded-md mt-2" />
        </div>
        <div className="h-9 w-32 bg-neutral-100 rounded-lg" />
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-neutral-50 border border-neutral-200/60 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 bg-neutral-200 rounded" />
              <div className="h-5 w-5 bg-neutral-200 rounded-full" />
            </div>
            <div className="h-6 w-14 bg-neutral-300 rounded" />
          </div>
        ))}
      </div>

      {/* Main Content Skeleton (Consultation Card) */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="h-5 w-36 bg-neutral-200 rounded" />
          <div className="h-4 w-24 bg-neutral-100 rounded" />
        </div>

        {/* Search Bar Skeleton */}
        <div className="h-11 w-full bg-neutral-100 rounded-xl" />

        {/* Prescription Rows Skeleton */}
        <div className="flex flex-col gap-3 mt-2">
          {[1, 2, 3].map((row) => (
            <div key={row} className="h-14 w-full bg-neutral-50 rounded-xl border border-neutral-100 flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-lg bg-neutral-200" />
                <div className="h-4 w-32 bg-neutral-200 rounded" />
              </div>
              <div className="h-4 w-20 bg-neutral-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
