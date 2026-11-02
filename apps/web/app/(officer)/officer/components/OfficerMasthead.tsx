"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function OfficerMasthead() {
  const pathname = usePathname();
  const router = useRouter();
  const [officerName, setOfficerName] = useState<string>("Health Officer");
  const [openAlertCount, setOpenAlertCount] = useState<number>(0);
  const [searchVal, setSearchVal] = useState("");

  useEffect(() => {
    // 1. Fetch authenticated officer profile
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data.user) {
          setOfficerName(data.user.name || "Health Officer");
        }
      })
      .catch(() => {});

    // 2. Fetch live open alert count
    const fetchAlertCount = () => {
      fetch("/api/officer/alerts?status=open", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.counts) {
            setOpenAlertCount(data.counts.open ?? 0);
          }
        })
        .catch(() => {});
    };

    fetchAlertCount();
    const interval = setInterval(fetchAlertCount, 15000); // 15s poll
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      window.localStorage.clear();
      window.sessionStorage.clear();
      document.cookie = "kiet_user_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "kiet_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/";
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchVal.trim()) {
      router.push(`/officer/students?search=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const navLinks = [
    { href: "/officer", label: "Overview", count: 0 },
    { href: "/officer/alerts", label: "Alerts", count: openAlertCount },
    { href: "/officer/students", label: "Students", count: 0 },
    { href: "/officer/reports", label: "Reports", count: 0 },
  ];

  return (
    <>
      {/* Top Masthead */}
      <header className="w-full bg-white select-none shrink-0 border-b border-[#E5E7EB]">
        {/* Double hairline effect: 1px border on header + 1px border on inner container */}
        <div className="w-full max-w-[1600px] mx-auto px-5 sm:px-10 lg:px-[72px] h-[60px] flex items-center justify-between gap-4 border-b border-[#E5E7EB]">
          {/* Left: Serif Wordmark & Navigation Links */}
          <div className="flex items-center gap-8">
            <Link
              href="/officer"
              className="font-serif text-[20px] font-semibold text-[#0F1B33] tracking-tight hover:opacity-90 shrink-0"
            >
              KIET Smart Care
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden sm:flex items-center gap-6 h-[60px]">
              {navLinks.map((link) => {
                const isActive =
                  link.href === "/officer"
                    ? pathname === "/officer"
                    : pathname.startsWith(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative flex items-center h-full text-[14px] transition-colors ${
                      isActive
                        ? "text-[#0F1B33] font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#0F1B33]"
                        : "text-[#6B7280] hover:text-[#0F1B33]"
                    }`}
                  >
                    <span>{link.label}</span>
                    {link.count > 0 && (
                      <span className="ml-1 text-[11px] font-semibold text-[#B91C1C] tabular-nums">
                        {link.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Search, Officer Name & Outlined Sign out */}
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block w-64">
              <input
                type="text"
                placeholder="Search roll number or name"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full h-8 pl-3 pr-3 text-[13px] bg-white border border-[#E5E7EB] rounded-[6px] text-[#0F1B33] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#0F1B33]"
              />
            </div>

            <span className="hidden lg:inline text-[13px] font-sans text-[#0F1B33] whitespace-nowrap">
              {officerName}
            </span>

            <button
              type="button"
              onClick={handleSignOut}
              className="h-7 px-3 text-[12px] font-sans font-medium text-[#0F1B33] bg-white border border-[#E5E7EB] rounded-[6px] hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar (390px friendly, 48px tap targets) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5E7EB] flex items-center justify-around h-[52px] select-none shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
        {navLinks.map((link) => {
          const isActive =
            link.href === "/officer"
              ? pathname === "/officer"
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-1 flex flex-col items-center justify-center h-full text-[12px] font-sans relative ${
                isActive
                  ? "text-[#0F1B33] font-medium after:absolute after:top-0 after:left-4 after:right-4 after:h-[2px] after:bg-[#0F1B33]"
                  : "text-[#6B7280]"
              }`}
            >
              <div className="flex items-center gap-1">
                <span>{link.label}</span>
                {link.count > 0 && (
                  <span className="text-[10px] font-bold text-[#B91C1C] tabular-nums">
                    {link.count}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
