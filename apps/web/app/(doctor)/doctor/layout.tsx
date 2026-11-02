import React from "react";
import { DoctorMasthead } from "./components/DoctorMasthead";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-[#0F1B33] antialiased flex flex-col font-sans">
      {/* Shared Doctor Masthead */}
      <DoctorMasthead />

      {/* Main container: max-width 1600px, centered, side padding 72px desktop, 40px tablet, 20px phone */}
      <main className="w-full flex-1 max-w-[1600px] mx-auto px-5 sm:px-10 lg:px-[72px] pb-16 sm:pb-8 flex flex-col">
        {children}
      </main>
    </div>
  );
}
