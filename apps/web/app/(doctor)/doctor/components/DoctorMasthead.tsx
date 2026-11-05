"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronRight, Stethoscope, Users, Bell, FileText, Activity } from "lucide-react";

export function DoctorMasthead() {
  const pathname = usePathname();
  const [doctorName, setDoctorName] = useState<string>("Doctor");
  const [doctorQualification, setDoctorQualification] = useState<string>("MBBS");
  const [openAlertCount, setOpenAlertCount] = useState<number>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    // 1. Fetch authenticated doctor profile
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data.user) {
          const name = data.user.name || "Doctor";
          setDoctorName(name.startsWith("Dr.") ? name : `Dr. ${name}`);
          setDoctorQualification(data.user.qualification || "MBBS, MD");
        }
      })
      .catch(() => {});

    // 2. Fetch live alert count for this doctor
    const fetchAlertCount = () => {
      fetch("/api/doctor/alerts", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.alerts) {
            setOpenAlertCount(data.alerts.length);
          }
        })
        .catch(() => {});
    };

    fetchAlertCount();
    const interval = setInterval(fetchAlertCount, 20000);
    return () => clearInterval(interval);
  }, []);

  // Close mobile menu whenever pathname changes
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

  const navLinks = [
    { href: "/doctor", label: "Consultation", icon: Stethoscope, count: 0 },
    { href: "/doctor/today", label: "Today's patients", icon: Users, count: 0 },
    { href: "/doctor/alerts", label: "Alerts", icon: Bell, count: openAlertCount },
    { href: "/doctor/records", label: "Records", icon: FileText, count: 0 },
    { href: "/doctor/test", label: "Test Alarm", icon: Activity, count: 0 },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md select-none shrink-0 border-b border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-[72px] h-[64px] flex items-center justify-between gap-4">
        {/* Left: Brand Icon & Navigation */}
        <div className="flex items-center gap-6 lg:gap-8">
          <Link
            href="/doctor"
            className="flex items-center gap-2.5 hover:opacity-90 shrink-0"
            title="KIET Smart Care - Doctor Portal"
          >
            {/* Compact Brand Logo Icon replacing long text */}
            <img
              src="/logo.png"
              alt="KIET Care Logo"
              className="h-8 w-8 rounded-lg object-contain shadow-sm border border-black/5"
            />
            <span className="hidden md:inline font-serif text-[17px] font-semibold text-[#0F1B33] tracking-tight">
              KIET Smart Care
            </span>
            <span className="inline-flex md:hidden text-[11px] font-semibold tracking-wider uppercase text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
              OPD
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center gap-6 h-[64px]">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/doctor"
                  ? pathname === "/doctor"
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center h-full text-[14px] transition-colors ${
                    isActive
                      ? "text-[#1D4ED8] font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#1D4ED8]"
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

        {/* Right: Desktop Doctor Profile & Mobile Hamburger Menu Button */}
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="text-right hidden sm:block">
            <div className="font-serif font-bold text-[14px] text-[#0F1B33] leading-tight">
              {doctorName}
            </div>
            <div className="text-[12px] font-sans text-[#6B7280] leading-tight mt-0.5">
              {doctorQualification}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="hidden sm:inline-flex h-8 px-3.5 items-center text-[12px] font-sans font-medium text-[#0F1B33] bg-white border border-[#E5E7EB] rounded-[10px] hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            Sign out
          </button>

          {/* Mobile Hamburger Burger Button */}
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

      {/* Mobile Drawer Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden w-full border-t border-[#E5E7EB] bg-white px-4 py-3 shadow-lg flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-200">
          {/* Doctor Info Banner */}
          <div className="flex items-center justify-between pb-2.5 mb-1.5 border-b border-neutral-100">
            <div>
              <div className="font-serif font-bold text-[14px] text-[#0F1B33]">
                {doctorName}
              </div>
              <div className="text-[11px] font-sans text-neutral-500">
                {doctorQualification} &bull; Campus OPD
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-[11px] font-medium text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-md transition-colors"
            >
              Sign out
            </button>
          </div>

          {/* Navigation Items */}
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === "/doctor"
                ? pathname === "/doctor"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-[14px] transition-colors ${
                  isActive
                    ? "bg-blue-50 font-semibold text-blue-700"
                    : "text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-neutral-400"}`} />
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
  );
}
