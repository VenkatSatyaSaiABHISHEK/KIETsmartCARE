import React from "react";

export type StatusVariant =
  | "active"
  | "recovered"
  | "not_recovered"
  | "worse"
  | "side_effect"
  | "open"
  | "urgent"
  | "in_treatment"
  | "warning"
  | "muted";

interface StatusDotProps {
  status?: StatusVariant | string;
  label: string;
  className?: string;
}

export function StatusDot({ status = "active", label, className = "" }: StatusDotProps) {
  const normalized = (status || "").toLowerCase();

  let dotColor = "bg-[var(--accent)]"; // emerald

  if (
    normalized === "worse" ||
    normalized === "not_recovered" ||
    normalized === "not recovered" ||
    normalized === "side_effect" ||
    normalized === "side effect" ||
    normalized === "open" ||
    normalized === "urgent" ||
    normalized === "danger" ||
    normalized === "red"
  ) {
    dotColor = "bg-[var(--danger)]"; // red
  } else if (
    normalized === "in_treatment" ||
    normalized === "treatment" ||
    normalized === "active treatment" ||
    normalized === "warning" ||
    normalized === "warn" ||
    normalized === "pending" ||
    normalized === "amber"
  ) {
    dotColor = "bg-[var(--warn)]"; // amber
  } else if (
    normalized === "recovered" ||
    normalized === "active" ||
    normalized === "good" ||
    normalized === "success" ||
    normalized === "emerald"
  ) {
    dotColor = "bg-[var(--accent)]";
  } else if (normalized === "muted" || normalized === "inactive") {
    dotColor = "bg-[var(--text-muted)]";
  }

  return (
    <span className={`inline-flex items-center gap-2 text-[13px] leading-none text-[var(--text)] ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`} />
      <span>{label}</span>
    </span>
  );
}

