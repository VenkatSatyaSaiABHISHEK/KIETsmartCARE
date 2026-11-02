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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { roll_number, password } = body;

    const cleanRoll = typeof roll_number === "string" ? roll_number.trim().toUpperCase() : "";
    if (!cleanRoll) {
      return NextResponse.json(
        { success: false, error: "Please enter your student Roll Number." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const supabase = createAdminClient();

    // Query student by roll number (normalized uppercase)
    const { data: student, error: studentErr } = await supabase
      .from("students")
      .select(`
        id,
        roll_number,
        name,
        branch,
        year,
        phone,
        room_number,
        residence_type,
        allergies,
        emergency_contact,
        photo_path,
        status,
        profile_id,
        student_meal_times ( breakfast, lunch, dinner )
      `)
      .ilike("roll_number", cleanRoll)
      .maybeSingle();

    if (studentErr) {
      console.error("[STUDENT LOGIN ERROR]", studentErr);
      return NextResponse.json(
        { success: false, error: "Database error querying student directory." },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          error: `Roll number "${cleanRoll}" was not found in the student directory. Please check your roll number.`,
        },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    if (student.status === "inactive" || student.status === "suspended") {
      return NextResponse.json(
        { success: false, error: "Your student health account is inactive. Please contact the campus clinic." },
        { status: 403, headers: CORS_HEADERS }
      );
    }

    // Determine initial login (if password is the Roll Number itself or initial seed)
    const enteredPass = typeof password === "string" ? password.trim() : "";
    const isFirstLogin =
      enteredPass.toUpperCase() === cleanRoll ||
      enteredPass === "kiet123" ||
      enteredPass === "welcome";

    const mealTimesData = (student as any).student_meal_times;
    const mealTimes = {
      breakfast: mealTimesData?.breakfast ? mealTimesData.breakfast.slice(0, 5) : "08:00",
      lunch: mealTimesData?.lunch ? mealTimesData.lunch.slice(0, 5) : "13:00",
      dinner: mealTimesData?.dinner ? mealTimesData.dinner.slice(0, 5) : "20:00",
    };

    const session = {
      user_id: student.id,
      roll_number: student.roll_number,
      full_name: student.name,
      email: `${cleanRoll.toLowerCase()}@kiet.edu`,
      is_first_login: isFirstLogin,
      has_consented: true,
      has_completed_setup: true,
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
        session,
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error("[STUDENT LOGIN EXCEPTION]", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

