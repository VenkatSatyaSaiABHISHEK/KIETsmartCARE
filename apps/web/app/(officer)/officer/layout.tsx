import React from "react";
import { OfficerSidebar } from "./components/OfficerSidebar";
import { RealtimeToast } from "./components/RealtimeToast";

export default function OfficerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F7F9FD] text-[#0F1B3D] antialiased">
      {/* Sidebar navigation */}
      <OfficerSidebar redAlertCount={3} />

      {/* Main Content Area */}
      <div className="md:pl-64 flex flex-col flex-1 min-h-screen">
        <main className="flex-1 pb-16">
          {children}
        </main>
      </div>

      {/* Unobtrusive Supabase Realtime notification toast */}
      <RealtimeToast />
    </div>
  );
}
