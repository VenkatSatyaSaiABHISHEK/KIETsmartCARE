// KIET Smart Care - Interactive Educational Demo Controller

// Step-by-step pedagogical tour data across all 3 personas
const tourSteps = [
  // --- DOCTOR PORTAL STEPS (0 to 3) ---
  {
    persona: "doctor",
    stepIndexText: "STEP 1 OF 10",
    headline: "Doctor Student Lookup & Identification",
    tag: "🩺 DOCTOR PORTAL • LESSON 1",
    title: "1. Rapid Student Roll Number Search",
    what: "The doctor simply types the student's 10-character institutional roll number (e.g. 24AB012001). The system queries Supabase in real-time to load their name, branch, hostel block, and room number.",
    why: "Prevents clinical misidentification. Doctors never have to ask students for redundant paper slips or manual records.",
    spotlightId: "docSpotlightSearch",
    actionLabel: "Simulate Student Selected →",
    actionFn: () => {
      const card = document.getElementById("docSpotlightCard");
      if (card) {
        card.style.transform = "scale(1.03)";
        setTimeout(() => card.style.transform = "scale(1)", 300);
      }
    }
  },
  {
    persona: "doctor",
    stepIndexText: "STEP 2 OF 10",
    headline: "Allergy Invariant Protection (NKDA)",
    tag: "🩺 DOCTOR PORTAL • LESSON 2",
    title: "2. Automatic Drug Allergy Safety Lock",
    what: "Before prescribing, the system highlights known drug allergies recorded during college admission. Here, Penicillin and Amoxicillin are flagged in red.",
    why: "Patient Safety Invariant: Prevents accidental allergic reactions or anaphylaxis by locking out contraindicated medicines before the prescription can be written.",
    spotlightId: "docSpotlightAllergy",
    actionLabel: "Verify Safe Formulary →",
    actionFn: () => {
      const banner = document.getElementById("docSpotlightAllergy");
      if (banner) {
        banner.style.animation = "pulseAlarm 0.8s ease 2";
      }
    }
  },
  {
    persona: "doctor",
    stepIndexText: "STEP 3 OF 10",
    headline: "Clinical Formulary & Meal Timing Selection",
    tag: "🩺 DOCTOR PORTAL • LESSON 3",
    title: "3. Direct-to-Phone Prescription Engine",
    what: "The doctor selects medications from the approved KIET dispensary formulary. For each item, meal-relative instructions (Pre-breakfast, Post-lunch, Bedtime) and duration are designated.",
    why: "Students often forget whether antibiotics or painkillers should be taken before or after meals. The system converts these choices into custom alarm schedules automatically.",
    spotlightId: "docSpotlightPrescription",
    actionLabel: "View Submission Lock →",
    actionFn: () => {}
  },
  {
    persona: "doctor",
    stepIndexText: "STEP 4 OF 10",
    headline: "Immutable Medical Record & Phone Synchronization",
    tag: "🩺 DOCTOR PORTAL • LESSON 4",
    title: "4. Immutable Submission & Device Push",
    what: "When the doctor clicks 'Submit Consultation', the prescription is locked permanently under institutional medical invariants (cannot be altered post-submission) and pushed immediately to the student's mobile app.",
    why: "Guarantees complete legal and clinical audit trails. The moment the student walks out of the dispensary, their phone is already programmed with the exact dosage schedule.",
    spotlightId: "docSpotlightSubmit",
    actionLabel: "Simulate Submission Click ✨",
    actionFn: () => {
      const btn = document.getElementById("simulateSubmitBtn");
      if (btn) {
        btn.innerHTML = "<span>✓</span> Consultation Locked & Synced to Aarav's Phone!";
        btn.style.background = "#10b981";
        setTimeout(() => {
          btn.innerHTML = "<span>🔒</span> Submit Consultation & Sync To Student Phone";
          btn.style.background = "#0f172a";
        }, 2500);
      }
    }
  },

  // --- HEALTH OFFICER PORTAL STEPS (4 to 6) ---
  {
    persona: "officer",
    stepIndexText: "STEP 5 OF 10",
    headline: "Campus Surveillance & Epidemic Metrics Strip",
    tag: "🛡️ HEALTH OFFICER • LESSON 5",
    title: "5. Realtime Campus Health Intelligence",
    what: "The Health Officer's dashboard displays high-level institutional metrics: Active Sick Hostellers, Overdue Doses, Adherence Rates, and Critical Red Flags.",
    why: "Enables campus administrators to detect infectious outbreaks (e.g. viral fever clusters in specific hostel blocks) before they spread to the wider student body.",
    spotlightId: "offSpotlightMetrics",
    actionLabel: "Inspect Alarm Queue →",
    actionFn: () => {}
  },
  {
    persona: "officer",
    stepIndexText: "STEP 6 OF 10",
    headline: "Priority Escalation & Missed Dose Queue",
    tag: "🛡️ HEALTH OFFICER • LESSON 6",
    title: "6. Automated Red Flag Escalation",
    what: "If a student does not confirm taking a prescribed medication within 60 minutes of the scheduled alarm, the system automatically escalates an urgent alert to the Health Officer console.",
    why: "Ensures students who are sick, asleep, or incapacitated in hostel rooms are not forgotten. The campus actively looks out for their recovery.",
    spotlightId: "offSpotlightQueue",
    actionLabel: "Simulate Outreach Call 📞",
    actionFn: () => {
      const actionBtn = document.getElementById("offSpotlightAction");
      if (actionBtn) {
        actionBtn.innerText = "✓ Call Logged: Warden Alerted";
        actionBtn.style.background = "#10b981";
        setTimeout(() => {
          actionBtn.innerText = "📞 Call Student / Warden";
          actionBtn.style.background = "#0284c7";
        }, 2500);
      }
    }
  },

  // --- STUDENT MOBILE APP STEPS (7 to 9) ---
  {
    persona: "student",
    stepIndexText: "STEP 7 OF 10",
    headline: "Student Mobile: 100% Offline Medication Engine",
    tag: "📱 STUDENT MOBILE • LESSON 7",
    title: "7. Hardware-Level Offline Alarms",
    what: "Look at Phone 1. The student app synchronizes when connected to Wi-Fi, then programs exact native OS hardware alarms using the student's personal meal schedule (Breakfast, Lunch, Dinner).",
    why: "CRITICAL: The student does NOT need internet connection for the reminder alarm to ring! Even in airplane mode or during hostel Wi-Fi outages, alarms ring on schedule with gentle audio chimes.",
    spotlightId: "studSpotlightSchedule",
    actionLabel: "Trigger Simulated Alarm 🔔",
    actionFn: () => {}
  },
  {
    persona: "student",
    stepIndexText: "STEP 8 OF 10",
    headline: "One-Tap Dose Confirmation & Logging",
    tag: "📱 STUDENT MOBILE • LESSON 8",
    title: "8. One-Tap Confirmation & Safe Taking",
    what: "Look at Phone 2. When the alarm fires, an interactive full-screen prompt appears with medication instructions ('Take with full glass of water').",
    why: "Tapping 'I Have Taken This Dose' stops the alarm chime and logs the dose. If offline, the event is securely queued locally and syncs to Supabase the moment network is restored.",
    spotlightId: "studSpotlightAlarm",
    actionLabel: "Simulate 'Take Dose' Tap ✓",
    actionFn: () => {
      const takeBtn = document.getElementById("simulateTakeDoseBtn");
      if (takeBtn) {
        takeBtn.innerText = "✓ DOSE LOGGED (STOPPING ALARM)";
        takeBtn.style.background = "#059669";
        setTimeout(() => {
          takeBtn.innerText = "✓ I HAVE TAKEN THIS DOSE";
          takeBtn.style.background = "#10b981";
        }, 2500);
      }
    }
  },
  {
    persona: "student",
    stepIndexText: "STEP 9 OF 10",
    headline: "Emergency Helplines & On-Campus Ambulance",
    tag: "📱 STUDENT MOBILE • LESSON 9",
    title: "9. Instant 1-Tap Campus Helplines",
    what: "Look at Phone 3. The emergency screen provides direct one-tap telephone links to: (1) KIET Campus Central Clinic, (2) Attending OPD Doctor, and (3) Active Hostel Triage Officer.",
    why: "Removes panic during medical emergencies. Instead of searching contacts or notice boards, students can connect directly to campus health responders in seconds.",
    spotlightId: "studSpotlightHelp",
    actionLabel: "Review Complete Ecosystem ✨",
    actionFn: () => {}
  },
  {
    persona: "student",
    stepIndexText: "STEP 10 OF 10",
    headline: "Summary: The Closed-Loop Care Ecosystem",
    tag: "🎓 CLASSROOM SUMMARY",
    title: "10. Full System Harmony & Student Safety",
    what: "From Doctor Prescription → to Offline Mobile Alarms → to Student Confirmation → to Officer Surveillance: KIET Smart Care creates a closed loop where no sick student is left unattended.",
    why: "Empowers the institution to safeguard student health, increase medication adherence to 95%+, and maintain complete clinical compliance.",
    spotlightId: null,
    actionLabel: "Restart Presentation 🔄",
    actionFn: () => {
      goToStep(0);
    }
  }
];

let currentStep = 0;

// Elements
const stepCounterBadge = document.getElementById("stepCounterBadge");
const stepHeadlineText = document.getElementById("stepHeadlineText");
const prevStepBtn = document.getElementById("prevStepBtn");
const nextStepBtn = document.getElementById("nextStepBtn");
const restartTourBtn = document.getElementById("restartTourBtn");

const pedagogyCard = document.getElementById("pedagogyCard");
const pedagogyTag = document.getElementById("pedagogyTag");
const pedagogyTitle = document.getElementById("pedagogyTitle");
const pedagogyWhat = document.getElementById("pedagogyWhat");
const pedagogyWhy = document.getElementById("pedagogyWhy");
const pedagogyActionBtn = document.getElementById("pedagogyActionBtn");

const tabButtons = document.querySelectorAll(".tab-btn");
const doctorView = document.getElementById("doctorView");
const officerView = document.getElementById("officerView");
const studentView = document.getElementById("studentView");

// Switch Portal View
function switchView(viewName) {
  tabButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === viewName);
  });

  doctorView.classList.toggle("active-view", viewName === "doctor");
  doctorView.style.display = viewName === "doctor" ? "block" : "none";

  officerView.classList.toggle("active-view", viewName === "officer");
  officerView.style.display = viewName === "officer" ? "block" : "none";

  studentView.classList.toggle("active-view", viewName === "student");
  studentView.style.display = viewName === "student" ? "flex" : "none";
}

// Update Tour Step
function renderStep(index) {
  if (index < 0 || index >= tourSteps.length) return;
  currentStep = index;
  const step = tourSteps[currentStep];

  // 1. Ensure active view is visible
  switchView(step.persona);

  // 2. Update Top Bar
  stepCounterBadge.innerText = step.stepIndexText;
  stepHeadlineText.innerText = step.headline;

  // 3. Update Buttons
  prevStepBtn.disabled = currentStep === 0;
  nextStepBtn.innerText = currentStep === tourSteps.length - 1 ? "Finish Tour ✓" : "Next Step →";

  // 4. Update Floating Pedagogical Card
  pedagogyTag.innerText = step.tag;
  pedagogyTitle.innerText = step.title;
  pedagogyWhat.innerText = step.what;
  pedagogyWhy.innerHTML = `<strong>Why Students Need This:</strong> ${step.why}`;
  pedagogyActionBtn.innerText = step.actionLabel;

  // 5. Remove existing spotlight highlights
  document.querySelectorAll(".spotlight-active").forEach(el => {
    el.classList.remove("spotlight-active");
  });

  // 6. Highlight target element if present
  if (step.spotlightId) {
    const targetEl = document.getElementById(step.spotlightId);
    if (targetEl) {
      targetEl.classList.add("spotlight-active");
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
}

function goToStep(index) {
  renderStep(index);
}

// Event Listeners for Persona Tabs
tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const view = btn.dataset.view;
    if (view === "doctor") goToStep(0);
    else if (view === "officer") goToStep(4);
    else if (view === "student") goToStep(6);
  });
});

// Navigation Controls
prevStepBtn.addEventListener("click", () => {
  if (currentStep > 0) goToStep(currentStep - 1);
});

nextStepBtn.addEventListener("click", () => {
  if (currentStep < tourSteps.length - 1) {
    goToStep(currentStep + 1);
  } else {
    goToStep(0);
  }
});

restartTourBtn.addEventListener("click", () => {
  goToStep(0);
});

pedagogyActionBtn.addEventListener("click", () => {
  const step = tourSteps[currentStep];
  if (step && typeof step.actionFn === "function") {
    step.actionFn();
  }
  setTimeout(() => {
    if (currentStep < tourSteps.length - 1) {
      goToStep(currentStep + 1);
    }
  }, 1000);
});

// Simulated interaction hooks
const simulateSubmitBtn = document.getElementById("simulateSubmitBtn");
if (simulateSubmitBtn) {
  simulateSubmitBtn.addEventListener("click", () => {
    const step = tourSteps[3];
    if (step && step.actionFn) step.actionFn();
  });
}

const simulateTakeDoseBtn = document.getElementById("simulateTakeDoseBtn");
if (simulateTakeDoseBtn) {
  simulateTakeDoseBtn.addEventListener("click", () => {
    const step = tourSteps[7];
    if (step && step.actionFn) step.actionFn();
  });
}

// Keyboard shortcuts for classroom presentation
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === "PageDown") {
    if (currentStep < tourSteps.length - 1) goToStep(currentStep + 1);
  } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
    if (currentStep > 0) goToStep(currentStep - 1);
  } else if (e.key === "Home") {
    goToStep(0);
  }
});

// Initial boot
renderStep(0);
console.log("KIET Smart Care Educational Demo Loaded successfully.");
