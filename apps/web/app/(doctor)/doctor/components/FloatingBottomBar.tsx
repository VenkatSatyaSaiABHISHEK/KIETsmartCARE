"use client";

import React from "react";

interface FloatingBottomBarProps {
  summaryText: string;
  isReady: boolean;
  onReview: () => void;
}

export function FloatingBottomBar({
  summaryText,
  isReady,
  onReview,
}: FloatingBottomBarProps) {
  return (
    <div className="fixed bottom-6 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none">
      <div className="w-full max-w-[720px] h-[64px] bg-white rounded-[16px] shadow-[0_14px_36px_rgba(15,27,51,0.12),0_4px_12px_rgba(15,27,51,0.06)] border border-[#E5E7EB] flex items-center justify-between px-6 pointer-events-auto">
        {/* Left: Summary Built from Choices */}
        <div className="text-[14px] font-sans font-medium text-[#0F1B33] truncate max-w-[500px]">
          {summaryText || "Select problems and tablet schedule"}
        </div>

        {/* Right: Solid Deep-Blue Review Button */}
        <button
          type="button"
          onClick={onReview}
          disabled={!isReady}
          className="h-10 px-6 rounded-[10px] bg-[#1D4ED8] text-white text-[14px] font-medium hover:bg-[#1E40AF] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
        >
          Review
        </button>
      </div>
    </div>
  );
}

