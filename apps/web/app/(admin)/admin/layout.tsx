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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased flex">
      {/* 240px Fixed Left Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="pl-[240px] flex-1 flex flex-col min-h-screen">
        <main className="flex-1 w-full max-w-[1200px] mx-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
