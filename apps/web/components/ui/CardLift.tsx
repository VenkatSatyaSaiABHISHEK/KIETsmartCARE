"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface CardLiftProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverLift?: boolean;
}

export function CardLift({
  children,
  className = "",
  onClick,
  hoverLift = true,
  ...props
}: CardLiftProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={
        hoverLift && !shouldReduceMotion
          ? { y: -2, transition: { duration: 0.2, ease: [0.2, 0, 0, 1] } }
          : undefined
      }
      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
      className={`rounded-card border border-slate-200/80 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover ${className}`}
      onClick={onClick}
      {...(props as any)}
    >
      {children}
    </motion.div>
  );
}
