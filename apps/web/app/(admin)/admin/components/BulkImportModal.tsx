"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  X,
  FileText,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkImportModal({ isOpen, onClose, onSuccess }: BulkImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<{
    enrolled_count: number;
    invalid_count: number;
    errors: string[];
    students: Array<{ id: string; roll_number: string; name: string }>;
  } | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setImportSummary(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select an Excel (.xlsx, .xls), CSV, or PDF file to upload.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setImportSummary(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/admin/students/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to import student file.");
      }

      setImportSummary({
        enrolled_count: data.enrolled_count,
        invalid_count: data.invalid_count || 0,
        errors: data.errors || [],
        students: data.students || [],
      });
      onSuccess();
    } catch (err: any) {
      setError(err?.message || "Failed to process student import.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadSample = () => {
    window.open("/api/admin/students/import?sample=1", "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0F1B33] text-white">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F1B33]">
                Batch Student Enrollment (Excel / PDF / CSV)
              </h2>
              <p className="text-xs text-[#6B7280]">
                Ingest student directory records directly into Supabase database
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#6B7280] hover:bg-neutral-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Specifications & Template Download */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-[#1E293B]">
              Required Columns in File:
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadSample}
              className="text-xs flex items-center gap-1.5 border-[#0284C7] text-[#0284C7] hover:bg-blue-50"
            >
              <Download className="h-3.5 w-3.5" />
              Download 10-Student Sample (.xlsx)
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-[#475569]">
            <div className="p-2 bg-white rounded border border-[#E2E8F0]">
              <span className="font-bold text-[#0F172A]">Roll Number:</span> 10 chars (auto-uppercase)
            </div>
            <div className="p-2 bg-white rounded border border-[#E2E8F0]">
              <span className="font-bold text-[#0F172A]">Student Name:</span> Full legal name
            </div>
            <div className="p-2 bg-white rounded border border-[#E2E8F0]">
              <span className="font-bold text-[#0F172A]">Phone:</span> 10-digit mobile
            </div>
            <div className="p-2 bg-white rounded border border-[#E2E8F0]">
              <span className="font-bold text-[#0F172A]">Residence:</span> Hosteler / Day Scholar
            </div>
            <div className="p-2 bg-white rounded border border-[#E2E8F0]">
              <span className="font-bold text-[#0F172A]">Room Number:</span> e.g. B-214 or (-)
            </div>
            <div className="p-2 bg-white rounded border border-[#E2E8F0]">
              <span className="font-bold text-[#0F172A]">Year:</span> 1, 2, 3, or 4
            </div>
          </div>
          <div className="text-[11px] text-[#059669] font-medium">
            &bull; Initial student password will automatically be their 10-character Roll Number.
          </div>
        </div>

        {/* File Dropzone */}
        {!importSummary && (
          <div className="space-y-4">
            <label className="border-2 border-dashed border-[#CBD5E1] hover:border-[#0284C7] rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#FAFAFA] hover:bg-[#F0F9FF]">
              <UploadCloud className="h-10 w-10 text-[#0284C7] mb-2" />
              <span className="text-sm font-semibold text-[#1E293B]">
                {selectedFile ? selectedFile.name : "Click to select or drag & drop student file"}
              </span>
              <span className="text-xs text-[#64748B] mt-1">
                Supports Microsoft Excel (.xlsx, .xls), CSV, or Student Directory PDF
              </span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={onClose} disabled={isUploading}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="bg-[#0F1B33] text-white hover:bg-neutral-800"
              >
                {isUploading ? "Validating & Ingesting..." : "Upload & Enroll Students"}
              </Button>
            </div>
          </div>
        )}

        {/* Success Result View */}
        {importSummary && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
              <div>
                <div className="text-sm font-bold text-emerald-900">
                  Enrolled {importSummary.enrolled_count} Students Successfully!
                </div>
                <div className="text-xs text-emerald-700">
                  All accounts are now live in Supabase. Initial login password for each student is their exact Roll Number.
                </div>
              </div>
            </div>

            {/* Student Preview List */}
            {importSummary.students.length > 0 && (
              <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
                <div className="bg-[#F8FAFC] px-3 py-2 text-xs font-bold text-[#475569] border-b border-[#E2E8F0]">
                  Recently Enrolled Students
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-[#F1F5F9]">
                  {importSummary.students.map((s) => (
                    <div key={s.id} className="px-3 py-2 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-[#0F172A]">{s.name}</span>
                        <span className="text-[#64748B] ml-2 font-mono">({s.roll_number})</span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error List if any rows were rejected */}
            {importSummary.errors.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="text-xs font-bold text-amber-800 mb-1">
                  Rejected Rows ({importSummary.invalid_count}):
                </div>
                <ul className="text-[11px] text-amber-700 list-disc list-inside space-y-0.5">
                  {importSummary.errors.slice(0, 5).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={onClose} className="bg-[#0F1B33] text-white">
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
