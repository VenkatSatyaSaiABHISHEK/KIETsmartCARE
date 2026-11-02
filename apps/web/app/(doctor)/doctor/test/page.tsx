"use client";

import React, { useState, useEffect } from "react";
import { Clock, Search, Bell, CheckCircle2, AlertTriangle, ArrowRight, Smartphone } from "lucide-react";

interface StudentInfo {
  id: string;
  roll_number: string;
  name: string;
  branch: string;
  year: number;
  phone?: string;
}

interface TestResult {
  studentName: string;
  rollNumber: string;
  timeIST: string;
  minutesFromNow: number;
  timestamp: string;
}

export default function DoctorTestAlarmPage() {
  const [rollNumber, setRollNumber] = useState("2200290120019");
  const [searchedStudent, setSearchedStudent] = useState<StudentInfo | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [minutesOffset, setMinutesOffset] = useState<number>(2);
  const [customTime, setCustomTime] = useState<string>("");
  const [useCustomTime, setUseCustomTime] = useState<boolean>(false);
  const [tabletLabel, setTabletLabel] = useState<string>("Tablet 1");

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [testHistory, setTestHistory] = useState<TestResult[]>([]);

  // Auto-search student on initial load or roll change
  const handleLookupStudent = async (rollToSearch: string) => {
    const clean = rollToSearch.trim();
    if (!clean) return;

    setSearching(true);
    setSearchError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/doctor/students?rollNumber=${encodeURIComponent(clean)}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (res.ok && data?.student) {
        setSearchedStudent(data.student);
      } else {
        setSearchedStudent(null);
        setSearchError(data?.error || `No student found for "${clean}". Check roll number.`);
      }
    } catch (e: any) {
      setSearchError("Error searching student database.");
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    handleLookupStudent(rollNumber);
  }, []);

  const handleSetAlarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchedStudent) {
      setErrorMessage("Please search and select a valid student first.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/doctor/test-dose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rollNumber: searchedStudent.roll_number,
          minutesOffset: useCustomTime ? undefined : minutesOffset,
          customTime: useCustomTime ? customTime : undefined,
          tabletLabel,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(data.message);
        setTestHistory((prev) => [
          {
            studentName: searchedStudent.name,
            rollNumber: searchedStudent.roll_number,
            timeIST: data.scheduledTimeIST,
            minutesFromNow: data.minutesFromNow,
            timestamp: new Date().toLocaleTimeString(),
          },
          ...prev,
        ]);
      } else {
        setErrorMessage(data.error || "Failed to schedule test alarm.");
      }
    } catch (e: any) {
      setErrorMessage("Network error scheduling test alarm.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
          <Bell className="w-3.5 h-3.5" />
          <span>REAL-TIME ALARM & DOSE TESTING SIMULATOR</span>
        </div>
        <h1 className="font-serif text-[32px] font-bold text-[#0F1B33] tracking-tight">
          Test Dose Alarm Trigger
        </h1>
        <p className="text-[14px] text-[#6B7280] mt-1 max-w-2xl">
          Schedule an immediate real-time dose reminder for any student to verify that the mobile app receives the scheduled dose, triggers the alarm chime, and logs adherence telemetry.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#E5E7EB] p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSetAlarm} className="space-y-6">
            {/* Step 1: Student Lookup */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                Step 1: Enter Student Roll Number
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-[#9CA3AF]" />
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="e.g. 2200290120019"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#D1D5DB] text-[14px] text-[#0F1B33] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleLookupStudent(rollNumber)}
                  disabled={searching}
                  className="px-4 py-2.5 bg-[#0F1B33] text-white rounded-lg text-[13px] font-semibold hover:bg-opacity-90 disabled:opacity-50 transition-colors"
                >
                  {searching ? "Searching..." : "Lookup"}
                </button>
              </div>

              {/* Student Result Card */}
              {searchedStudent && (
                <div className="mt-3 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-serif text-[17px] font-bold text-[#0F1B33]">
                      {searchedStudent.name}
                    </div>
                    <div className="text-[12px] text-[#64748B] mt-0.5">
                      Roll: <span className="font-mono font-medium text-[#0F1B33]">{searchedStudent.roll_number}</span> &bull; {searchedStudent.branch} (Year {searchedStudent.year})
                    </div>
                    {searchedStudent.phone && (
                      <div className="text-[11px] text-[#64748B] mt-0.5">
                        Phone: {searchedStudent.phone}
                      </div>
                    )}
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </div>
                </div>
              )}

              {searchError && (
                <div className="mt-2 text-[12px] text-red-600 font-medium">
                  {searchError}
                </div>
              )}
            </div>

            {/* Step 2: Medication Label */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                Step 2: Tablet Label
              </label>
              <div className="grid grid-cols-4 gap-2">
                {["Tablet 1", "Tablet 2", "Tablet 3", "Tablet 4"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTabletLabel(t)}
                    className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                      tabletLabel === t
                        ? "bg-[#0F1B33] text-white border-[#0F1B33]"
                        : "bg-white text-[#475569] border-[#D1D5DB] hover:border-[#0F1B33]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Alarm Timing */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                Step 3: When Should Alarm Ring? (Asia/Kolkata Timezone)
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
                {[
                  { label: "In 1 Minute", val: 1 },
                  { label: "In 2 Minutes (Quick)", val: 2 },
                  { label: "In 5 Minutes", val: 5 },
                  { label: "In 10 Minutes", val: 10 },
                  { label: "In 15 Minutes", val: 15 },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => {
                      setUseCustomTime(false);
                      setMinutesOffset(opt.val);
                    }}
                    className={`py-2.5 px-2 rounded-lg text-xs font-semibold border text-center transition-all ${
                      !useCustomTime && minutesOffset === opt.val
                        ? "bg-[#1D4ED8] text-white border-[#1D4ED8]"
                        : "bg-white text-[#475569] border-[#D1D5DB] hover:border-[#1D4ED8]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Custom Time Selector */}
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[#475569]">
                    Or specify exact time today (HH:MM):
                  </span>
                  <button
                    type="button"
                    onClick={() => setUseCustomTime(!useCustomTime)}
                    className="text-xs text-[#1D4ED8] font-semibold underline"
                  >
                    {useCustomTime ? "Use Quick Buttons" : "Set Custom Time"}
                  </button>
                </div>

                {useCustomTime && (
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm bg-white"
                    required={useCustomTime}
                  />
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !searchedStudent}
              className="w-full py-3.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded-lg text-[14px] font-bold shadow transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4" />
              <span>{submitting ? "Scheduling Alarm..." : "Set Alarm & Schedule Dose"}</span>
            </button>

            {/* Alerts */}
            {successMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[13px]">{successMessage}</div>
                  <div className="mt-1 text-emerald-700">
                    Open the Student App at <strong>localhost:8081</strong>. The scheduled dose is now live!
                  </div>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Verification & Live Status (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Instructions Box */}
          <div className="bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] p-6">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="w-4 h-4 text-[#0F1B33]" />
              <h2 className="font-serif text-[17px] font-bold text-[#0F1B33]">
                How to verify the test
              </h2>
            </div>
            <ol className="space-y-3 text-[13px] text-[#475569] list-decimal list-inside leading-relaxed">
              <li>
                Ensure you are logged into the student app at{" "}
                <a
                  href="http://localhost:8081"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#1D4ED8] font-semibold underline"
                >
                  localhost:8081
                </a>{" "}
                with Roll Number{" "}
                <strong className="text-[#0F1B33]">{searchedStudent?.roll_number || "2200290120019"}</strong>.
              </li>
              <li>
                Click <strong>&ldquo;Set Alarm &amp; Schedule Dose&rdquo;</strong> above.
              </li>
              <li>
                Switch to the mobile app or refresh it. You will see <strong>{tabletLabel}</strong> appear under <strong>Next Scheduled Dose</strong>.
              </li>
              <li>
                When the scheduled time arrives, the device plays the chime sound and triggers the notification prompt!
              </li>
              <li>
                Tap <strong>Taken</strong> or <strong>Taken Late</strong> on the mobile screen to complete the loop and view the update on the Officer Portal!
              </li>
            </ol>
          </div>

          {/* Test History List */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-[16px] font-bold text-[#0F1B33]">
                Recent Test Alarms
              </h3>
              <span className="text-[11px] text-[#64748B] font-semibold">
                Session history
              </span>
            </div>

            {testHistory.length === 0 ? (
              <div className="text-center py-6 text-xs text-[#94A3B8]">
                No test alarms scheduled in this session yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {testHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#0F1B33]">
                        {item.studentName} ({item.rollNumber})
                      </div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">
                        Scheduled for: <span className="font-semibold text-[#1D4ED8]">{item.timeIST}</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-[#64748B]">
                      {item.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

