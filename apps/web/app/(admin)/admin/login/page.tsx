"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLoginPage() {
  const router = useRouter();

  // Step 1: email & password, Step 2: 6-digit TOTP MFA
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("admin@kiet.edu");
  const [password, setPassword] = useState("Kiet@Admin2026!");
  const [mfaCode, setMfaCode] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [accessDeniedRole, setAccessDeniedRole] = useState<string | null>(null);

  // Check if someone with a different role is currently logged in
  React.useEffect(() => {
    const cookies = document.cookie.split(";").map((c) => c.trim());
    const roleCookie = cookies.find((c) => c.startsWith("kiet_user_role="));
    if (roleCookie) {
      const role = roleCookie.split("=")[1];
      if (role && role !== "admin") {
        setAccessDeniedRole(role);
      }
    }
  }, []);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Administrative authentication failed");
      }

      setTempToken(data.temp_token);
      setStep(2);
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Mfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_mfa",
          temp_token: tempToken,
          code: mfaCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "MFA TOTP code verification failed");
      }

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccount = async () => {
    await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    document.cookie = "kiet_user_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setAccessDeniedRole(null);
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Access Denied Banner for Non-Admin */}
        {accessDeniedRole && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 space-y-2">
            <div className="flex items-center space-x-2 text-red-800 font-bold text-xs uppercase tracking-wider">
              <UserX className="h-4 w-4" />
              <span>Access Denied for Role &apos;{accessDeniedRole}&apos;</span>
            </div>
            <p className="text-xs text-red-700 leading-relaxed">
              You are currently signed in as a <strong className="capitalize">{accessDeniedRole}</strong>.
              The Admin CRM console is strictly restricted to institutional administrators with multi-factor
              authentication.
            </p>
            <div className="pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSwitchAccount}
                className="rounded-lg border-red-300 bg-white text-xs font-semibold text-red-700 hover:bg-red-100"
              >
                Sign Out of &apos;{accessDeniedRole}&apos; & Continue as Admin
              </Button>
            </div>
          </div>
        )}

        {/* Card */}
        <div className="rounded-lg border border-[#E5E5E5] bg-white p-7 shadow-sm space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-black text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="text-base font-bold text-black uppercase tracking-wider">
              KIET Smart Care // Admin Login
            </h1>
            <p className="text-xs text-neutral-500">
              Institutional security console & credentials management
            </p>
          </div>

          {/* Rate Limiting & Zero Medical Note */}
          <div className="rounded-lg border border-[#E5E5E5] bg-neutral-50 p-3 space-y-1 text-xs">
            <div className="flex items-center space-x-1.5 font-semibold text-black uppercase tracking-wider text-[10px]">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Zero-Medical-Access Invariant</span>
            </div>
            <p className="text-[11px] text-neutral-600 leading-snug">
              Protected by hardware/app TOTP MFA. Failed attempts are rate-limited to 5 tries per 15 minutes.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-neutral-300 bg-neutral-100 p-3 text-xs text-black flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-black" />
              <div className="leading-snug">{error}</div>
            </div>
          )}

          {/* Step 1: Admin Credentials */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Administrator Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@kiet.edu"
                    className="w-full rounded-lg border border-[#E5E5E5] pl-9 pr-3 py-2 text-xs text-black placeholder:text-neutral-400 focus:border-black focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Master Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-lg border border-[#E5E5E5] pl-9 pr-3 py-2 text-xs text-black placeholder:text-neutral-400 focus:border-black focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-black text-white hover:bg-neutral-800 text-xs font-semibold h-10"
              >
                {loading ? "Authenticating..." : "Proceed to MFA Verification"}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </form>
          )}

          {/* Step 2: TOTP MFA Authenticator Code */}
          {step === 2 && (
            <form onSubmit={handleStep2Mfa} className="space-y-4 text-xs">
              <div className="rounded-lg border border-black bg-neutral-50 p-3 text-center space-y-1">
                <div className="font-semibold text-black uppercase tracking-wider text-[11px] flex items-center justify-center space-x-1.5">
                  <KeyRound className="h-4 w-4" />
                  <span>Step 2: 2-Factor Authenticator (TOTP)</span>
                </div>
                <p className="text-[11px] text-neutral-600">
                  Open Google Authenticator or hardware token. Enter 6-digit verification code.
                </p>
                <div className="text-[10px] text-neutral-400 pt-1">
                  Development code: <span className="font-mono font-bold text-black">123456</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 uppercase tracking-wider mb-1 text-center">
                  6-Digit Authenticator Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  autoFocus
                  className="w-full text-center tracking-[0.5em] rounded-lg border border-black px-3 py-2.5 text-base font-mono font-bold text-black focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="rounded-lg border-[#E5E5E5] text-xs h-10"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading || mfaCode.length !== 6}
                  className="flex-1 rounded-lg bg-black text-white hover:bg-neutral-800 text-xs font-semibold h-10"
                >
                  {loading ? "Verifying Token..." : "Verify & Enter Console"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
