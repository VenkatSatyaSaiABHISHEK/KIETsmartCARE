"use client";

import React from "react";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  isDestructive?: boolean;
  loading?: boolean;
}

export function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  isDestructive = false,
  loading = false,
}: ConfirmActionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-xl space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                isDestructive ? "bg-red-600 text-white" : "bg-black text-white"
              }`}
            >
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-black">{title}</h3>
              <p className="mt-1 text-xs text-neutral-600 leading-relaxed">
                {description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-black"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#E5E5E5]">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border-[#E5E5E5] text-xs font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-lg text-xs font-semibold px-4 ${
              isDestructive
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-black text-white hover:bg-neutral-800"
            }`}
          >
            {loading ? "Processing..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
