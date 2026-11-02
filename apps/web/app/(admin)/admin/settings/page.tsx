"use client";

import React, { useEffect, useState } from "react";
import { AdminSettingsData } from "@/lib/admin/types";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<"meals" | "emergency" | "medicines" | "aliases">("meals");
  const [settings, setSettings] = useState<AdminSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Aliases state
  const [aliases, setAliases] = useState<{ alias: string; canonical: string }[]>([]);
  const [newAlias, setNewAlias] = useState("");
  const [newCanonical, setNewCanonical] = useState("");
  const [aliasSaving, setAliasSaving] = useState(false);

  const fetchAliases = async () => {
    try {
      const res = await fetch("/api/admin/problem-aliases");
      const data = await res.json();
      if (data.aliases) setAliases(data.aliases);
    } catch {}
  };

  const handleAddAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlias.trim() || !newCanonical.trim()) return;
    setAliasSaving(true);
    try {
      const res = await fetch("/api/admin/problem-aliases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias: newAlias.trim(), canonical: newCanonical.trim() }),
      });
      if (res.ok) {
        setNewAlias("");
        setNewCanonical("");
        fetchAliases();
      }
    } finally {
      setAliasSaving(false);
    }
  };

  const handleDeleteAlias = async (alias: string) => {
    try {
      await fetch(`/api/admin/problem-aliases?alias=${encodeURIComponent(alias)}`, {
        method: "DELETE",
      });
      fetchAliases();
    } catch {}
  };

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
    fetchAliases();
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
      if (!res.ok) throw new Error("Failed to save institutional settings");
      setFeedback({ type: "success", message: "Institutional configuration updated successfully." });
    } catch (e: any) {
      setFeedback({ type: "error", message: e?.message || "Failed to update configuration" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex items-baseline justify-between border-b border-[#E4E4E7] pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#09090B]">Institution Settings</h1>
          <p className="text-xs text-[#71717A] mt-1">
            Configure campus-wide meal timing defaults, clinic emergency contacts, and formulary catalog.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !settings}
          className="h-10 px-6 rounded bg-[#09090B] text-white text-xs font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded text-xs border ${
            feedback.type === "success"
              ? "bg-[#FAFAFA] border-[#09090B] text-[#09090B]"
              : "bg-red-50 border-red-200 text-[#DC2626]"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E4E4E7] pb-2 text-xs">
        {(
          [
            { id: "meals", label: "Default Meal Timings" },
            { id: "emergency", label: "Emergency Hotlines" },
            { id: "medicines", label: "Medicines Formulary" },
            { id: "aliases", label: "Problem Normalization Aliases" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === t.id
                ? "bg-[#09090B] text-white font-medium"
                : "text-[#71717A] hover:text-[#09090B]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading || !settings ? (
        <div className="py-12 text-xs text-[#71717A]">Loading settings...</div>
      ) : (
        <div className="max-w-xl space-y-6">
          {/* Tab 1: Meals */}
          {activeTab === "meals" && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-2xs uppercase tracking-wider text-[#71717A] font-semibold block">
                  Default Breakfast Time
                </label>
                <input
                  type="time"
                  value={settings.meal_times?.breakfast || "08:00"}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      meal_times: {
                        ...settings.meal_times,
                        breakfast: e.target.value,
                      },
                    })
                  }
                  className="h-10 px-3 w-48 text-xs rounded border border-[#E4E4E7] bg-white focus:outline-none focus:border-[#09090B]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-2xs uppercase tracking-wider text-[#71717A] font-semibold block">
                  Default Lunch Time
                </label>
                <input
                  type="time"
                  value={settings.meal_times?.lunch || "13:00"}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      meal_times: {
                        ...settings.meal_times,
                        lunch: e.target.value,
                      },
                    })
                  }
                  className="h-10 px-3 w-48 text-xs rounded border border-[#E4E4E7] bg-white focus:outline-none focus:border-[#09090B]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-2xs uppercase tracking-wider text-[#71717A] font-semibold block">
                  Default Dinner Time
                </label>
                <input
                  type="time"
                  value={settings.meal_times?.dinner || "20:00"}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      meal_times: {
                        ...settings.meal_times,
                        dinner: e.target.value,
                      },
                    })
                  }
                  className="h-10 px-3 w-48 text-xs rounded border border-[#E4E4E7] bg-white focus:outline-none focus:border-[#09090B]"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Emergency */}
          {activeTab === "emergency" && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-2xs uppercase tracking-wider text-[#71717A] font-semibold block">
                  Campus Health Centre Hotline
                </label>
                <input
                  type="text"
                  value={settings.emergency_contacts?.clinic_opd || "+91-120-2983555"}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      emergency_contacts: {
                        ...settings.emergency_contacts,
                        clinic_opd: e.target.value,
                      },
                    })
                  }
                  className="h-10 px-3 w-full text-xs rounded border border-[#E4E4E7] bg-white focus:outline-none focus:border-[#09090B]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-2xs uppercase tracking-wider text-[#71717A] font-semibold block">
                  Ambulance Dispatch
                </label>
                <input
                  type="text"
                  value={settings.emergency_contacts?.ambulance || "108"}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      emergency_contacts: {
                        ...settings.emergency_contacts,
                        ambulance: e.target.value,
                      },
                    })
                  }
                  className="h-10 px-3 w-full text-xs rounded border border-[#E4E4E7] bg-white focus:outline-none focus:border-[#09090B]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-2xs uppercase tracking-wider text-[#71717A] font-semibold block">
                  National Emergency Service
                </label>
                <input
                  type="text"
                  value={settings.emergency_contacts?.emergency_national || "112"}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      emergency_contacts: {
                        ...settings.emergency_contacts,
                        emergency_national: e.target.value,
                      },
                    })
                  }
                  className="h-10 px-3 w-full text-xs rounded border border-[#E4E4E7] bg-white focus:outline-none focus:border-[#09090B]"
                />
              </div>
            </div>
          )}

          {/* Tab 3: Medicines */}
          {activeTab === "medicines" && (
            <div className="space-y-3">
              <p className="text-xs text-[#71717A]">
                Institutional catalog items available for OPD prescription entries.
              </p>
              <div className="border border-[#E4E4E7] rounded divide-y divide-[#E4E4E7]">
                {(settings.medicines || []).map((m: any) => (
                  <div key={m.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-[#09090B]">{m.name}</div>
                      <div className="text-[#71717A]">
                        {m.category} &bull; Default: {m.default_dose}
                      </div>
                    </div>
                    <div className="font-mono text-[#71717A]">Stock: {m.stock_quantity}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Problem Normalization Aliases */}
          {activeTab === "aliases" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[#09090B]">Problem Category Normalization</h3>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Maps messy clinical symptom phrases entered by doctors to canonical categories for epidemiological surveillance.
                </p>
              </div>

              {/* Add New Alias Form */}
              <form onSubmit={handleAddAlias} className="p-4 border border-[#E4E4E7] rounded bg-[#FAFAFA] space-y-3">
                <div className="text-xs font-semibold text-[#09090B]">Map New Synonym / Alias</div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[#71717A] mb-1">Doctor Input Phrase (Alias)</label>
                    <input
                      type="text"
                      placeholder="e.g. head ache or throat pain"
                      value={newAlias}
                      onChange={(e) => setNewAlias(e.target.value)}
                      className="w-full h-8 px-2.5 rounded border border-[#E4E4E7] bg-white text-xs focus:outline-none focus:border-[#09090B]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[#71717A] mb-1">Canonical Normalized Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Headache or Pharyngitis"
                      value={newCanonical}
                      onChange={(e) => setNewCanonical(e.target.value)}
                      className="w-full h-8 px-2.5 rounded border border-[#E4E4E7] bg-white text-xs focus:outline-none focus:border-[#09090B]"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={aliasSaving}
                  className="h-8 px-3 rounded bg-[#09090B] text-white text-xs font-medium hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
                >
                  {aliasSaving ? "Saving..." : "Add Normalization Mapping"}
                </button>
              </form>

              {/* Aliases Table */}
              <div className="border border-[#E4E4E7] rounded divide-y divide-[#E4E4E7] overflow-hidden">
                <div className="bg-[#FAFAFA] px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#71717A] flex justify-between">
                  <span>Input Variation</span>
                  <span>Mapped Canonical Category</span>
                </div>
                {aliases.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#71717A]">No custom mappings defined yet.</div>
                ) : (
                  aliases.map((item) => (
                    <div key={item.alias} className="p-3 flex items-center justify-between text-xs hover:bg-[#FAFAFA]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[#09090B] bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                          {item.alias}
                        </span>
                        <span className="text-[#71717A]">&rarr;</span>
                        <span className="font-medium text-[#09090B]">{item.canonical}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteAlias(item.alias)}
                        className="text-xs text-[#DC2626] hover:underline cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
