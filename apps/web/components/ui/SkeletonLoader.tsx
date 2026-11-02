import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function SkeletonLoader({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200/70 dark:bg-slate-800 ${className}`}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-card border border-slate-200/80 bg-white p-5 shadow-card space-y-3">
      <SkeletonLoader className="h-4 w-28" />
      <SkeletonLoader className="h-8 w-20" />
      <SkeletonLoader className="h-3 w-36" />
    </div>
  );
}
