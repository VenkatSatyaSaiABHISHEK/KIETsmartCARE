"use client";

import { useEffect } from "react";

export default function AdminLoginRedirect() {
  useEffect(() => {
    window.location.href = "/";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-xs text-slate-500 font-sans">
      Redirecting to Central PIN Authentication...
    </div>
  );
}
