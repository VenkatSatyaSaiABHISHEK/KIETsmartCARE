"use client";

import React, { useState } from "react";

export type ClinicalSlot = "morning" | "afternoon" | "evening" | "night";

export interface ScheduledDoseItem {
  id: string;
  slot: ClinicalSlot;
  timeStr: string; // "13:30"
  mealRelation: "before" | "after";
  dayLabel: string; // "Today", "Tomorrow", "Day 3"
  dateStr: string; // YYYY-MM-DD
  displayLabel: string; // "Today afternoon, after food"
}

export interface TabletGroupState {
  id: string;
  label: string; // "Tablet 1" ... "Tablet 4"
  tabletsPerDose: number; // 1-5
  totalDoses: number; // 1-7
  schedule: ScheduledDoseItem[];
}

interface TabletPrescriptionFormProps {
  selectedProblems: string[];
  onToggleProblem: (problem: string) => void;
  otherProblemText: string;
  onChangeOtherText: (text: string) => void;
  tabletGroups: TabletGroupState[];
  onUpdateTabletGroup: (index: number, updated: TabletGroupState) => void;
  onAddTabletGroup: () => void;
  onRemoveTabletGroup: (index: number) => void;
  followUp: string; // "none" | "tomorrow" | "day_after" | "custom"
  customFollowUpDate: string;
  onChangeFollowUp: (val: string, customDate?: string) => void;
  studentMealTimes?: { breakfast: string; lunch: string; dinner: string };
}

const PROBLEM_OPTIONS = [
  "Headache",
  "Body pain",
  "Fever",
  "Cold and cough",
  "Stomach pain",
  "Vomiting",
  "Sore throat",
  "Injury",
  "Other",
];

export function TabletPrescriptionForm({
  selectedProblems,
  onToggleProblem,
  otherProblemText,
  onChangeOtherText,
  tabletGroups,
  onUpdateTabletGroup,
  onAddTabletGroup,
  onRemoveTabletGroup,
  followUp,
  customFollowUpDate,
  onChangeFollowUp,
  studentMealTimes,
}: TabletPrescriptionFormProps) {
  // Popover state for editing a schedule segment
  const [activePopover, setActivePopover] = useState<{
    groupIndex: number;
    doseIndex: number;
  } | null>(null);

  // Helper to calculate initial sequential doses
  const generateDoses = (
    count: number,
    mealRelation: "before" | "after" = "after"
  ): ScheduledDoseItem[] => {
    const list: ScheduledDoseItem[] = [];
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    // Default times or adjusted by student's meal times
    const slotTimes: Record<ClinicalSlot, { time: string; mins: number }> = {
      morning: { time: "08:00", mins: 8 * 60 },
      afternoon: { time: "13:30", mins: 13 * 60 + 30 },
      evening: { time: "17:00", mins: 17 * 60 },
      night: { time: "20:30", mins: 20 * 60 + 30 },
    };

    if (studentMealTimes) {
      if (studentMealTimes.breakfast) {
        const [h, m] = studentMealTimes.breakfast.split(":").map(Number);
        const adj = mealRelation === "before" ? -30 : 30;
        const total = h * 60 + m + adj;
        slotTimes.morning = {
          time: `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`,
          mins: total,
        };
      }
      if (studentMealTimes.lunch) {
        const [h, m] = studentMealTimes.lunch.split(":").map(Number);
        const adj = mealRelation === "before" ? -30 : 30;
        const total = h * 60 + m + adj;
        slotTimes.afternoon = {
          time: `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`,
          mins: total,
        };
      }
      if (studentMealTimes.dinner) {
        const [h, m] = studentMealTimes.dinner.split(":").map(Number);
        const adj = mealRelation === "before" ? -30 : 30;
        const total = h * 60 + m + adj;
        slotTimes.night = {
          time: `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`,
          mins: total,
        };
      }
    }

    const slotOrder: ClinicalSlot[] = ["morning", "afternoon", "evening", "night"];

    let dayOffset = 0;
    while (list.length < count) {
      for (const slot of slotOrder) {
        const slotConfig = slotTimes[slot];
        // If today, check if at least 30 mins from now
        if (dayOffset === 0 && slotConfig.mins < currentMins + 30) {
          continue; // Skip past or too close slot
        }

        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + dayOffset);
        const yyyy = targetDate.getFullYear();
        const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
        const dd = String(targetDate.getDate()).padStart(2, "0");
        const dateStr = `${yyyy}-${mm}-${dd}`;

        const dayLabel =
          dayOffset === 0 ? "Today" : dayOffset === 1 ? "Tomorrow" : `Day ${dayOffset + 1}`;

        const displayLabel = `${dayLabel} ${slot}, ${mealRelation} food`;

        list.push({
          id: `dose-${dayOffset}-${slot}-${Date.now()}-${list.length}`,
          slot,
          timeStr: slotConfig.time,
          mealRelation,
          dayLabel,
          dateStr,
          displayLabel,
        });

        if (list.length >= count) break;
      }
      dayOffset++;
    }

    return list;
  };

  const handleTabletsPerDoseChange = (groupIndex: number, val: number) => {
    const group = tabletGroups[groupIndex];
    onUpdateTabletGroup(groupIndex, {
      ...group,
      tabletsPerDose: val,
    });
  };

  const handleTotalDosesChange = (groupIndex: number, val: number) => {
    const group = tabletGroups[groupIndex];
    const newSchedule = generateDoses(val, group.schedule[0]?.mealRelation || "after");
    onUpdateTabletGroup(groupIndex, {
      ...group,
      totalDoses: val,
      schedule: newSchedule,
    });
  };

  const handleUpdateDoseItem = (
    groupIndex: number,
    doseIndex: number,
    updates: Partial<ScheduledDoseItem>
  ) => {
    const group = tabletGroups[groupIndex];
    const current = group.schedule[doseIndex];
    const updated = { ...current, ...updates };
    updated.displayLabel = `${updated.dayLabel} ${updated.slot}, ${updated.mealRelation} food`;

    const newSchedule = [...group.schedule];
    newSchedule[doseIndex] = updated;

    onUpdateTabletGroup(groupIndex, {
      ...group,
      schedule: newSchedule,
    });
  };

  const handleRemoveDose = (groupIndex: number, doseIndex: number) => {
    const group = tabletGroups[groupIndex];
    if (group.schedule.length <= 1) return;
    const newSchedule = group.schedule.filter((_, idx) => idx !== doseIndex);
    onUpdateTabletGroup(groupIndex, {
      ...group,
      totalDoses: newSchedule.length,
      schedule: newSchedule,
    });
    setActivePopover(null);
  };

  const handleAddDoseToGroup = (groupIndex: number) => {
    const group = tabletGroups[groupIndex];
    if (group.schedule.length >= 7) return;
    const count = group.schedule.length + 1;
    const newSchedule = generateDoses(count, group.schedule[0]?.mealRelation || "after");
    onUpdateTabletGroup(groupIndex, {
      ...group,
      totalDoses: count,
      schedule: newSchedule,
    });
    setActivePopover(null);
  };

  return (
    <div className="w-full flex flex-col space-y-6 select-none font-sans text-[#0F1B33]">
      {/* 1. PROBLEM SECTION */}
      <div>
        <div className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-[#6B7280] mb-2.5">
          PROBLEM
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {PROBLEM_OPTIONS.map((prob) => {
            const isSelected = selectedProblems.includes(prob);
            return (
              <button
                key={prob}
                type="button"
                onClick={() => onToggleProblem(prob)}
                className={`h-8 px-3 rounded-[6px] text-[13px] font-medium transition-colors cursor-pointer border ${
                  isSelected
                    ? "bg-[#1D4ED8] text-white border-[#1D4ED8]"
                    : "bg-white text-[#0F1B33] border-[#E5E7EB] hover:bg-slate-50"
                }`}
              >
                {prob}
              </button>
            );
          })}
        </div>

        {/* Text field if 'Other' is selected */}
        {selectedProblems.includes("Other") && (
          <div className="mt-2.5 max-w-[400px]">
            <input
              type="text"
              placeholder="Specify problem description..."
              value={otherProblemText}
              onChange={(e) => onChangeOtherText(e.target.value)}
              className="w-full h-8 px-3 text-[13px] border border-[#E5E7EB] rounded-[6px] text-[#0F1B33] placeholder-[#9CA3AF] focus:outline-none focus:border-[#1D4ED8]"
            />
          </div>
        )}
      </div>

      <div className="border-t border-[#E5E7EB]" />

      {/* 2. TABLETS SECTION (Tablet 1 to Tablet 4) */}
      <div className="space-y-6">
        <div className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
          TABLETS
        </div>

        {tabletGroups.map((group, groupIdx) => (
          <div key={group.id} className="space-y-4 pt-1">
            {/* Header: Label ("Tablet 1") + Optional Remove */}
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-[18px] font-bold text-[#0F1B33]">
                {group.label}
              </h3>
              {groupIdx > 0 && (
                <button
                  type="button"
                  onClick={() => onRemoveTabletGroup(groupIdx)}
                  className="text-[12px] font-sans text-[#B91C1C] hover:underline cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Row of Tablets per dose & Doses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* TABLETS PER DOSE (1 to 5, 44px min tap target) */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B7280] mb-2">
                  TABLETS PER DOSE
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((num) => {
                    const isSel = group.tabletsPerDose === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleTabletsPerDoseChange(groupIdx, num)}
                        className={`w-11 h-11 rounded-[6px] text-[15px] font-medium transition-colors cursor-pointer border ${
                          isSel
                            ? "bg-[#1D4ED8] text-white border-[#1D4ED8]"
                            : "bg-white text-[#0F1B33] border-[#E5E7EB] hover:bg-slate-50"
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DOSES (1 to 7) */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B7280] mb-2">
                  DOSES
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                    const isSel = group.totalDoses === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleTotalDosesChange(groupIdx, num)}
                        className={`w-11 h-11 rounded-[6px] text-[15px] font-medium transition-colors cursor-pointer border ${
                          isSel
                            ? "bg-[#1D4ED8] text-white border-[#1D4ED8]"
                            : "bg-white text-[#0F1B33] border-[#E5E7EB] hover:bg-slate-50"
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SCHEDULE STRIP */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B7280] mb-2">
                SCHEDULE
              </div>

              {/* Horizontal Strip of Tappable Segments */}
              <div className="flex flex-wrap items-center gap-2">
                {group.schedule.map((slotItem, doseIdx) => {
                  const isOpen =
                    activePopover?.groupIndex === groupIdx &&
                    activePopover?.doseIndex === doseIdx;

                  return (
                    <div key={slotItem.id} className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setActivePopover(
                            isOpen ? null : { groupIndex: groupIdx, doseIndex: doseIdx }
                          )
                        }
                        className={`h-9 px-3.5 rounded-[6px] text-[13px] border font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
                          isOpen
                            ? "border-[#1D4ED8] bg-[#F0F7FF] text-[#1D4ED8]"
                            : "border-[#E5E7EB] bg-white text-[#0F1B33] hover:bg-slate-50"
                        }`}
                      >
                        <span>{slotItem.displayLabel}</span>
                        <span className="text-[11px] text-[#6B7280]">
                          ({slotItem.timeStr})
                        </span>
                      </button>

                      {/* Schedule Edit Popover */}
                      {isOpen && (
                        <div className="absolute top-[42px] left-0 z-40 w-64 bg-white border border-[#E5E7EB] rounded-[8px] shadow-xl p-3 space-y-3">
                          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-1.5">
                            <span className="text-[12px] font-semibold text-[#0F1B33]">
                              Edit Dose #{doseIdx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => setActivePopover(null)}
                              className="text-[14px] text-[#6B7280] hover:text-[#0F1B33]"
                            >
                              ×
                            </button>
                          </div>

                          {/* Slot selection */}
                          <div className="space-y-1">
                            <label className="text-[11px] text-[#6B7280] uppercase tracking-wider font-semibold">
                              SLOT
                            </label>
                            <div className="grid grid-cols-2 gap-1 text-[12px]">
                              {(["morning", "afternoon", "evening", "night"] as const).map(
                                (sl) => (
                                  <button
                                    key={sl}
                                    type="button"
                                    onClick={() =>
                                      handleUpdateDoseItem(groupIdx, doseIdx, { slot: sl })
                                    }
                                    className={`py-1 px-2 rounded-[4px] capitalize border ${
                                      slotItem.slot === sl
                                        ? "bg-[#1D4ED8] text-white border-[#1D4ED8]"
                                        : "bg-white text-[#0F1B33] border-[#E5E7EB]"
                                    }`}
                                  >
                                    {sl}
                                  </button>
                                )
                              )}
                            </div>
                          </div>

                          {/* Meal Relation Toggle: Before / After food */}
                          <div className="space-y-1">
                            <label className="text-[11px] text-[#6B7280] uppercase tracking-wider font-semibold">
                              MEAL RELATION
                            </label>
                            <div className="grid grid-cols-2 gap-1 text-[12px]">
                              {(["after", "before"] as const).map((rel) => (
                                <button
                                  key={rel}
                                  type="button"
                                  onClick={() =>
                                    handleUpdateDoseItem(groupIdx, doseIdx, {
                                      mealRelation: rel,
                                    })
                                  }
                                  className={`py-1 px-2 rounded-[4px] capitalize border ${
                                    slotItem.mealRelation === rel
                                      ? "bg-[#1D4ED8] text-white border-[#1D4ED8]"
                                      : "bg-white text-[#0F1B33] border-[#E5E7EB]"
                                  }`}
                                >
                                  {rel} food
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Custom time input */}
                          <div className="space-y-1">
                            <label className="text-[11px] text-[#6B7280] uppercase tracking-wider font-semibold">
                              CUSTOM TIME (HH:MM)
                            </label>
                            <input
                              type="time"
                              value={slotItem.timeStr}
                              onChange={(e) =>
                                handleUpdateDoseItem(groupIdx, doseIdx, {
                                  timeStr: e.target.value,
                                })
                              }
                              className="w-full h-7 px-2 text-[12px] border border-[#E5E7EB] rounded-[4px]"
                            />
                          </div>

                          {/* Popover Actions: Remove dose / Add dose */}
                          <div className="pt-1.5 border-t border-[#E5E7EB] flex items-center justify-between text-[12px]">
                            {group.schedule.length > 1 ? (
                              <button
                                type="button"
                                onClick={() => handleRemoveDose(groupIdx, doseIdx)}
                                className="text-[#B91C1C] hover:underline"
                              >
                                Remove dose
                              </button>
                            ) : <div />}

                            {group.schedule.length < 7 && (
                              <button
                                type="button"
                                onClick={() => handleAddDoseToGroup(groupIdx)}
                                className="text-[#1D4ED8] font-medium hover:underline"
                              >
                                + Add dose
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        {/* Add Another Tablet (Text Link, deep blue, max 4) */}
        {tabletGroups.length < 4 && (
          <div className="pt-1">
            <button
              type="button"
              onClick={onAddTabletGroup}
              className="text-[13px] font-sans font-medium text-[#1D4ED8] hover:underline cursor-pointer"
            >
              Add another tablet (up to 4)
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-[#E5E7EB]" />

      {/* 3. FOLLOW-UP SECTION */}
      <div>
        <div className="text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-[#6B7280] mb-2.5">
          FOLLOW-UP
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "none", label: "None" },
            { id: "tomorrow", label: "Tomorrow" },
            { id: "day_after", label: "Day after" },
            { id: "custom", label: "Pick date" },
          ].map((btn) => {
            const isSel = followUp === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => onChangeFollowUp(btn.id)}
                className={`h-8 px-4 rounded-[6px] text-[13px] font-medium transition-colors cursor-pointer border ${
                  isSel
                    ? "bg-[#1D4ED8] text-white border-[#1D4ED8]"
                    : "bg-white text-[#0F1B33] border-[#E5E7EB] hover:bg-slate-50"
                }`}
              >
                {btn.label}
              </button>
            );
          })}

          {followUp === "custom" && (
            <input
              type="date"
              value={customFollowUpDate}
              onChange={(e) => onChangeFollowUp("custom", e.target.value)}
              className="h-8 px-2 text-[12px] border border-[#E5E7EB] rounded-[6px] text-[#0F1B33]"
            />
          )}
        </div>
      </div>
    </div>
  );
}

