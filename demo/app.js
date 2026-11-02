// ========================================================
// KIET SMART CARE - CINEMATIC DIRECTOR CONTROLLER
// High-Impact Interactive Presentation Engine
// ========================================================

const directorStages = [
  // --- DOCTOR OPD WORKSTATION (Stages 0 to 3) ---
  {
    persona: "doctor",
    stageBadge: "STAGE 01 / 10",
    stageTitle: "Student Identification & 10-Digit Roll Lookup",
    storyTag: "🩺 DOCTOR CLINICAL DESK • LESSON 1",
    storyTitle: "1. Instant Student Roll Number Search",
    storyBody: "The doctor simply types the student's 10-character institutional roll number (e.g. 24AB012001). The system queries Supabase in real-time to load their name, branch, hostel block, and room number.",
    storyWhy: "Prevents clinical misidentification. Doctors never have to ask students for redundant paper slips or manual records.",
    lensTarget: "spotlightDocSearch",
    actionText: "▶ Simulate Student Selected",
    onAction: () => {
      const card = document.getElementById("spotlightDocSelectedCard");
      if (card) {
        card.style.transform = "scale(1.04)";
        card.style.borderColor = "#0284c7";
        setTimeout(() => card.style.transform = "scale(1)", 350);
      }
    }
  },
  {
    persona: "doctor",
    stageBadge: "STAGE 02 / 10",
    stageTitle: "Allergy Invariant Protection & Contraindication Lock",
    storyTag: "🩺 DOCTOR CLINICAL DESK • LESSON 2",
    storyTitle: "2. Automatic Drug Allergy Safety Shield",
    storyBody: "Before prescribing, the system highlights known drug allergies recorded during college admission. Here, Penicillin and Amoxicillin are flagged in red.",
    storyWhy: "Patient Safety Invariant: Prevents accidental allergic reactions or anaphylaxis by locking out contraindicated medicines before the prescription can be written.",
    lensTarget: "spotlightDocAllergy",
    actionText: "▶ Verify Safe Formulary",
    onAction: () => {
      const shield = document.getElementById("spotlightDocAllergy");
      if (shield) {
        shield.style.boxShadow = "0 0 35px rgba(239, 68, 68, 0.7)";
        setTimeout(() => shield.style.boxShadow = "none", 1200);
      }
    }
  },
  {
    persona: "doctor",
    stageBadge: "STAGE 03 / 10",
    stageTitle: "Direct-to-Phone Formulary Prescribing Engine",
    storyTag: "🩺 DOCTOR CLINICAL DESK • LESSON 3",
    storyTitle: "3. Direct-to-Phone Prescription Engine",
    storyBody: "The doctor selects medications from the approved KIET dispensary formulary. For each item, meal-relative instructions (Pre-breakfast, Post-lunch, Bedtime) and duration are designated.",
    storyWhy: "Students often forget whether antibiotics or painkillers should be taken before or after meals. The system converts these choices into custom alarm schedules automatically.",
    lensTarget: "spotlightDocRx",
    actionText: "▶ Inspect Meal Mappings",
    onAction: () => {}
  },
  {
    persona: "doctor",
    stageBadge: "STAGE 04 / 10",
    stageTitle: "Immutable Cryptographic Submission & Mobile Push",
    storyTag: "🩺 DOCTOR CLINICAL DESK • LESSON 4",
    storyTitle: "4. Immutable Submission & Device Push",
    storyBody: "When the doctor clicks 'Seal Consultation', the prescription is locked permanently under institutional medical invariants (cannot be altered post-submission) and pushed immediately to the student's mobile app.",
    storyWhy: "Guarantees complete legal and clinical audit trails. The moment the student walks out of the dispensary, their phone is already programmed with the exact dosage schedule.",
    lensTarget: "spotlightDocSubmit",
    actionText: "▶ Seal & Transmit to Student Phone ✨",
    onAction: () => {
      const btn = document.getElementById("simulateSubmitBtn");
      if (btn) {
        btn.innerHTML = "<span>✓</span> Consultation Sealed & Transmitted to Aarav's Phone!";
        btn.style.background = "linear-gradient(135deg, #059669, #10b981)";
        setTimeout(() => {
          btn.innerHTML = "<span>🔒</span> Seal Consultation & Push To Aarav's Phone";
          btn.style.background = "linear-gradient(135deg, #0f172a, #1e293b)";
        }, 2800);
      }
    }
  },

  // --- HEALTH OFFICER SURVEILLANCE HQ (Stages 4 to 6) ---
  {
    persona: "officer",
    stageBadge: "STAGE 05 / 10",
    stageTitle: "Campus Surveillance & Real-Time Epidemic Telemetry",
    storyTag: "🛡️ TRIAGE COMMAND HQ • LESSON 5",
    storyTitle: "5. Real-Time Campus Health Intelligence",
    storyBody: "The Health Officer's dashboard displays high-level institutional metrics: Active Sick Hostellers, Overdue Doses, Adherence Rates, and Critical Red Flags.",
    storyWhy: "Enables campus administrators to detect infectious outbreaks (e.g. viral fever clusters in specific hostel blocks) before they spread to the wider student body.",
    lensTarget: "spotlightOffMetrics",
    actionText: "▶ Inspect Alert Queue",
    onAction: () => {}
  },
  {
    persona: "officer",
    stageBadge: "STAGE 06 / 10",
    stageTitle: "Priority Escalation & Missed Dose Triage Queue",
    storyTag: "🛡️ TRIAGE COMMAND HQ • LESSON 6",
    storyTitle: "6. Automated Red Flag Escalation",
    storyBody: "If a student does not confirm taking a prescribed medication within 60 minutes of the scheduled alarm, the system automatically escalates an urgent alert to the Health Officer console.",
    storyWhy: "Ensures students who are sick, asleep, or incapacitated in hostel rooms are not forgotten. The campus actively looks out for their recovery.",
    lensTarget: "spotlightOffQueue",
    actionText: "▶ Dispatch Campus Outreach 📞",
    onAction: () => {
      const callBtn = document.getElementById("spotlightOffAction");
      if (callBtn) {
        callBtn.innerText = "✓ Dispatch Confirmed: Warden & Nurse Notified";
        callBtn.style.background = "linear-gradient(135deg, #059669, #10b981)";
        setTimeout(() => {
          callBtn.innerText = "📞 Dispatch Hostel Warden";
          callBtn.style.background = "linear-gradient(135deg, #0284c7, #0d9488)";
        }, 3000);
      }
    }
  },

  // --- STUDENT OFFLINE ENGINE (Stages 7 to 9) ---
  {
    persona: "student",
    stageBadge: "STAGE 07 / 10",
    stageTitle: "Native Mobile Hardware-Level Offline Alarms",
    storyTag: "📱 STUDENT OFFLINE ENGINE • LESSON 7",
    storyTitle: "7. Hardware-Level Offline Alarms",
    storyBody: "Look at Phone 1. The student app synchronizes when connected to Wi-Fi, then programs exact native OS hardware alarms using the student's personal meal schedule (Breakfast, Lunch, Dinner).",
    storyWhy: "CRITICAL: The student does NOT need internet connection for the reminder alarm to ring! Even in airplane mode or during hostel Wi-Fi outages, alarms ring on schedule with gentle audio chimes.",
    lensTarget: "spotlightStudSchedule",
    actionText: "▶ Trigger Alarm Simulation 🔔",
    onAction: () => {}
  },
  {
    persona: "student",
    stageBadge: "STAGE 08 / 10",
    stageTitle: "Interactive Alarm Trigger & 1-Tap Adherence Confirmation",
    storyTag: "📱 STUDENT OFFLINE ENGINE • LESSON 8",
    storyTitle: "8. One-Tap Confirmation & Safe Taking",
    storyBody: "Look at Phone 2. When the alarm fires, an interactive full-screen prompt appears with medication instructions ('Take with full glass of water').",
    storyWhy: "Tapping 'I Have Taken This Dose' stops the alarm chime and logs the dose. If offline, the event is securely queued locally and syncs to Supabase the moment network is restored.",
    lensTarget: "spotlightStudAlarm",
    actionText: "▶ Simulate 'Take Dose' Tap ✓",
    onAction: () => {
      const takeBtn = document.getElementById("simulateTakeDoseBtn");
      if (takeBtn) {
        takeBtn.innerText = "✓ DOSE LOGGED (STOPPING ALARM)";
        takeBtn.style.background = "#059669";
        setTimeout(() => {
          takeBtn.innerText = "✓ I HAVE TAKEN THIS DOSE";
          takeBtn.style.background = "#10b981";
        }, 2800);
      }
    }
  },
  {
    persona: "student",
    stageBadge: "STAGE 09 / 10",
    stageTitle: "Instant 1-Tap Direct Campus Helplines",
    storyTag: "📱 STUDENT OFFLINE ENGINE • LESSON 9",
    storyTitle: "9. Instant 1-Tap Campus Helplines",
    storyBody: "Look at Phone 3. The emergency screen provides direct one-tap telephone links to: (1) KIET Campus Central Clinic, (2) Attending OPD Doctor, and (3) Active Hostel Triage Officer.",
    storyWhy: "Removes panic during medical emergencies. Instead of searching contacts or notice boards, students can connect directly to campus health responders in seconds.",
    lensTarget: "spotlightStudHelp",
    actionText: "▶ Complete Ecosystem Summary ✨",
    onAction: () => {}
  },
  {
    persona: "student",
    stageBadge: "STAGE 10 / 10",
    stageTitle: "Closed-Loop Healthcare & Campus Safety Harmony",
    storyTag: "🎓 EXECUTIVE SUMMARY",
    storyTitle: "10. Full System Harmony & Student Safety",
    storyBody: "From Doctor Prescription → to Offline Mobile Alarms → to Student Confirmation → to Officer Surveillance: KIET Smart Care creates a closed loop where no sick student is left unattended.",
    storyWhy: "Empowers the institution to safeguard student health, increase medication adherence to 95%+, and maintain complete clinical compliance.",
    lensTarget: null,
    actionText: "🔄 Replay Presentation from Beginning",
    onAction: () => {
      jumpToStage(0);
    }
  }
];

let activeStageIdx = 0;

// DOM Elements
const introCurtain = document.getElementById("introCurtain");
const launchDemoBtn = document.getElementById("launchDemoBtn");

const dockTabs = document.querySelectorAll(".dock-tab");
const doctorViewport = document.getElementById("doctorViewport");
const officerViewport = document.getElementById("officerViewport");
const studentViewport = document.getElementById("studentViewport");

const directorProgressFill = document.getElementById("directorProgressFill");
const directorStepBadge = document.getElementById("directorStepBadge");
const directorStepTitle = document.getElementById("directorStepTitle");
const prevStageBtn = document.getElementById("prevStageBtn");
const nextStageBtn = document.getElementById("nextStageBtn");

const storyCard = document.getElementById("storyCard");
const storyTag = document.getElementById("storyTag");
const storyTitle = document.getElementById("storyTitle");
const storyBody = document.getElementById("storyBody");
const storyWhy = document.getElementById("storyWhy");
const storyActionBtn = document.getElementById("storyActionBtn");

const fullscreenToggleBtn = document.getElementById("fullscreenToggleBtn");
const restartTourBtn = document.getElementById("restartTourBtn");
const homeLogoBtn = document.getElementById("homeLogoBtn");

// Launch Experience
launchDemoBtn.addEventListener("click", () => {
  introCurtain.classList.add("hidden");
  // Try entering fullscreen if user clicked launch
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => {});
  }
  jumpToStage(0);
});

homeLogoBtn.addEventListener("click", () => {
  introCurtain.classList.remove("hidden");
});

// Fullscreen API Toggle
fullscreenToggleBtn.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});

// Viewport Switcher
function setStagePersona(persona) {
  dockTabs.forEach(tab => {
    tab.classList.toggle("active", tab.dataset.view === persona);
  });

  doctorViewport.classList.toggle("active", persona === "doctor");
  officerViewport.classList.toggle("active", persona === "officer");
  studentViewport.classList.toggle("active", persona === "student");
}

// Stage Renderer
function renderStage(idx) {
  if (idx < 0 || idx >= directorStages.length) return;
  activeStageIdx = idx;
  const stage = directorStages[activeStageIdx];

  // 1. Activate Stage Viewport
  setStagePersona(stage.persona);

  // 2. Update Director Progress Bar & Metadata
  const progressPercent = Math.round(((activeStageIdx + 1) / directorStages.length) * 100);
  directorProgressFill.style.width = `${progressPercent}%`;
  directorStepBadge.innerText = stage.stageBadge;
  directorStepTitle.innerText = stage.stageTitle;

  prevStageBtn.disabled = activeStageIdx === 0;
  nextStageBtn.innerText = activeStageIdx === directorStages.length - 1 ? "Complete Tour ✓" : "Next Stage →";

  // 3. Update Storyboard Card
  storyTag.innerText = stage.storyTag;
  storyTitle.innerText = stage.storyTitle;
  storyBody.innerText = stage.storyBody;
  storyWhy.innerHTML = `<strong>Why Students Need This:</strong> ${stage.storyWhy}`;
  storyActionBtn.innerText = stage.actionText;

  // 4. Clear all previous spotlight highlights
  document.querySelectorAll(".lens-highlight").forEach(el => el.classList.remove("lens-highlight"));

  // 5. Apply spotlight highlight to current target
  if (stage.lensTarget) {
    const targetElement = document.getElementById(stage.lensTarget);
    if (targetElement) {
      targetElement.classList.add("lens-highlight");
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
}

function jumpToStage(idx) {
  renderStage(idx);
}

// Persona Tabs direct click
dockTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    const persona = tab.dataset.view;
    if (persona === "doctor") jumpToStage(0);
    else if (persona === "officer") jumpToStage(4);
    else if (persona === "student") jumpToStage(6);
  });
});

// Director Controls
prevStageBtn.addEventListener("click", () => {
  if (activeStageIdx > 0) jumpToStage(activeStageIdx - 1);
});

nextStageBtn.addEventListener("click", () => {
  if (activeStageIdx < directorStages.length - 1) {
    jumpToStage(activeStageIdx + 1);
  } else {
    jumpToStage(0);
  }
});

restartTourBtn.addEventListener("click", () => {
  jumpToStage(0);
});

storyActionBtn.addEventListener("click", () => {
  const stage = directorStages[activeStageIdx];
  if (stage && typeof stage.onAction === "function") {
    stage.onAction();
  }
  // Auto advance smoothly after brief moment if not last stage
  setTimeout(() => {
    if (activeStageIdx < directorStages.length - 1) {
      jumpToStage(activeStageIdx + 1);
    }
  }, 1200);
});

// Interactive Elements within Workstations
const simulateSubmitBtn = document.getElementById("simulateSubmitBtn");
if (simulateSubmitBtn) {
  simulateSubmitBtn.addEventListener("click", () => {
    const stage = directorStages[3];
    if (stage && stage.onAction) stage.onAction();
  });
}

const spotlightOffAction = document.getElementById("spotlightOffAction");
if (spotlightOffAction) {
  spotlightOffAction.addEventListener("click", () => {
    const stage = directorStages[5];
    if (stage && stage.onAction) stage.onAction();
  });
}

const simulateTakeDoseBtn = document.getElementById("simulateTakeDoseBtn");
if (simulateTakeDoseBtn) {
  simulateTakeDoseBtn.addEventListener("click", () => {
    const stage = directorStages[7];
    if (stage && stage.onAction) stage.onAction();
  });
}

// Keyboard Navigation for Classrooms / Presenters
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
    if (activeStageIdx < directorStages.length - 1) jumpToStage(activeStageIdx + 1);
    else jumpToStage(0);
  } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
    if (activeStageIdx > 0) jumpToStage(activeStageIdx - 1);
  } else if (e.key === "f" || e.key === "F") {
    fullscreenToggleBtn.click();
  } else if (e.key === "Escape") {
    // Escape will naturally exit fullscreen
  }
});

// Boot up
renderStage(0);
console.log("KIET Smart Care Presentation Engine Ready.");
