import React from "react";
import Link from "next/link";

interface BrandWordmarkProps {
  portalLabel?: string;
  badge?: string;
  theme?: "light" | "dark" | "monochrome";
  size?: "sm" | "md" | "lg";
  href?: string;
}

export function BrandWordmark({
  portalLabel,
  badge,
  theme = "light",
  size = "md",
  href = "/",
}: BrandWordmarkProps) {
  const isDark = theme === "dark";
  const isMono = theme === "monochrome";

  const sizeClasses = {
    sm: "text-base tracking-tight",
    md: "text-lg tracking-tight",
    lg: "text-xl tracking-tight",
  };

  const content = (
    <div className="flex items-center space-x-2 select-none">
      <span
        className={`font-semibold font-sans tracking-tight leading-none ${sizeClasses[size]} ${
          isDark ? "text-white" : isMono ? "text-black" : "text-slate-900"
        }`}
      >
        KIET <span className="font-light opacity-90">Smart Care</span>
      </span>

      {portalLabel && (
        <>
          <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            /
          </span>
          <span
            className={`text-xs font-medium tracking-normal ${
              isDark ? "text-sky-300" : isMono ? "text-neutral-500" : "text-sky-700"
            }`}
          >
            {portalLabel}
          </span>
        </>
      )}

      {badge && (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            isDark
              ? "bg-sky-500/10 text-sky-300 border border-sky-400/20"
              : "bg-sky-50 text-sky-800 border border-sky-200"
          }`}
        >
          {badge}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
