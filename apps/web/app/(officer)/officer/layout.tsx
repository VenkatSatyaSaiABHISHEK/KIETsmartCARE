import React from "react";
import { OfficerMasthead } from "./components/OfficerMasthead";
import { RealtimeToast } from "./components/RealtimeToast";

export default function OfficerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-[#0F1B33] antialiased flex flex-col font-sans">
      {/* 1. Shared Masthead rendered ONCE for all officer routes */}
      <OfficerMasthead />

      {/* 2. Page container: max-width 1600px, centered, side padding 72px desktop, 40px tablet, 20px phone */}
      <main className="w-full flex-1 max-w-[1600px] mx-auto px-5 sm:px-10 lg:px-[72px] pb-16 sm:pb-8 flex flex-col">
        {children}
      </main>

      {/* Realtime Toast notification listener */}
      <RealtimeToast />
    </div>
  );
}
