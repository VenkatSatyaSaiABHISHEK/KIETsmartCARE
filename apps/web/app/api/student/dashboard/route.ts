import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const rollNumber = searchParams.get("rollNumber");

    if (!studentId && !rollNumber) {
      return NextResponse.json(
        { error: "Student ID or Roll Number is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const supabase = createAdminClient();

    // 1. Fetch Student Record
    let studentQuery = supabase
      .from("students")
      .select(`
        id,
        roll_number,
        name,
        branch,
        year,
        phone,
        allergies,
        emergency_contact,
        photo_path,
        student_meal_times ( breakfast, lunch, dinner )
      `);

    if (studentId) {
      studentQuery = studentQuery.eq("id", studentId);
    } else if (rollNumber) {
      studentQuery = studentQuery.ilike("roll_number", rollNumber.trim());
    }

    const { data: student, error: studentErr } = await studentQuery.maybeSingle();

    if (studentErr || !student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    const resolvedStudentId = student.id;

    // 2. Fetch All Visits & Prescriptions
    const { data: allVisits } = await supabase
      .from("visits")
      .select(`
        id,
        problem_category,
        problems,
        other_problem,
        visit_date,
        follow_up_date,
        status,
        doctor_id,
        profiles:doctor_id ( full_name ),
        visit_medications (
          id,
          dose,
          times_per_day,
          meal_relation,
          days,
          quantity_handed_over,
          label,
          medicines ( id, name, default_form )
        )
      `)
      .eq("student_id", resolvedStudentId)
      .order("visit_date", { ascending: false });

    const visitsList = allVisits || [];
    const activeVisit = visitsList.find((v) => v.status === "active") || null;

    const formattedPrescriptions = visitsList.map((v: any) => {
      const startDate = new Date(v.visit_date);
      const doctorName = (v.profiles as any)?.full_name || "Campus Doctor";
      const maxDays = Math.max(...(v.visit_medications || []).map((vm: any) => vm.days || 3), 1);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + maxDays);

      const medications = (v.visit_medications || []).map((vm: any) => ({
        id: vm.id,
        name: vm.label || vm.medicines?.name || "Prescribed Tablet",
        dose: vm.dose || "1 tablet",
        meal_relation: vm.meal_relation || "after",
        meal_slot: vm.times_per_day === 2 ? "morning, night" : vm.times_per_day === 3 ? "morning, lunch, night" : "afternoon",
        duration_days: vm.days || 1,
      }));

      return {
        id: v.id,
        doctor_name: doctorName,
        problem_category: v.problem_category || "General Consultation",
        start_date: startDate.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
        end_date: v.follow_up_date
          ? new Date(v.follow_up_date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
          : endDate.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
        is_active: v.status === "active",
        medicines: medications,
      };
    });

    const activePrescription = formattedPrescriptions.find((p) => p.is_active) || null;

    const formattedHistory = visitsList.map((v: any) => {
      const doctorName = (v.profiles as any)?.full_name || "Campus Doctor";
      const medsStr = (v.visit_medications || [])
        .map((vm: any) => `${vm.label || vm.medicines?.name || "Tablet"} (${vm.dose || "1 dose"})`)
        .join(", ");

      const outcome =
        v.status === "recovered"
          ? "Recovered"
          : v.status === "active"
          ? "Active Course"
          : "Under Review";

      return {
        id: v.id,
        date: new Date(v.visit_date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
        doctor: doctorName,
        problem: v.problem_category || "Clinical Consultation",
        medicines: medsStr || "General Consultation",
        outcome,
      };
    });

    // 3. Fetch Today's Scheduled Doses
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const selectCols = `
      id,
      visit_medication_id,
      scheduled_at,
      slot,
      meal_relation,
      tablets,
      group_key,
      visit_medications (
        dose,
        label,
        medicines ( name )
      ),
      dose_events (
        response,
        responded_at
      )
    `;

    const { data: doses, error: doseErr } = await supabase
      .from("dose_schedule")
      .select(selectCols)
      .eq("student_id", resolvedStudentId)
      .gte("scheduled_at", startOfDay.toISOString())
      .lte("scheduled_at", endOfDay.toISOString())
      .order("scheduled_at", { ascending: true });

    if (doseErr) {
      console.warn("[STUDENT DASHBOARD] dose_schedule query error:", doseErr);
    }

    const formattedDoses = (doses || []).map((d: any) => {
      const scheduledDate = new Date(d.scheduled_at);
      const timeStr = scheduledDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      const medName = d.visit_medications?.label || d.visit_medications?.medicines?.name || "Medication";
      const doseStr = d.visit_medications?.dose || (d.tablets ? `${d.tablets} tablet` : "1 tablet");

      const latestEvent = d.dose_events && d.dose_events.length > 0 ? d.dose_events[0] : null;
      const status = latestEvent?.response || "scheduled";

      return {
        id: d.id,
        medicine_name: medName,
        dose: doseStr,
        tablets: d.tablets || 1,
        scheduled_time: timeStr,
        time: timeStr,
        scheduled_at: d.scheduled_at,
        meal_slot: d.slot || "morning",
        slot: d.slot || "morning",
        meal_relation: d.meal_relation || "after",
        status,
        taken_at: latestEvent?.responded_at || null,
      };
    });

    // 4. Fetch Active Recovery Inquiry
    const { data: recovery } = await supabase
      .from("recovery_checks")
      .select("id, visit_id, answer, answered_at, created_at")
      .eq("student_id", resolvedStudentId)
      .is("answer", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const mealTimesData = (student as any).student_meal_times;
    const mealTimes = {
      breakfast: mealTimesData?.breakfast ? mealTimesData.breakfast.slice(0, 5) : "08:00",
      lunch: mealTimesData?.lunch ? mealTimesData.lunch.slice(0, 5) : "13:00",
      dinner: mealTimesData?.dinner ? mealTimesData.dinner.slice(0, 5) : "20:00",
    };

    return NextResponse.json(
      {
        success: true,
        student: {
          id: student.id,
          roll_number: student.roll_number,
          full_name: student.name,
          department: student.branch || "General",
          year: student.year || 1,
          phone: student.phone,
          allergies: student.allergies || [],
          emergency_contact: student.emergency_contact,
          meal_times: mealTimes,
        },
        prescription: activePrescription,
        prescriptions: formattedPrescriptions,
        history: formattedHistory,
        doses: formattedDoses,
        recovery_inquiry: recovery
          ? {
              id: recovery.id,
              visit_id: recovery.visit_id,
              status: "pending",
              created_at: recovery.created_at,
            }
          : null,
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error("[STUDENT DASHBOARD ERROR]", err);
    return NextResponse.json(
      { error: err?.message || "Failed to load dashboard data" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
