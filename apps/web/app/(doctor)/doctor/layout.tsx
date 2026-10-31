import React from "react";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F1B3D] font-sans antialiased">
      {children}
    </div>
  );
}
