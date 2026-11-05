"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RoleSelector } from "@/components/auth/RoleSelector";
import { PinInput } from "@/components/auth/PinInput";
import { UserRole } from "@/lib/auth/pin-service";

export default function PinLoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [isCatPeeking, setIsCatPeeking] = useState(false);

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setIsError(false);
    setIsSuccess(false);
    setErrorMessage(null);
  };

  const handleBackToRoles = () => {
    setSelectedRole(null);
    setIsError(false);
    setIsSuccess(false);
    setErrorMessage(null);
  };

  const handlePinSubmit = async (pin: string) => {
    if (!selectedRole || isLoading || isSuccess) return;

    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/pin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole, pin }),
      });

      const data = await res.json();

      if (data.success) {
        setIsSuccess(true);
        setIsLoading(false);
        setTimeout(() => {
          window.location.href = data.redirectUrl || `/${selectedRole}`;
        }, 500);
      } else {
        setIsError(true);
        setIsLoading(false);
        setErrorMessage(data.error || "Incorrect PIN entered.");
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
        }
      }
    } catch (err: any) {
      setIsError(true);
      setIsLoading(false);
      setErrorMessage(err?.message || "Connection failed. Please check network.");
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center bg-[var(--bg)] px-6 py-12 overflow-x-hidden">
      {/* Cat peeking upside down (180deg) from the top border of the screen */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 z-40 cursor-pointer select-none group"
        onClick={() => setIsCatPeeking((prev) => !prev)}
        title="Campus Cat peeking upside-down from top"
      >
        <div
          className="w-[190px] h-[130px] overflow-hidden flex items-center justify-center transition-all duration-500 ease-out group-hover:translate-y-3"
          style={{
            transform: `rotate(180deg) ${isCatPeeking ? 'translateY(-14px)' : 'translateY(0px)'}`,
            marginTop: '-22px', // Hugs the top edge so it feels like it is emerging from the screen border
            filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.06))',
          }}
        >
          <iframe
            src="https://lottie.host/embed/9e506062-5f1a-4fe1-a03a-df1822b1b1b9/taZABzSbck.lottie"
            className="w-full h-full border-0 pointer-events-none"
            style={{ background: 'transparent' }}
            title="Campus Cat Animation"
          />
        </div>
      </div>

      {/* Centered Single Column (max-w 460px) */}
      <div className="w-full max-w-[460px] flex flex-col items-center">
        <AnimatePresence mode="wait">
          {!selectedRole ? (
            <motion.div
              key="roles"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="w-full flex flex-col items-center"
            >
              <div className="text-center mb-9">
                <h1 className="text-[36px] sm:text-[42px] font-bold leading-none text-black tracking-tight flex items-center justify-center gap-2.5">
                  <span className="font-[family-name:var(--font-geist)]">Who are</span>
                  <span className="relative inline-block px-3.5 py-1">
                    <span className="relative z-10 font-[family-name:var(--font-cursive)] font-bold text-[46px] sm:text-[54px] text-black tracking-wide -rotate-1 inline-block select-none">
                      you?
                    </span>
                    <svg
                      viewBox="0 0 170 76"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute -inset-x-3.5 -inset-y-3 w-[calc(100%+28px)] h-[calc(100%+24px)] pointer-events-none overflow-visible"
                    >
                      {/* Perpetual non-stop animated sketch loop */}
                      <motion.path
                        d="M 30,42 C 16,18 52,6 96,8 C 144,9 170,20 164,42 C 156,64 108,72 52,70 C 20,68 8,54 28,34 C 42,20 72,16 104,18"
                        stroke="#000000"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{
                          pathLength: [0, 1, 1, 0],
                          opacity: [0, 1, 1, 0],
                        }}
                        transition={{
                          duration: 3.2,
                          times: [0, 0.45, 0.85, 1],
                          ease: "easeInOut",
                          repeat: Infinity,
                          repeatDelay: 0.3,
                        }}
                      />
                    </svg>
                  </span>
                </h1>
                <p className="mt-3.5 text-[14px] text-black/50 font-normal">
                  Select your role to continue.
                </p>
              </div>

              <RoleSelector onSelectRole={handleSelectRole} />
            </motion.div>
          ) : (
            <motion.div
              key="pin"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="w-full"
            >
              <PinInput
                role={selectedRole}
                length={selectedRole === "admin" ? 8 : 5}
                onComplete={handlePinSubmit}
                onBack={handleBackToRoles}
                isLoading={isLoading}
                isError={isError}
                isSuccess={isSuccess}
                errorMessage={errorMessage}
                remainingAttempts={remainingAttempts}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed bottom-center footer */}
      <footer className="fixed bottom-6 left-0 right-0 text-center select-none pointer-events-none">
        <p className="text-[12px] text-[var(--text-muted)]">
          KIET Group of Institutions
        </p>
      </footer>
    </div>
  );
}
