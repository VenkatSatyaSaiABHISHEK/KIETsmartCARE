"use client";

import React, { useState } from "react";
import { UserPlus, X, Stethoscope, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StaffMember } from "@/lib/admin/types";

interface CreateStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (staff: StaffMember, temporaryPassword: string) => void;
}

export function CreateStaffModal({ isOpen, onClose, onSuccess }: CreateStaffModalProps) {
  const [role, setRole] = useState<"doctor" | "officer">("doctor");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [qualification, setQualification] = useState("MBBS, MD");
  const [designation, setDesignation] = useState("Campus Clinic OPD Doctor");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Staff full name is required");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("A valid email address is required");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      setError("Phone number must be exactly 10 digits");
      return;
    }
    const cleanPin = pin.trim();
    if (!/^\d{5}$/.test(cleanPin)) {
      setError("PIN must be exactly 5 numeric digits (e.g. 12345)");
      return;
    }
    if (cleanPin !== confirmPin.trim()) {
      setError("PINs do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          name: name.trim(),
          email: email.trim(),
          phone: cleanPhone,
          pin: cleanPin,
          qualification: role === "doctor" ? qualification.trim() : undefined,
          designation: role === "doctor" ? designation.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create staff member");
      }

      onSuccess(data.staff, cleanPin);
      onClose();
      // Reset form
      setName("");
      setEmail("");
      setPhone("");
      setPin("");
      setConfirmPin("");
    } catch (err: any) {
      setError(err?.message || "Failed to provision staff account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-black">
                Provision Staff Account
              </h2>
              <p className="text-xs text-neutral-500">
                Executes via Supabase Service Role Key on server
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-black"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Role selector cards */}
          <div>
            <label className="block font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
              Select Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setRole("doctor")}
                className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                  role === "doctor"
                    ? "border-black bg-neutral-50"
                    : "border-[#E5E5E5] bg-white hover:border-neutral-400"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Stethoscope className="h-4 w-4 text-black" />
                  <span className="font-bold text-black">Campus Doctor</span>
                </div>
                <p className="mt-1 text-[11px] text-neutral-500 leading-snug">
                  OPD consultations, visits, digital prescriptions & red alert intake.
                </p>
              </div>

              <div
                onClick={() => setRole("officer")}
                className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                  role === "officer"
                    ? "border-black bg-neutral-50"
                    : "border-[#E5E5E5] bg-white hover:border-neutral-400"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-black" />
                  <span className="font-bold text-black">Health Officer</span>
                </div>
                <p className="mt-1 text-[11px] text-neutral-500 leading-snug">
                  Executive CRM, adherence surveillance, tele-outreach & call logs.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              placeholder={role === "doctor" ? "Dr. Priya Sharma" : "Officer Suresh Varma"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-xs text-black placeholder:text-neutral-400 focus:border-black focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              KIET Institutional Email
            </label>
            <input
              type="email"
              placeholder="priya.sharma@kiet.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-xs text-black placeholder:text-neutral-400 focus:border-black focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Mobile Phone (10 digits)
            </label>
            <input
              type="tel"
              maxLength={10}
              placeholder="9848012345"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-xs text-black placeholder:text-neutral-400 focus:border-black focus:outline-none font-mono"
              required
            />
          </div>

          {role === "doctor" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Qualifications
                </label>
                <input
                  type="text"
                  placeholder="MBBS, MD"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-xs text-black placeholder:text-neutral-400 focus:border-black focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Designation / Specialization
                </label>
                <input
                  type="text"
                  placeholder="Campus Clinic OPD Doctor"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-xs text-black placeholder:text-neutral-400 focus:border-black focus:outline-none"
                  required
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Assign 5-Digit Login PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={5}
                placeholder="5 digits (e.g. 12345)"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-xs text-black placeholder:text-neutral-400 focus:border-black focus:outline-none font-mono tracking-widest"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Confirm 5-Digit PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={5}
                placeholder="Confirm PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-xs text-black placeholder:text-neutral-400 focus:border-black focus:outline-none font-mono tracking-widest"
                required
              />
            </div>
          </div>

          <div className="rounded-lg border border-[#E5E5E5] bg-neutral-50 p-2.5 text-[11px] text-neutral-600">
            The assigned 5-digit PIN will be cryptographically hashed (bcrypt) and saved directly for immediate portal login.
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
              type="submit"
              disabled={loading}
              className="rounded-lg bg-black text-white hover:bg-neutral-800 text-xs font-semibold px-4"
            >
              {loading ? "Creating Account..." : "Provision Staff Account"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
