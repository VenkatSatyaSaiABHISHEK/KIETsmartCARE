"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function DoctorMasthead() {
  const pathname = usePathname();
  const [doctorName, setDoctorName] = useState<string>("Doctor");
  const [doctorQualification, setDoctorQualification] = useState<string>("MBBS");
  const [openAlertCount, setOpenAlertCount] = useState<number>(0);

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
    { href: "/doctor", label: "Consultation", count: 0 },
    { href: "/doctor/today", label: "Today's patients", count: 0 },
    { href: "/doctor/alerts", label: "Alerts", count: openAlertCount },
    { href: "/doctor/records", label: "Records", count: 0 },
    { href: "/doctor/test", label: "Test Alarm", count: 0 },
  ];

  return (
    <header className="w-full bg-white select-none shrink-0 border-b border-[#E5E7EB]">
      {/* Double hairline effect: outer border-b + inner container border-b */}
      <div className="w-full max-w-[1600px] mx-auto px-5 sm:px-10 lg:px-[72px] h-[64px] flex items-center justify-between gap-4 border-b border-[#E5E7EB]">
        {/* Left: Serif Wordmark & Navigation Links */}
        <div className="flex items-center gap-8">
          <Link
            href="/doctor"
            className="font-serif text-[20px] font-semibold text-[#0F1B33] tracking-tight hover:opacity-90 shrink-0"
          >
            KIET Smart Care
          </Link>

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
                    <span className="ml-1 text-[11px] font-semibold text-[#B91C1C] tabular-nums">
                      {link.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Doctor's Name, Qualification & Outlined Sign out */}
        <div className="flex items-center gap-5">
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
            className="h-8 px-3.5 text-[12px] font-sans font-medium text-[#0F1B33] bg-white border border-[#E5E7EB] rounded-[10px] hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

