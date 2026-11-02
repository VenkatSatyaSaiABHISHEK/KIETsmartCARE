"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface FloatingActionBarProps {
  children: React.ReactNode;
  visible?: boolean;
  className?: string;
}

export function FloatingActionBar({
  children,
  visible = true,
  className = "",
}: FloatingActionBarProps) {
  const shouldReduceMotion = useReducedMotion();

  if (!visible) return null;

  return (
    <motion.aside
      aria-label="Action toolbar"
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-2xl rounded-card border border-slate-200/90 bg-white/90 backdrop-blur-md px-5 py-3.5 shadow-floating ${className}`}
    >
      <div className="flex items-center justify-between gap-4">
        {children}
      </div>
    </motion.aside>
  );
}
