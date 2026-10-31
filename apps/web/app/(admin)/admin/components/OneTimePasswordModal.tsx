"use client";

import React, { useState } from "react";
import { Copy, Check, ShieldAlert, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OneTimePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  recipientName: string;
  identifier: string; // email or roll number
  identifierLabel: string;
  temporaryPassword: string;
  roleOrNote?: string;
}

export function OneTimePasswordModal({
  isOpen,
  onClose,
  title,
  recipientName,
  identifier,
  identifierLabel,
  temporaryPassword,
  roleOrNote,
}: OneTimePasswordModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(temporaryPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-xl space-y-5">
        <div className="flex items-start space-x-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black text-white">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-black">{title}</h3>
            <p className="text-xs text-neutral-500">
              One-time temporary authentication credential
            </p>
          </div>
        </div>

        {/* Security Alert Banner */}
        <div className="rounded-lg border border-black bg-neutral-50 p-3 flex items-start space-x-2.5">
          <ShieldAlert className="h-4 w-4 shrink-0 text-black mt-0.5" />
          <div className="text-xs text-neutral-700 leading-relaxed">
            <span className="font-semibold text-black">Security Invariant:</span> This temporary
            password is shown <span className="font-bold underline">only once</span>. It is never
            stored in plaintext. The user will be required to change it on first login.
          </div>
        </div>

        {/* Recipient Details */}
        <div className="rounded-lg border border-[#E5E5E5] p-3.5 space-y-2 bg-neutral-50/50 text-xs">
          <div className="flex justify-between py-0.5 border-b border-[#E5E5E5]/60">
            <span className="text-neutral-500">Name</span>
            <span className="font-medium text-black">{recipientName}</span>
          </div>
          <div className="flex justify-between py-0.5 border-b border-[#E5E5E5]/60">
            <span className="text-neutral-500">{identifierLabel}</span>
            <span className="font-mono font-medium text-black">{identifier}</span>
          </div>
          {roleOrNote && (
            <div className="flex justify-between py-0.5">
              <span className="text-neutral-500">Role / Context</span>
              <span className="font-medium text-black capitalize">{roleOrNote}</span>
            </div>
          )}
        </div>

        {/* Temporary Password Box */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
            Generated Temporary Password
          </label>
          <div className="flex items-center space-x-2">
            <div className="flex-1 rounded-lg border border-black bg-neutral-100 px-3.5 py-2.5 font-mono text-sm font-bold tracking-wider text-black select-all">
              {temporaryPassword}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              className="rounded-lg border-black bg-white px-3 hover:bg-black hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <Check className="mr-1.5 h-4 w-4 text-black" />
                  <span className="text-xs font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-4 w-4" />
                  <span className="text-xs font-semibold">Copy</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Dismiss Button */}
        <div className="pt-2">
          <Button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-black text-white hover:bg-neutral-800 text-xs font-semibold h-10"
          >
            I Have Recorded / Transmitted These Credentials
          </Button>
        </div>
      </div>
    </div>
  );
}
