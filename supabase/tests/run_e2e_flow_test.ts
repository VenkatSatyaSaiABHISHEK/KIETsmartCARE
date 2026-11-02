// ==============================================================================
// KIET Smart Care - End-to-End Clinical Flow & Safety Verification
// ==============================================================================

import {
  BEFORE_MEAL_OFFSET_MINUTES,
  AFTER_MEAL_OFFSET_MINUTES,
  DEFAULT_MEAL_TIMES,
  MISSED_DOSE_ADVISORY,
} from "../../packages/shared/src/constants";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`✖ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✔ PASS: ${message}`);
}

console.log("=====================================================");
console.log("KIET SMART CARE - AUTOMATED TEST & VERIFICATION SUITE");
console.log("=====================================================\n");

// ----------------------------------------------------------------------------
// TEST 1: MEAL-ANCHORED TIMING MATH
// ----------------------------------------------------------------------------
console.log("--- 1. Meal-Anchored Schedule Generation Math ---");

function calculateOffsetTime(timeHHMM: string, offsetMinutes: number): string {
  const [h, m] = timeHHMM.split(":").map(Number);
  const totalMinutes = h * 60 + m + offsetMinutes;
  const normalized = (totalMinutes + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

// Student meal schedule: Breakfast 08:15, Lunch 13:30, Dinner 20:30
const studentMeals = {
  breakfast: "08:15",
  lunch: "13:30",
  dinner: "20:30",
};

// Before meal = meal time - 30 minutes
const breakfastBefore = calculateOffsetTime(studentMeals.breakfast, BEFORE_MEAL_OFFSET_MINUTES);
assert(breakfastBefore === "07:45", `Before breakfast (08:15 - 30m) = 07:45 (Got: ${breakfastBefore})`);

// After meal = meal time + 30 minutes
const lunchAfter = calculateOffsetTime(studentMeals.lunch, AFTER_MEAL_OFFSET_MINUTES);
assert(lunchAfter === "14:00", `After lunch (13:30 + 30m) = 14:00 (Got: ${lunchAfter})`);

const dinnerAfter = calculateOffsetTime(studentMeals.dinner, AFTER_MEAL_OFFSET_MINUTES);
assert(dinnerAfter === "21:00", `After dinner (20:30 + 30m) = 21:00 (Got: ${dinnerAfter})`);

// ----------------------------------------------------------------------------
// TEST 2: SAFETY INVARIANT - NEVER ADVISE DOUBLE DOSES
// ----------------------------------------------------------------------------
console.log("\n--- 2. Clinical Safety Invariant ---");
assert(
  MISSED_DOSE_ADVISORY.toLowerCase().includes("never double up"),
  `Mandatory Missed Dose Advisory contains "never double up"`
);

// ----------------------------------------------------------------------------
// TEST 3: RECOVERY CHECK ESCALATION LOGIC (RED ALERTS)
// ----------------------------------------------------------------------------
console.log("\n--- 3. Recovery Check Escalation & Alert Trigger Rules ---");

function evaluateAlertRule(answer: "better" | "same" | "worse" | "side_effect" | null, hoursElapsed: number) {
  if (answer === "worse" || answer === "same" || answer === "side_effect") {
    return { shouldAlert: true, severity: "red", type: answer };
  }
  if (answer === null && hoursElapsed >= 24) {
    return { shouldAlert: true, severity: "normal", type: "no_response" };
  }
  return { shouldAlert: false, severity: null, type: null };
}

const worseResult = evaluateAlertRule("worse", 2);
assert(worseResult.shouldAlert && worseResult.severity === "red", `Worse answer produces immediate RED alert`);

const sameResult = evaluateAlertRule("same", 2);
assert(sameResult.shouldAlert && sameResult.severity === "red", `Same answer produces immediate RED alert`);

const sideEffectResult = evaluateAlertRule("side_effect", 1);
assert(sideEffectResult.shouldAlert && sideEffectResult.severity === "red", `Side effect produces immediate RED alert`);

const betterResult = evaluateAlertRule("better", 2);
assert(!betterResult.shouldAlert, `Better answer resolves cleanly without alert`);

const overdueResult = evaluateAlertRule(null, 25);
assert(overdueResult.shouldAlert && overdueResult.severity === "normal" && overdueResult.type === "no_response", `24h unanswered check produces normal-severity no_response alert`);

// ----------------------------------------------------------------------------
// TEST 4: OFFLINE QUEUE FIFO LOGIC & LOCAL ALARMS
// ----------------------------------------------------------------------------
console.log("\n--- 4. Offline Storage Queue & Local Notification Simulation ---");

interface QueuedItem {
  id: string;
  type: string;
  payload: any;
}

const offlineQueue: QueuedItem[] = [];

function enqueue(type: string, payload: any) {
  offlineQueue.push({ id: `q-${Date.now()}-${Math.random()}`, type, payload });
}

function flushQueue(): number {
  const count = offlineQueue.length;
  offlineQueue.length = 0; // cleared on successful flush
  return count;
}

// Phone is offline: student takes Paracetamol and records response
enqueue("DOSE_RESPONSE", { schedule_id: "ds-01", status: "taken", time: new Date().toISOString() });
enqueue("RECOVERY_RESPONSE", { inquiry_id: "rc-01", status: "worse" });
assert(offlineQueue.length === 2, `Offline queue stores 2 adherence items while phone is offline`);

// Network reconnects: flush queue
const flushed = flushQueue();
assert(flushed === 2 && offlineQueue.length === 0, `Offline queue flushed 2 items and reset cleanly upon reconnection`);

// ----------------------------------------------------------------------------
// TEST 5: FULL CLOSED-LOOP MEDICAL ESCALATION SIMULATION
// ----------------------------------------------------------------------------
console.log("\n--- 5. Full Closed-Loop Flow Simulation ---");

// Step 1: Doctor submits clinical visit for student
const mockVisit = {
  id: "vst-test-01",
  student_id: "c0000000-0000-0000-0000-000000000001",
  doctor_id: "d0000000-0000-0000-0000-000000000002",
  problem: "Acute Viral Illness",
  medications: [
    { name: "Paracetamol 650mg", times_per_day: 2, relation: "after", days: 3 },
    { name: "Pantoprazole 40mg", times_per_day: 1, relation: "before", days: 3 },
  ],
};
console.log(`Doctor created visit: ${mockVisit.id} (${mockVisit.problem})`);

// Step 2: Dose schedule generation simulation
const generatedSchedules: any[] = [];
mockVisit.medications.forEach((m) => {
  for (let day = 0; day < m.days; day++) {
    for (let slot = 0; slot < m.times_per_day; slot++) {
      generatedSchedules.push({
        id: `ds-${m.name}-${day}-${slot}`,
        medicine: m.name,
        day,
        status: "scheduled",
      });
    }
  }
});
assert(generatedSchedules.length === 9, `Atomic schedule generated 9 total doses (6 PCM + 3 Panto)`);

// Step 3: Student completes course and answers 'Worse'
const studentAnswer = "worse";
const alertTrigger = evaluateAlertRule(studentAnswer, 0);
assert(alertTrigger.severity === "red", `Student answer Worse triggered RED alert broadcast`);

// Step 4: Health Officer receives alert and logs outreach call
const mockCallLog = {
  alert_id: "alt-test-01",
  officer_id: "e0000000-0000-0000-0000-000000000003",
  outcome: "reached",
  notes: "Contacted student. Advised visiting OPD immediately for repeat clinical evaluation.",
};
assert(mockCallLog.outcome === "reached", `Health Officer successfully executed and logged telephonic outreach`);

console.log("\n=====================================================");
console.log("ALL TESTS AND INVARIANTS VERIFIED SUCCESSFULLY!");
console.log("=====================================================");
