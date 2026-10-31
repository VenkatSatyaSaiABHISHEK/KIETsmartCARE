"use client";

import React, { useState } from "react";
import { UserPlus, X, Upload, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminStudent } from "@/lib/admin/types";

interface CreateStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (student: AdminStudent, temporaryPassword: string) => void;
}

const COMMON_ALLERGIES = [
  "Paracetamol",
  "Penicillin",
  "Aspirin",
  "Ibuprofen",
  "Sulfa drugs",
  "Ciprofloxacin",
  "Peanuts",
  "Dairy",
];

const BRANCHES = [
  "CSE",
  "ECE",
  "IT",
  "ME",
  "CE",
  "EEE",
  "CS-AI",
  "CS-DS",
];

export function CreateStudentModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateStudentModalProps) {
  const [rollNumber, setRollNumber] = useState("");
  const [name, setName] = useState("");
  const [branch, setBranch] = useState("CSE");
  const [year, setYear] = useState<number>(1);
  const [phone, setPhone] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState("");
  const [photoSelected, setPhotoSelected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleToggleAllergy = (allergy: string) => {
    if (allergies.includes(allergy)) {
      setAllergies(allergies.filter((a) => a !== allergy));
    } else {
      setAllergies([...allergies, allergy]);
    }
  };

  const handleAddCustomAllergy = (e: React.FormEvent) => {
    e.preventDefault();
    if (customAllergy.trim() && !allergies.includes(customAllergy.trim())) {
      setAllergies([...allergies, customAllergy.trim()]);
      setCustomAllergy("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanRoll = rollNumber.trim().toUpperCase();
    if (!cleanRoll) {
      setError("Roll number is required");
      return;
    }
    if (!name.trim()) {
      setError("Student full name is required");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      setError("Phone number must be exactly 10 digits");
      return;
    }
    const cleanEmergency = emergencyContact.replace(/\D/g, "");
    if (cleanEmergency.length !== 10) {
      setError("Emergency contact phone must be exactly 10 digits");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roll_number: cleanRoll,
          name: name.trim(),
          branch,
          year,
          phone: cleanPhone,
          emergency_contact: cleanEmergency,
          allergies,
          avatar_url: photoSelected
            ? `supabase://avatars/students/${cleanRoll}.jpg`
            : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to enroll student");
      }

      onSuccess(data.student, data.temporary_password);
      onClose();
      // Reset form
      setRollNumber("");
      setName("");
      setPhone("");
      setEmergencyContact("");
      setAllergies([]);
      setPhotoSelected(false);
    } catch (err: any) {
      setError(err?.message || "Failed to create student record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-xl my-8">
        <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-black">
                Enroll Student
              </h2>
              <p className="text-xs text-neutral-500">
                Single student registration with automatic temporary password
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Roll Number
              </label>
              <input
                type="text"
                placeholder="2100290100045"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-xs text-black placeholder:text-neutral-400 focus:border-black focus:outline-none font-mono"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-xs text-black placeholder:text-neutral-400 focus:border-black focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Branch / Department
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-xs text-black bg-white focus:border-black focus:outline-none"
              >
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b} - Engineering
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Academic Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10))}
                className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-xs text-black bg-white focus:border-black focus:outline-none"
              >
                <option value={1}>1st Year (Freshman)</option>
                <option value={2}>2nd Year (Sophomore)</option>
                <option value={3}>3rd Year (Junior)</option>
                <option value={4}>4th Year (Senior)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Student Mobile (10 digits)
              </label>
              <input
                type="tel"
                maxLength={10}
                placeholder="9848011223"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-xs text-black placeholder:text-neutral-400 focus:border-black focus:outline-none font-mono"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Emergency Contact Phone
              </label>
              <input
                type="tel"
                maxLength={10}
                placeholder="9848099887"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-xs text-black placeholder:text-neutral-400 focus:border-black focus:outline-none font-mono"
                required
              />
            </div>
          </div>

          {/* Photo upload mock */}
          <div>
            <label className="block font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Student Photo (Private Supabase Storage)
            </label>
            <div className="flex items-center space-x-3 rounded-lg border border-dashed border-[#E5E5E5] p-3 bg-neutral-50">
              <Upload className="h-4 w-4 text-neutral-500" />
              <div className="flex-1 text-[11px] text-neutral-600">
                {photoSelected
                  ? "student_id_photo.jpg (Simulated private bucket upload)"
                  : "Upload official ID photograph for clinic doctor verification"}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPhotoSelected(!photoSelected)}
                className="rounded-lg border-[#E5E5E5] text-[11px] h-7"
              >
                {photoSelected ? "Remove" : "Select Image"}
              </Button>
            </div>
          </div>

          {/* Allergies tag manager */}
          <div>
            <label className="block font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
              Medical Allergies & Drug Sensitivities
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_ALLERGIES.map((allergy) => {
                const isSelected = allergies.includes(allergy);
                return (
                  <button
                    key={allergy}
                    type="button"
                    onClick={() => handleToggleAllergy(allergy)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium border transition-colors ${
                      isSelected
                        ? "border-black bg-black text-white"
                        : "border-[#E5E5E5] bg-white text-neutral-700 hover:border-black"
                    }`}
                  >
                    {allergy}
                  </button>
                );
              })}
            </div>

            {/* Custom allergy input */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Add other known allergy (e.g. Erythromycin)"
                value={customAllergy}
                onChange={(e) => setCustomAllergy(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (customAllergy.trim() && !allergies.includes(customAllergy.trim())) {
                      setAllergies([...allergies, customAllergy.trim()]);
                      setCustomAllergy("");
                    }
                  }
                }}
                className="flex-1 rounded-lg border border-[#E5E5E5] px-3 py-1.5 text-xs text-black placeholder:text-neutral-400 focus:border-black focus:outline-none"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddCustomAllergy}
                className="rounded-lg border-[#E5E5E5] text-xs h-8 px-2.5"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </div>

            {allergies.length > 0 && (
              <div className="mt-2 text-[11px] text-neutral-600 flex items-center space-x-1">
                <span className="font-semibold text-black">Active tags:</span>
                <span>{allergies.join(", ")}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E5E5E5]">
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
              {loading ? "Enrolling..." : "Enroll Student & Generate Password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
