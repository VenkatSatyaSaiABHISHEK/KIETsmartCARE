"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Download,
  X,
  RefreshCw,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColumnMapping, ImportValidationSummary } from "@/lib/admin/types";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SAMPLE_CSV = `student_id,full_name,department,current_year,mobile_number,emergency_phone,known_allergies
2400290100011,Nikhil Verma,CSE,1,9848099111,9848099222,Paracetamol
2400290130022,Divya Prakash,ECE,1,9848099333,9848099444,Penicillin; Aspirin
2300290120033,Karthik Sen,IT,2,9848099555,9848099666,None
2200290200044,Tanvi Agarwal,ME,3,9848099777,9848099888,Sulfa drugs
2100290100055,Arjun Mehta,CSE,4,9848099999,9848099000,
2400290100999,Invalid Test Record,CSE,5,12345,999,InvalidRow`;

export function BulkImportModal({ isOpen, onClose, onSuccess }: BulkImportModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [csvContent, setCsvContent] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    roll_number: "",
    name: "",
    branch: "",
    year: "",
    phone: "",
    emergency_contact: "",
    allergies: "",
  });
  const [validationSummary, setValidationSummary] = useState<
    (ImportValidationSummary & { credentials_csv: string }) | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Simple CSV parser
  const parseCsvText = (text: string) => {
    const lines = text
      .split(/\r\n|\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      throw new Error("CSV must contain at least a header row and one data row.");
    }

    const headerLine = lines[0];
    const rawHeaders = headerLine.split(",").map((h) => h.replace(/^["']|["']$/g, "").trim());
    setHeaders(rawHeaders);

    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.replace(/^["']|["']$/g, "").trim());
      const rowObj: Record<string, string> = {};
      rawHeaders.forEach((h, idx) => {
        rowObj[h] = values[idx] || "";
      });
      rows.push(rowObj);
    }

    setParsedRows(rows);

    // Auto-map columns based on heuristics
    const autoMap: ColumnMapping = {
      roll_number:
        rawHeaders.find((h) => /roll|id|reg|student_id/i.test(h)) || rawHeaders[0] || "",
      name:
        rawHeaders.find((h) => /name|student_name|full_name/i.test(h)) || rawHeaders[1] || "",
      branch:
        rawHeaders.find((h) => /branch|dept|department|course/i.test(h)) || rawHeaders[2] || "",
      year:
        rawHeaders.find((h) => /year|sem|current_year|academic_year/i.test(h)) || rawHeaders[3] || "",
      phone:
        rawHeaders.find((h) => /phone|mobile|contact|student_phone/i.test(h)) || rawHeaders[4] || "",
      emergency_contact:
        rawHeaders.find((h) => /emergency|parent|guardian/i.test(h)) || rawHeaders[5] || "",
      allergies:
        rawHeaders.find((h) => /allerg/i.test(h)) || "",
    };
    setMapping(autoMap);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      try {
        parseCsvText(content);
      } catch (err: any) {
        setError(err?.message || "Failed to parse CSV file");
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    setCsvContent(SAMPLE_CSV);
    setError(null);
    try {
      parseCsvText(SAMPLE_CSV);
    } catch (err: any) {
      setError(err?.message || "Failed to parse sample");
    }
  };

  const handleProceedToMapping = () => {
    if (!csvContent.trim()) {
      setError("Please paste or upload CSV data first");
      return;
    }
    try {
      parseCsvText(csvContent);
      setStep(2);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Invalid CSV format");
    }
  };

  const handleValidate = async () => {
    if (
      !mapping.roll_number ||
      !mapping.name ||
      !mapping.branch ||
      !mapping.year ||
      !mapping.phone ||
      !mapping.emergency_contact
    ) {
      setError("Please map all required fields before validating.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/students/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_rows: parsedRows,
          mapping,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Validation failed");
      }

      setValidationSummary(data.summary);
      setStep(3);
    } catch (err: any) {
      setError(err?.message || "Failed to validate import rows");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCredentials = () => {
    if (!validationSummary?.credentials_csv) return;
    const blob = new Blob([validationSummary.credentials_csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `kiet_student_credentials_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFinish = () => {
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-xl my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-black">
                Batch Student Ingestion Wizard
              </h2>
              <p className="text-xs text-neutral-500">
                Column mapping, pre-flight validation, and credentials sheet export
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

        {/* Stepper Progress */}
        <div className="mt-4 grid grid-cols-4 gap-2 border-b border-[#E5E5E5] pb-4 text-xs font-semibold">
          <div
            className={`flex items-center space-x-1.5 ${
              step >= 1 ? "text-black" : "text-neutral-400"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                step >= 1 ? "bg-black text-white" : "bg-neutral-200 text-neutral-600"
              }`}
            >
              1
            </span>
            <span>Upload CSV</span>
          </div>

          <div
            className={`flex items-center space-x-1.5 ${
              step >= 2 ? "text-black" : "text-neutral-400"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                step >= 2 ? "bg-black text-white" : "bg-neutral-200 text-neutral-600"
              }`}
            >
              2
            </span>
            <span>Map Columns</span>
          </div>

          <div
            className={`flex items-center space-x-1.5 ${
              step >= 3 ? "text-black" : "text-neutral-400"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                step >= 3 ? "bg-black text-white" : "bg-neutral-200 text-neutral-600"
              }`}
            >
              3
            </span>
            <span>Pre-Flight Validation</span>
          </div>

          <div
            className={`flex items-center space-x-1.5 ${
              step >= 4 ? "text-black" : "text-neutral-400"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                step >= 4 ? "bg-black text-white" : "bg-neutral-200 text-neutral-600"
              }`}
            >
              4
            </span>
            <span>Export Passwords</span>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* STEP 1: CSV Upload */}
        {step === 1 && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-600">
                Upload a CSV file or paste tabular data directly below.
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLoadSample}
                className="rounded-lg border-[#E5E5E5] text-[11px] h-7"
              >
                <FileText className="mr-1 h-3.5 w-3.5" /> Load Sample Student CSV
              </Button>
            </div>

            <div className="rounded-lg border-2 border-dashed border-[#E5E5E5] bg-neutral-50 p-6 text-center">
              <UploadCloud className="mx-auto h-8 w-8 text-neutral-400 mb-2" />
              <label className="cursor-pointer">
                <span className="rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800">
                  Select CSV File
                </span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="mt-2 text-[11px] text-neutral-500">
                Supports any standard comma-separated student roster. Headers will be mapped in Step 2.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Or Paste CSV Text
              </label>
              <textarea
                rows={6}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="roll_number,student_name,branch,year,phone,emergency_contact,allergies"
                className="w-full rounded-lg border border-[#E5E5E5] p-3 text-xs font-mono text-black placeholder:text-neutral-400 focus:border-black focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-[#E5E5E5]">
              <Button
                type="button"
                onClick={handleProceedToMapping}
                className="rounded-lg bg-black text-white hover:bg-neutral-800 text-xs font-semibold px-4"
              >
                Proceed to Column Mapping <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Column Mapping */}
        {step === 2 && (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-[#E5E5E5] bg-neutral-50 p-3 text-xs text-neutral-700">
              <span className="font-bold text-black">Flexible Schema Ingestion:</span> Because the
              institutional CSV format may change, match each required student field to the column header
              found in your uploaded file.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Roll Number (Required)
                </label>
                <select
                  value={mapping.roll_number}
                  onChange={(e) => setMapping({ ...mapping, roll_number: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 bg-white text-xs text-black focus:border-black focus:outline-none"
                >
                  <option value="">-- Select Header --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Full Name (Required)
                </label>
                <select
                  value={mapping.name}
                  onChange={(e) => setMapping({ ...mapping, name: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 bg-white text-xs text-black focus:border-black focus:outline-none"
                >
                  <option value="">-- Select Header --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Branch / Department (Required)
                </label>
                <select
                  value={mapping.branch}
                  onChange={(e) => setMapping({ ...mapping, branch: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 bg-white text-xs text-black focus:border-black focus:outline-none"
                >
                  <option value="">-- Select Header --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Academic Year 1-4 (Required)
                </label>
                <select
                  value={mapping.year}
                  onChange={(e) => setMapping({ ...mapping, year: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 bg-white text-xs text-black focus:border-black focus:outline-none"
                >
                  <option value="">-- Select Header --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Student Mobile (Required)
                </label>
                <select
                  value={mapping.phone}
                  onChange={(e) => setMapping({ ...mapping, phone: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 bg-white text-xs text-black focus:border-black focus:outline-none"
                >
                  <option value="">-- Select Header --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Emergency Phone (Required)
                </label>
                <select
                  value={mapping.emergency_contact}
                  onChange={(e) => setMapping({ ...mapping, emergency_contact: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 bg-white text-xs text-black focus:border-black focus:outline-none"
                >
                  <option value="">-- Select Header --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Allergies Column (Optional)
                </label>
                <select
                  value={mapping.allergies}
                  onChange={(e) => setMapping({ ...mapping, allergies: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 bg-white text-xs text-black focus:border-black focus:outline-none"
                >
                  <option value="">-- None / Skip Allergies Column --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E5E5E5]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="rounded-lg border-[#E5E5E5] text-xs"
              >
                Back to CSV
              </Button>
              <Button
                type="button"
                onClick={handleValidate}
                disabled={loading}
                className="rounded-lg bg-black text-white hover:bg-neutral-800 text-xs font-semibold px-4"
              >
                {loading ? "Validating & Ingesting..." : "Run Pre-Flight Validation"}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Pre-Flight Validation Preview */}
        {step === 3 && validationSummary && (
          <div className="mt-4 space-y-4">
            {/* Metric counters */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-[#E5E5E5] p-3 text-center bg-white">
                <div className="text-[11px] uppercase font-bold text-neutral-500">Total Rows</div>
                <div className="text-xl font-bold text-black mt-0.5">
                  {validationSummary.total_rows}
                </div>
              </div>

              <div className="rounded-lg border border-black bg-neutral-50 p-3 text-center">
                <div className="text-[11px] uppercase font-bold text-black flex items-center justify-center space-x-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Valid Rows</span>
                </div>
                <div className="text-xl font-bold text-black mt-0.5">
                  {validationSummary.valid_count}
                </div>
              </div>

              <div className="rounded-lg border border-[#E5E5E5] p-3 text-center bg-neutral-100">
                <div className="text-[11px] uppercase font-bold text-neutral-600 flex items-center justify-center space-x-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Rejected Rows</span>
                </div>
                <div className="text-xl font-bold text-neutral-800 mt-0.5">
                  {validationSummary.invalid_count}
                </div>
              </div>
            </div>

            {/* Error breakdown if invalid rows exist */}
            {validationSummary.invalid_records.length > 0 && (
              <div className="rounded-lg border border-neutral-300 bg-neutral-50 p-3 space-y-2 text-xs">
                <div className="font-semibold text-black uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                  <AlertTriangle className="h-4 w-4 text-black" />
                  <span>Validation Errors Detected ({validationSummary.invalid_count} rows skipped)</span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-2">
                  {validationSummary.invalid_records.map((inv) => (
                    <div
                      key={inv.row_index}
                      className="rounded border border-[#E5E5E5] bg-white p-2 text-[11px]"
                    >
                      <span className="font-bold font-mono text-black">Row {inv.row_index}:</span>{" "}
                      <span className="text-neutral-700">{inv.errors.join(", ")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Valid rows sample */}
            <div>
              <div className="text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                Ingested Records Preview ({validationSummary.valid_count} students)
              </div>
              <div className="max-h-44 overflow-y-auto rounded-lg border border-[#E5E5E5]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-100 border-b border-[#E5E5E5] text-[11px] uppercase font-semibold text-neutral-600">
                    <tr>
                      <th className="px-3 py-2 font-mono">Roll Number</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Dept</th>
                      <th className="px-3 py-2">Year</th>
                      <th className="px-3 py-2">Phone</th>
                      <th className="px-3 py-2 font-mono">Assigned Password</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5]">
                    {validationSummary.valid_records.map((v) => (
                      <tr key={v.roll_number} className="hover:bg-neutral-50">
                        <td className="px-3 py-1.5 font-mono font-medium">{v.roll_number}</td>
                        <td className="px-3 py-1.5">{v.name}</td>
                        <td className="px-3 py-1.5">{v.branch}</td>
                        <td className="px-3 py-1.5">Year {v.year}</td>
                        <td className="px-3 py-1.5 font-mono">{v.phone}</td>
                        <td className="px-3 py-1.5 font-mono text-[11px] text-neutral-600">
                          {v.temp_password}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E5E5E5]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                className="rounded-lg border-[#E5E5E5] text-xs"
              >
                Back to Mapping
              </Button>
              <Button
                type="button"
                onClick={() => setStep(4)}
                className="rounded-lg bg-black text-white hover:bg-neutral-800 text-xs font-semibold px-4"
              >
                Proceed to Credentials Export <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Credentials Export Sheet */}
        {step === 4 && validationSummary && (
          <div className="mt-4 space-y-5 text-xs text-center py-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-black">
                {validationSummary.valid_count} Students Enrolled Successfully
              </h3>
              <p className="mt-1 text-neutral-500 max-w-md mx-auto text-xs">
                Authentication accounts and temporary passwords have been generated via server service role.
                Download the credentials distribution spreadsheet below.
              </p>
            </div>

            <div className="max-w-md mx-auto rounded-lg border border-black bg-neutral-50 p-4 text-left space-y-2">
              <div className="font-semibold text-black uppercase tracking-wider text-[11px]">
                One-Time Distribution Sheet:
              </div>
              <p className="text-[11px] text-neutral-600">
                The downloaded CSV contains: Roll Number, Full Name, Branch, Year, Temporary Password, and
                First-Login Activation URL. Distribute this securely to students through official KIET portal
                notices or SMS gateway.
              </p>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <Button
                type="button"
                onClick={handleDownloadCredentials}
                className="rounded-lg bg-black text-white hover:bg-neutral-800 text-xs font-semibold px-5 h-10"
              >
                <Download className="mr-2 h-4 w-4" /> Download Credentials Sheet (.CSV)
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleFinish}
                className="rounded-lg border-[#E5E5E5] text-xs font-semibold h-10 px-4"
              >
                Done & Return to Roster
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
