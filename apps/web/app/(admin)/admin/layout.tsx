"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "./components/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased flex flex-col md:flex-row">
      {/* 240px Fixed Left Sidebar (slide-out on mobile) */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="pl-0 md:pl-[240px] pt-14 md:pt-0 flex-1 flex flex-col min-h-screen">
        <main className="flex-1 w-full max-w-[1200px] mx-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
