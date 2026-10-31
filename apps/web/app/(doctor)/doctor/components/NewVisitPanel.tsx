"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Sparkles,
  AlertTriangle,
  Calendar,
  Check,
  Stethoscope,
  Clock,
  Layers,
  ChevronRight,
} from "lucide-react";
import {
  MedicineCatalogItem,
  PrescriptionPreset,
  PrescriptionRow,
  StudentFullProfile,
} from "@/lib/doctor/types";
import { DoctorService } from "@/lib/doctor/service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NewVisitPanelProps {
  student: StudentFullProfile | null;
  medicinesCatalog: MedicineCatalogItem[];
  presets: PrescriptionPreset[];
  problemCategory: string;
  setProblemCategory: (cat: string) => void;
  clinicalNotes: string;
  setClinicalNotes: (notes: string) => void;
  medicineRows: PrescriptionRow[];
  setMedicineRows: React.Dispatch<React.SetStateAction<PrescriptionRow[]>>;
  followUpDate: string;
  setFollowUpDate: (date: string) => void;
  onOpenReview: () => void;
}

const QUICK_PROBLEMS = [
  "Headache",
  "Body pain",
  "Fever",
  "Cold and cough",
  "Stomach issue",
  "Other",
];

export function NewVisitPanel({
  student,
  medicinesCatalog,
  presets,
  problemCategory,
  setProblemCategory,
  clinicalNotes,
  setClinicalNotes,
  medicineRows,
  setMedicineRows,
  followUpDate,
  setFollowUpDate,
  onOpenReview,
}: NewVisitPanelProps) {
  const [validationError, setValidationError] = useState<string | null>(null);

  // Apply clinical preset
  const handleApplyPreset = (preset: PrescriptionPreset) => {
    setProblemCategory(preset.problem);
    if (preset.notes && !clinicalNotes) {
      setClinicalNotes(preset.notes);
    }

    const newRows: PrescriptionRow[] = preset.medicines.map((m, idx) => ({
      id: `row-${Date.now()}-${idx}`,
      medicine_name: m.medicine_name,
      dose: m.dose,
      times_per_day: m.times_per_day,
      meal_relation: m.meal_relation,
      meal_slots: m.meal_slots,
      number_of_days: m.number_of_days,
      quantity_handed_over: m.quantity_handed_over,
      instructions: m.instructions || "",
    }));

    setMedicineRows(newRows);
    setValidationError(null);
  };

  // Add an empty medicine row
  const handleAddMedicineRow = () => {
    const newRow: PrescriptionRow = {
      id: `row-${Date.now()}`,
      medicine_name: "",
      dose: "1 tablet",
      times_per_day: 2,
      meal_relation: "after",
      meal_slots: ["lunch", "dinner"],
      number_of_days: 3,
      quantity_handed_over: 6,
      instructions: "",
    };
    setMedicineRows((prev) => [...prev, newRow]);
    setValidationError(null);
  };

  // Update a field in a medicine row
  const handleUpdateRow = (
    id: string,
    field: keyof PrescriptionRow,
    value: unknown
  ) => {
    setMedicineRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;

        const updated = { ...row, [field]: value };

        // Automatically re-compute quantity when days or times change
        if (field === "number_of_days" || field === "meal_slots" || field === "times_per_day") {
          const times = updated.meal_slots?.length || updated.times_per_day || 1;
          const days = updated.number_of_days || 1;
          updated.quantity_handed_over = times * days;
        }

        return updated;
      })
    );
    setValidationError(null);
  };

  // Remove a medicine row
  const handleRemoveRow = (id: string) => {
    setMedicineRows((prev) => prev.filter((row) => row.id !== id));
  };

  // Toggle meal slot
  const handleToggleMealSlot = (
    rowId: string,
    slot: "breakfast" | "lunch" | "dinner"
  ) => {
    const row = medicineRows.find((r) => r.id === rowId);
    if (!row) return;

    let updatedSlots = [...row.meal_slots];
    if (updatedSlots.includes(slot)) {
      if (updatedSlots.length > 1) {
        updatedSlots = updatedSlots.filter((s) => s !== slot);
      }
    } else {
      updatedSlots.push(slot);
    }

    handleUpdateRow(rowId, "meal_slots", updatedSlots);
    handleUpdateRow(rowId, "times_per_day", updatedSlots.length);
  };

  // Validate before proceeding to review modal
  const handleReviewClick = () => {
    if (!student) {
      setValidationError("Search and select a student first before prescribing.");
      return;
    }

    if (!problemCategory.trim()) {
      setValidationError("Please select or specify a problem category.");
      return;
    }

    if (medicineRows.length === 0) {
      setValidationError("At least one medicine is strictly required to prescribe.");
      return;
    }

    for (let i = 0; i < medicineRows.length; i++) {
      const row = medicineRows[i];
      if (!row.medicine_name.trim()) {
        setValidationError(`Please choose a medicine name in row #${i + 1}.`);
        return;
      }
      if (!row.dose.trim()) {
        setValidationError(`Please specify a dose for ${row.medicine_name}.`);
        return;
      }
      if (row.meal_slots.length === 0) {
        setValidationError(`Select at least one meal time for ${row.medicine_name}.`);
        return;
      }
    }

    setValidationError(null);
    onOpenReview();
  };

  return (
    <div className="space-y-6 rounded-12 border border-doctor-border bg-white p-6 shadow-sm">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-doctor-blue">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-doctor-navy">
              Clinical Prescription & Meal Schedule
            </h2>
            <p className="text-xs text-slate-500">
              Structured entry triggers automated offline alarms on student phone.
            </p>
          </div>
        </div>

        {student && (
          <Badge className="bg-doctor-panel text-doctor-navy border-slate-200">
            Student: {student.roll_number}
          </Badge>
        )}
      </div>

      {/* 1. Problem Category Quick Chips */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
          Reported Problem / Chief Complaint *
        </label>
        <div className="flex flex-wrap gap-2">
          {QUICK_PROBLEMS.map((problem) => {
            const isSelected = problemCategory === problem;
            return (
              <button
                key={problem}
                type="button"
                onClick={() => setProblemCategory(problem)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-doctor-blue text-white shadow-sm ring-2 ring-doctor-blue/20"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {problem}
              </button>
            );
          })}
        </div>

        {/* Clinical notes box */}
        <textarea
          rows={2}
          value={clinicalNotes}
          onChange={(e) => setClinicalNotes(e.target.value)}
          placeholder="Clinical observations or symptom notes (optional)..."
          className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-doctor-navy placeholder:text-slate-400 focus:border-doctor-blue focus:outline-none focus:ring-1 focus:ring-doctor-blue"
        />
      </div>

      {/* 2. Quick Presets Bar */}
      <div className="rounded-xl border border-blue-100 bg-doctor-panel/50 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-doctor-navy">
            <Sparkles className="h-4 w-4 text-doctor-blue" />
            <span>1-Tap Clinical Presets</span>
          </div>
          <span className="text-[10px] text-slate-500">
            Pre-fills medications; fully customizable
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2 text-left hover:border-doctor-blue hover:bg-blue-50/50 transition-all shadow-xs"
            >
              <div>
                <div className="text-xs font-semibold text-doctor-navy truncate">
                  {preset.name}
                </div>
                <div className="text-[10px] text-slate-500">
                  {preset.medicines.length} med(s)
                </div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* 3. Medicine Rows */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Prescription Rows ({medicineRows.length}) *
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddMedicineRow}
            className="h-8 border-doctor-blue text-doctor-blue hover:bg-blue-50 text-xs font-semibold"
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Add Medicine
          </Button>
        </div>

        {medicineRows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
            No medicines added yet. Tap a 1-tap preset above or click &quot;Add Medicine&quot; to begin.
          </div>
        ) : (
          <div className="space-y-4">
            {medicineRows.map((row, index) => {
              // Check for allergy warning
              const allergyWarning = student
                ? DoctorService.checkAllergyConflict(
                    row.medicine_name,
                    student.allergies
                  )
                : null;

              return (
                <div
                  key={row.id}
                  className={`relative rounded-xl border p-4 transition-all ${
                    allergyWarning
                      ? "border-red-400 bg-red-50/30"
                      : "border-slate-200 bg-white shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Medicine #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(row.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors"
                      title="Remove row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Grid of inputs */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 items-end">
                    {/* Medicine Name (Searchable from catalog) */}
                    <div className="sm:col-span-5 space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 block">
                        Medicine Name
                      </label>
                      <input
                        type="text"
                        list="medicines-list"
                        value={row.medicine_name}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleUpdateRow(row.id, "medicine_name", val);
                          // Auto set default dose if matching catalog
                          const match = medicinesCatalog.find(
                            (m) => m.name.toLowerCase() === val.toLowerCase()
                          );
                          if (match) {
                            handleUpdateRow(row.id, "dose", match.default_dose);
                          }
                        }}
                        placeholder="Search medicine (e.g. Paracetamol)..."
                        className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-doctor-navy focus:border-doctor-blue focus:outline-none"
                      />
                      <datalist id="medicines-list">
                        {medicinesCatalog.map((m) => (
                          <option key={m.id} value={m.name} />
                        ))}
                      </datalist>
                    </div>

                    {/* Dose (e.g. 1 tablet, 500mg, 10ml) */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 block">
                        Dose
                      </label>
                      <input
                        type="text"
                        value={row.dose}
                        onChange={(e) =>
                          handleUpdateRow(row.id, "dose", e.target.value)
                        }
                        placeholder="1 tablet"
                        className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-doctor-navy focus:border-doctor-blue focus:outline-none"
                      />
                    </div>

                    {/* Meal Relation: Before / After */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 block">
                        Meal Timing
                      </label>
                      <select
                        value={row.meal_relation}
                        onChange={(e) =>
                          handleUpdateRow(
                            row.id,
                            "meal_relation",
                            e.target.value as "before" | "after"
                          )
                        }
                        className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs bg-white text-doctor-navy focus:border-doctor-blue focus:outline-none"
                      >
                        <option value="after">After meal (+30m)</option>
                        <option value="before">Before meal (-30m)</option>
                      </select>
                    </div>

                    {/* Number of days */}
                    <div className="sm:col-span-1 space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 block">
                        Days
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={row.number_of_days}
                        onChange={(e) =>
                          handleUpdateRow(
                            row.id,
                            "number_of_days",
                            parseInt(e.target.value, 10) || 1
                          )
                        }
                        className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs text-doctor-navy text-center focus:border-doctor-blue focus:outline-none"
                      />
                    </div>

                    {/* Quantity Handed Over */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 block">
                        Qty Handed
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={row.quantity_handed_over}
                        onChange={(e) =>
                          handleUpdateRow(
                            row.id,
                            "quantity_handed_over",
                            parseInt(e.target.value, 10) || 1
                          )
                        }
                        className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs text-doctor-navy text-center focus:border-doctor-blue focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Meal Slot Selection Chips */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Anchor Meals:
                    </span>
                    {(["breakfast", "lunch", "dinner"] as const).map((slot) => {
                      const isActive = row.meal_slots.includes(slot);
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => handleToggleMealSlot(row.id, slot)}
                          className={`rounded px-2.5 py-1 text-[11px] font-medium capitalize transition-all ${
                            isActive
                              ? "bg-blue-100 text-doctor-blue border border-blue-300 font-bold"
                              : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          {isActive && <Check className="mr-1 inline h-3 w-3" />}
                          {slot}
                        </button>
                      );
                    })}
                    <span className="text-[10px] text-slate-400 ml-auto">
                      {row.meal_slots.length} time(s) daily &times; {row.number_of_days} days = {row.quantity_handed_over} units
                    </span>
                  </div>

                  {/* ALLERGY WARNING BANNER ON MATCH */}
                  {allergyWarning && (
                    <div className="mt-3 flex items-start space-x-2 rounded-lg border border-red-300 bg-red-100/70 p-2.5 text-xs text-red-900 animate-pulse">
                      <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">ALLERGY CONFLICT WARNING: </span>
                        {allergyWarning}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Follow-up Date (Optional) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-semibold text-doctor-navy">
            Recommended Follow-Up Date (Optional):
          </span>
        </div>
        <input
          type="date"
          value={followUpDate}
          onChange={(e) => setFollowUpDate(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-doctor-navy focus:border-doctor-blue focus:outline-none"
        />
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="flex items-center space-x-2 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-800">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* 5. Review & Submit Trigger */}
      <div className="pt-2">
        <Button
          type="button"
          onClick={handleReviewClick}
          className="h-12 w-full bg-doctor-blue hover:bg-doctor-blueHover text-white text-sm font-semibold rounded-12 shadow-md shadow-blue-500/20"
        >
          Review Schedule & Send to Student →
        </Button>
        <p className="mt-2 text-center text-[11px] text-slate-400">
          A review modal will preview the exact meal-anchored alarms before dispatch.
        </p>
      </div>
    </div>
  );
}
