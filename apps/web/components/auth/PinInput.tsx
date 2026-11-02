"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { UserRole } from "@/lib/auth/pin-service";

interface PinInputProps {
  role: UserRole;
  length: number;
  onComplete: (pin: string) => void;
  onBack: () => void;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  errorMessage: string | null;
  remainingAttempts?: number | null;
}

export function PinInput({
  role,
  length,
  onComplete,
  onBack,
  isLoading,
  isError,
  isSuccess,
  errorMessage,
}: PinInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const title =
    role === "doctor"
      ? "Doctor sign in"
      : role === "officer"
      ? "Officer sign in"
      : "Administrator sign in";

  const subtitle =
    role === "admin"
      ? "Enter your 8-digit code."
      : "Enter your 5-digit PIN.";

  // Auto-focus first box on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, [role]);

  // On error, clear digits and re-focus after shake
  useEffect(() => {
    if (isError) {
      const timer = setTimeout(() => {
        setDigits(Array(length).fill(""));
        inputRefs.current[0]?.focus();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isError, length]);

  const handleDigitChange = (index: number, value: string) => {
    if (isLoading || isSuccess) return;

    const cleanValue = value.replace(/[^0-9]/g, "");
    if (!cleanValue && value !== "") return;

    const newChar = cleanValue.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = newChar;
    setDigits(newDigits);

    if (newChar && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newDigits.every((d) => d !== "") && newDigits.join("").length === length) {
      onComplete(newDigits.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isLoading || isSuccess) return;

    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = "";
        setDigits(newDigits);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      if (isLoading || isSuccess) return;

      const pastedData = e.clipboardData.getData("text/plain").trim();
      const numericOnly = pastedData.replace(/[^0-9]/g, "");

      if (numericOnly.length >= length) {
        const pinChars = numericOnly.slice(0, length).split("");
        setDigits(pinChars);
        inputRefs.current[length - 1]?.focus();
        onComplete(pinChars.join(""));
      } else if (numericOnly.length > 0) {
        const newDigits = [...digits];
        for (let i = 0; i < numericOnly.length; i++) {
          newDigits[i] = numericOnly[i];
        }
        setDigits(newDigits);
        inputRefs.current[Math.min(numericOnly.length, length - 1)]?.focus();
      }
    },
    [length, digits, isLoading, isSuccess, onComplete]
  );

  return (
    <div className="w-full flex flex-col">
      {/* Ghost text back button */}
      <div className="mb-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading || isSuccess}
          className="text-[13px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer disabled:opacity-50"
        >
          ← Back
        </button>
      </div>

      {/* Headings */}
      <div className="text-left mb-6">
        <h2 className="text-[20px] font-semibold leading-tight text-[var(--text)]">
          {title}
        </h2>
        <p className="mt-1 text-[14px] text-[var(--text-muted)]">
          {subtitle}
        </p>
      </div>

      {/* PIN Boxes Container */}
      <motion.div
        animate={isError ? { x: [-4, 4, -4, 4, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-center my-2 select-none"
        onPaste={handlePaste}
      >
        {length === 8 ? (
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* First group of 4 */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {digits.slice(0, 4).map((digit, idx) => {
                const actualIdx = idx;
                return renderBox(actualIdx, digit);
              })}
            </div>

            {/* Gap 16px between box 4 and 5 */}
            <div className="w-3 sm:w-4" />

            {/* Second group of 4 */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {digits.slice(4, 8).map((digit, idx) => {
                const actualIdx = idx + 4;
                return renderBox(actualIdx, digit);
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
            {digits.map((digit, idx) => renderBox(idx, digit))}
          </div>
        )}
      </motion.div>

      {/* States Feedback below boxes */}
      <div className="min-h-[32px] flex items-center justify-center my-3">
        {isLoading && (
          <div className="flex items-center gap-2 text-[13px] text-[var(--text-muted)]">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" />
            <span>Verifying…</span>
          </div>
        )}

        {isSuccess && (
          <div className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--accent)]">
            <Check className="h-4 w-4 text-[var(--accent)] stroke-[2.5]" />
            <span>Signed in</span>
          </div>
        )}

        {errorMessage && !isLoading && !isSuccess && (
          <div
            role="alert"
            aria-live="polite"
            className="text-[13px] text-[var(--danger)] text-center"
          >
            {errorMessage}
          </div>
        )}
      </div>

      {/* Rate limit note */}
      <p className="mt-4 text-center text-[12px] text-[var(--text-muted)] leading-relaxed">
        PINs are encrypted and protected by automated rate limiting. 5 consecutive failed attempts lock the session for 15 minutes.
      </p>
    </div>
  );

  function renderBox(idx: number, digit: string) {
    const isFilled = digit !== "";

    let borderClass = "border-[var(--border)] bg-transparent text-[var(--text)]";

    if (isError) {
      borderClass = "border-[var(--danger)] text-[var(--danger)]";
    } else if (isSuccess) {
      borderClass = "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]";
    } else if (isFilled) {
      borderClass = "border-[var(--border-strong)] text-[var(--text)]";
    }

    return (
      <input
        key={idx}
        ref={(el) => {
          inputRefs.current[idx] = el;
        }}
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={1}
        value={digit}
        disabled={isLoading || isSuccess}
        onChange={(e) => handleDigitChange(idx, e.target.value)}
        onKeyDown={(e) => handleKeyDown(idx, e)}
        aria-label={`Digit ${idx + 1} of ${length}`}
        className={`w-[34px] h-[44px] sm:w-[40px] sm:h-[48px] rounded-[6px] border text-center font-mono text-[20px] font-semibold leading-none tabular-nums transition-colors duration-100 focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25 disabled:opacity-60 cursor-text ${borderClass}`}
      />
    );
  }
}
