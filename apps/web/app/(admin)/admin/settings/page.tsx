"use client";

import React, { useEffect, useState } from "react";
import {
  Settings,
  Clock,
  PhoneCall,
  Pill,
  BookmarkCheck,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminSettingsData } from "@/lib/admin/types";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<"meals" | "emergency" | "medicines" | "presets">("meals");
  const [settings, setSettings] = useState<AdminSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal for adding a medicine
  const [isAddMedOpen, setIsAddMedOpen] = useState(false);
  const [newMedName, setNewMedName] = useState("");
  const [newMedCategory, setNewMedCategory] = useState("Analgesic");
  const [newMedDose, setNewMedDose] = useState("1 tablet");
  const [newMedStock, setNewMedStock] = useState(100);
  const [newMedAllergies, setNewMedAllergies] = useState("");

  // Modal for adding a preset
  const [isAddPresetOpen, setIsAddPresetOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetProblem, setNewPresetProblem] = useState("Headache");
  const [newPresetMeds, setNewPresetMeds] = useState<string[]>([]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      setSettings(data.settings);
    } catch {
      setFeedback({ type: "error", message: "Failed to load institution settings" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update settings");
      }

      setSettings(data.settings);
      setFeedback({
        type: "success",
        message: "Institutional configuration successfully updated & audit-logged.",
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Failed to save configuration" });
    } finally {
      setSaving(false);
    }
  };

  const handleAddMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || !newMedName.trim()) return;

    const newMed = {
      id: `med-${Date.now().toString(36)}`,
      name: newMedName.trim(),
      category: newMedCategory.trim(),
      default_dose: newMedDose.trim(),
      stock_quantity: Number(newMedStock) || 0,
      allergy_keywords: newMedAllergies
        .split(/[,;|]/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    };

    setSettings({
      ...settings,
      medicines: [newMed, ...settings.medicines],
    });

    setIsAddMedOpen(false);
    setNewMedName("");
    setNewMedAllergies("");
  };

  const handleRemoveMedicine = (id: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      medicines: settings.medicines.filter((m) => m.id !== id),
    });
  };

  const handleAddPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || !newPresetName.trim() || newPresetMeds.length === 0) return;

    const newPre = {
      id: `pre-${Date.now().toString(36)}`,
      name: newPresetName.trim(),
      problem: newPresetProblem,
      medicine_names: newPresetMeds,
    };

    setSettings({
      ...settings,
      presets: [newPre, ...settings.presets],
    });

    setIsAddPresetOpen(false);
    setNewPresetName("");
    setNewPresetMeds([]);
  };

  const handleRemovePreset = (id: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      presets: settings.presets.filter((p) => p.id !== id),
    });
  };

  if (loading || !settings) {
    return (
      <div className="py-16 text-center text-xs text-neutral-400">
        Loading system configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Save Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E5E5] pb-5">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-tight text-black">
            Campus Healthcare Settings
          </h1>
          <p className="mt-1 text-xs text-neutral-500">
            Define hostel meal reminder baselines, emergency contacts, medicine dispensary catalog, and doctor presets
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-black text-white hover:bg-neutral-800 text-xs font-semibold px-4 h-9"
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {saving ? "Saving Changes..." : "Save Configuration"}
          </Button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`rounded-lg border p-3 text-xs flex items-center space-x-2 ${
            feedback.type === "success"
              ? "border-black bg-neutral-50 text-black font-semibold"
              : "border-red-300 bg-red-50 text-red-700"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-black" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-700" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-[#E5E5E5] space-x-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("meals")}
          className={`flex items-center space-x-1.5 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "meals"
              ? "border-black text-black"
              : "border-transparent text-neutral-500 hover:text-black"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Meal Timings (Reminder Engine)</span>
        </button>

        <button
          onClick={() => setActiveTab("emergency")}
          className={`flex items-center space-x-1.5 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "emergency"
              ? "border-black text-black"
              : "border-transparent text-neutral-500 hover:text-black"
          }`}
        >
          <PhoneCall className="h-3.5 w-3.5" />
          <span>Emergency Hotlines</span>
        </button>

        <button
          onClick={() => setActiveTab("medicines")}
          className={`flex items-center space-x-1.5 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "medicines"
              ? "border-black text-black"
              : "border-transparent text-neutral-500 hover:text-black"
          }`}
        >
          <Pill className="h-3.5 w-3.5" />
          <span>Medicine Catalog ({settings.medicines.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("presets")}
          className={`flex items-center space-x-1.5 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "presets"
              ? "border-black text-black"
              : "border-transparent text-neutral-500 hover:text-black"
          }`}
        >
          <BookmarkCheck className="h-3.5 w-3.5" />
          <span>Doctor Presets ({settings.presets.length})</span>
        </button>
      </div>

      {/* TAB 1: Meal Timings */}
      {activeTab === "meals" && (
        <div className="rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-sm space-y-6">
          <div className="border-b border-[#E5E5E5] pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-black">
              Hostel Meal Windows & Reminder Calibration
            </h2>
            <p className="text-xs text-neutral-500">
              Prescriptions calculate exact student reminder alarms (Before Meal = -30m, After Meal = +30m)
              anchored to these campus schedule defaults.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="rounded-lg border border-[#E5E5E5] p-4 space-y-2 bg-neutral-50/50">
              <label className="block font-bold text-black uppercase tracking-wider">
                Breakfast Window
              </label>
              <p className="text-[11px] text-neutral-500">Default hostel morning breakfast</p>
              <input
                type="time"
                value={settings.meal_times.breakfast}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    meal_times: { ...settings.meal_times, breakfast: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-sm font-mono font-bold text-black bg-white focus:border-black focus:outline-none"
              />
            </div>

            <div className="rounded-lg border border-[#E5E5E5] p-4 space-y-2 bg-neutral-50/50">
              <label className="block font-bold text-black uppercase tracking-wider">
                Lunch Window
              </label>
              <p className="text-[11px] text-neutral-500">Campus afternoon mess lunch</p>
              <input
                type="time"
                value={settings.meal_times.lunch}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    meal_times: { ...settings.meal_times, lunch: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-sm font-mono font-bold text-black bg-white focus:border-black focus:outline-none"
              />
            </div>

            <div className="rounded-lg border border-[#E5E5E5] p-4 space-y-2 bg-neutral-50/50">
              <label className="block font-bold text-black uppercase tracking-wider">
                Dinner Window
              </label>
              <p className="text-[11px] text-neutral-500">Hostel night dinner service</p>
              <input
                type="time"
                value={settings.meal_times.dinner}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    meal_times: { ...settings.meal_times, dinner: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-sm font-mono font-bold text-black bg-white focus:border-black focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Emergency Hotlines */}
      {activeTab === "emergency" && (
        <div className="rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-sm space-y-6">
          <div className="border-b border-[#E5E5E5] pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-black">
              Campus Emergency Hotlines
            </h2>
            <p className="text-xs text-neutral-500">
              Displayed in the red Emergency modal in the Student mobile app with 1-tap dial action.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Campus Clinic OPD Emergency Hotline
              </label>
              <input
                type="text"
                value={settings.emergency_contacts.clinic_opd}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    emergency_contacts: {
                      ...settings.emergency_contacts,
                      clinic_opd: e.target.value,
                    },
                  })
                }
                className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-xs font-mono font-bold text-black focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Campus Ambulance Driver / Dispatch
              </label>
              <input
                type="text"
                value={settings.emergency_contacts.ambulance}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    emergency_contacts: {
                      ...settings.emergency_contacts,
                      ambulance: e.target.value,
                    },
                  })
                }
                className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-xs font-mono font-bold text-black focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                National Emergency Response Service
              </label>
              <input
                type="text"
                value={settings.emergency_contacts.emergency_national}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    emergency_contacts: {
                      ...settings.emergency_contacts,
                      emergency_national: e.target.value,
                    },
                  })
                }
                className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-xs font-mono font-bold text-black focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Campus Security Main Gate Desk
              </label>
              <input
                type="text"
                value={settings.emergency_contacts.security_desk}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    emergency_contacts: {
                      ...settings.emergency_contacts,
                      security_desk: e.target.value,
                    },
                  })
                }
                className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-xs font-mono font-bold text-black focus:border-black focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Medicine Catalog */}
      {activeTab === "medicines" && (
        <div className="rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-black">
                Campus Dispensary Medicine Catalog
              </h2>
              <p className="text-xs text-neutral-500">
                Medicines searched by Campus Doctors during OPD consultations with real-time allergy cross-checks
              </p>
            </div>
            <Button
              onClick={() => setIsAddMedOpen(true)}
              className="rounded-lg bg-black text-white hover:bg-neutral-800 text-xs font-semibold px-3 h-8"
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Add Medicine
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#E5E5E5]">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-[#E5E5E5] text-[11px] uppercase font-semibold text-neutral-600 tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Medicine Name</th>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">Default Dose</th>
                  <th className="px-4 py-2.5">Dispensary Stock</th>
                  <th className="px-4 py-2.5">Allergy Triggers</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {settings.medicines.map((med) => (
                  <tr key={med.id} className="hover:bg-neutral-50/70">
                    <td className="px-4 py-2.5 font-bold text-black">{med.name}</td>
                    <td className="px-4 py-2.5 text-neutral-600">{med.category}</td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-neutral-800">
                      {med.default_dose}
                    </td>
                    <td className="px-4 py-2.5 font-mono">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${
                          med.stock_quantity < 50
                            ? "bg-red-100 text-red-700"
                            : "bg-neutral-100 text-black"
                        }`}
                      >
                        {med.stock_quantity} units
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {med.allergy_keywords.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {med.allergy_keywords.map((k) => (
                            <span
                              key={k}
                              className="rounded border border-[#E5E5E5] bg-neutral-100 px-1.5 py-0.2 text-[10px] text-neutral-700 lowercase"
                            >
                              {k}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-neutral-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => handleRemoveMedicine(med.id)}
                        className="rounded p-1 text-neutral-400 hover:text-red-600"
                        title="Delete medicine"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Doctor Presets */}
      {activeTab === "presets" && (
        <div className="rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-black">
                Doctor One-Tap Prescription Presets
              </h2>
              <p className="text-xs text-neutral-500">
                Clinical regimens that pre-populate the doctor&apos;s prescription sheet with one tap
              </p>
            </div>
            <Button
              onClick={() => setIsAddPresetOpen(true)}
              className="rounded-lg bg-black text-white hover:bg-neutral-800 text-xs font-semibold px-3 h-8"
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Add Preset
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settings.presets.map((preset) => (
              <div
                key={preset.id}
                className="rounded-lg border border-[#E5E5E5] bg-neutral-50/50 p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="rounded bg-black px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                      {preset.problem}
                    </span>
                    <h3 className="mt-1.5 text-xs font-bold text-black">{preset.name}</h3>
                  </div>
                  <button
                    onClick={() => handleRemovePreset(preset.id)}
                    className="text-neutral-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="border-t border-[#E5E5E5] pt-2 text-xs">
                  <div className="text-[11px] font-semibold text-neutral-500 mb-1">
                    Pre-configured Medicines:
                  </div>
                  <ul className="space-y-1">
                    {preset.medicine_names.map((name, i) => (
                      <li key={i} className="flex items-center space-x-1.5 text-neutral-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-black"></span>
                        <span className="font-medium text-black">{name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Medicine Modal */}
      {isAddMedOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-black">
                Add Dispensary Medicine
              </h3>
              <button
                onClick={() => setIsAddMedOpen(false)}
                className="rounded p-1 text-neutral-400 hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddMedicine} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Medicine Name</label>
                <input
                  type="text"
                  placeholder="e.g. Paracetamol 650mg"
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-xs focus:border-black focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Analgesic, Antibiotic, Antihistamine"
                  value={newMedCategory}
                  onChange={(e) => setNewMedCategory(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-xs focus:border-black focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Default Dose</label>
                  <input
                    type="text"
                    placeholder="1 tablet"
                    value={newMedDose}
                    onChange={(e) => setNewMedDose(e.target.value)}
                    className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-xs focus:border-black focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Stock Units</label>
                  <input
                    type="number"
                    min={0}
                    value={newMedStock}
                    onChange={(e) => setNewMedStock(parseInt(e.target.value, 10))}
                    className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-xs focus:border-black focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Allergy Keywords (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="paracetamol, acetaminophen"
                  value={newMedAllergies}
                  onChange={(e) => setNewMedAllergies(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-xs focus:border-black focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#E5E5E5]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddMedOpen(false)}
                  className="rounded-lg border-[#E5E5E5] text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-lg bg-black text-white hover:bg-neutral-800 text-xs font-semibold px-4"
                >
                  Add Medicine
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Preset Modal */}
      {isAddPresetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-black">
                Create Prescription Preset
              </h3>
              <button
                onClick={() => setIsAddPresetOpen(false)}
                className="rounded p-1 text-neutral-400 hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddPreset} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Preset Title</label>
                <input
                  type="text"
                  placeholder="e.g. Acute Viral Fever Protocol"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-xs focus:border-black focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Problem Category</label>
                <select
                  value={newPresetProblem}
                  onChange={(e) => setNewPresetProblem(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-xs bg-white focus:border-black focus:outline-none"
                >
                  <option value="Headache">Headache</option>
                  <option value="Body pain">Body pain</option>
                  <option value="Fever">Fever</option>
                  <option value="Cold and cough">Cold and cough</option>
                  <option value="Stomach issue">Stomach issue</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Select Prescribed Medicines
                </label>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-[#E5E5E5] p-2 space-y-1.5">
                  {settings.medicines.map((m) => {
                    const checked = newPresetMeds.includes(m.name);
                    return (
                      <label
                        key={m.id}
                        className="flex items-center space-x-2 text-xs cursor-pointer hover:bg-neutral-50 p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewPresetMeds([...newPresetMeds, m.name]);
                            } else {
                              setNewPresetMeds(newPresetMeds.filter((name) => name !== m.name));
                            }
                          }}
                          className="rounded border-[#E5E5E5] text-black focus:ring-black"
                        />
                        <span className="font-medium text-black">{m.name}</span>
                        <span className="text-[10px] text-neutral-400">({m.category})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#E5E5E5]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddPresetOpen(false)}
                  className="rounded-lg border-[#E5E5E5] text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={newPresetMeds.length === 0}
                  className="rounded-lg bg-black text-white hover:bg-neutral-800 text-xs font-semibold px-4"
                >
                  Save Preset
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
