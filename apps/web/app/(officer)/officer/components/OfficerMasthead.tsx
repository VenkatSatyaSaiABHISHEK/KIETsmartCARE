"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LayoutDashboard, Bell, Users, BarChart3, ChevronRight, Search } from "lucide-react";

export function OfficerMasthead() {
  const pathname = usePathname();
  const router = useRouter();
  const [officerName, setOfficerName] = useState<string>("Health Officer");
  const [openAlertCount, setOpenAlertCount] = useState<number>(0);
  const [searchVal, setSearchVal] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    const interval = setInterval(fetchAlertCount, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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
      setIsMobileMenuOpen(false);
      router.push(`/officer/students?search=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const navLinks = [
    { href: "/officer", label: "Overview", icon: LayoutDashboard, count: 0 },
    { href: "/officer/alerts", label: "Alerts", icon: Bell, count: openAlertCount },
    { href: "/officer/students", label: "Students", icon: Users, count: 0 },
    { href: "/officer/reports", label: "Reports", icon: BarChart3, count: 0 },
  ];

  return (
    <>
      {/* Sticky Top Masthead */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md select-none shrink-0 border-b border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-[72px] h-[60px] flex items-center justify-between gap-4">
          {/* Left: Brand Icon & Navigation Links */}
          <div className="flex items-center gap-6 lg:gap-8">
            <Link
              href="/officer"
              className="flex items-center gap-2.5 hover:opacity-90 shrink-0"
              title="KIET Smart Care - Health Officer Portal"
            >
              <img
                src="/logo.png"
                alt="KIET Care Logo"
                className="h-8 w-8 rounded-lg object-contain shadow-sm border border-black/5"
              />
              <span className="hidden md:inline font-serif text-[17px] font-semibold text-[#0F1B33] tracking-tight">
                KIET Smart Care
              </span>
              <span className="inline-flex md:hidden text-[11px] font-semibold tracking-wider uppercase text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                Officer
              </span>
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
                      <span className="ml-1 px-1.5 py-0.2 rounded-full bg-red-100 text-[11px] font-bold text-[#B91C1C] tabular-nums">
                        {link.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Search, Officer Name & Outlined Sign out */}
          <div className="flex items-center gap-3 sm:gap-4">
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
              className="hidden sm:inline-flex h-7 px-3 items-center text-[12px] font-sans font-medium text-[#0F1B33] bg-white border border-[#E5E7EB] rounded-[6px] hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              Sign out
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="sm:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 bg-neutral-50 text-neutral-800 hover:bg-neutral-100 transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {isMobileMenuOpen && (
          <div className="sm:hidden w-full border-t border-[#E5E7EB] bg-white px-4 py-3 shadow-lg flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200">
            {/* Mobile Quick Search */}
            <div className="relative w-full mb-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search roll number or student name..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full h-8 pl-8 pr-3 text-[12px] bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            {/* Officer Profile & Sign out */}
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div className="text-[12px] font-semibold text-neutral-900">
                {officerName}
                <span className="block text-[10px] font-normal text-neutral-500">Surveillance Officer</span>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-[11px] font-medium text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-md transition-colors"
              >
                Sign out
              </button>
            </div>

            {/* Navigation items */}
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === "/officer"
                  ? pathname === "/officer"
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    isActive
                      ? "bg-neutral-100 font-semibold text-neutral-900"
                      : "text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${isActive ? "text-neutral-900" : "text-neutral-400"}`} />
                    <span>{link.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {link.count > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-[10px] font-bold text-red-700 tabular-nums">
                        {link.count}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-neutral-300" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Mobile Bottom Tab Bar */}
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
