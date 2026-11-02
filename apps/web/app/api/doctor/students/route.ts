import { NextRequest, NextResponse } from "next/server";
import { PinAuthService } from "@/lib/auth/pin-service";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get("kiet_session")?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Session expired: Please sign in again." },
        { status: 401 }
      );
    }

    const payload = PinAuthService.verifySessionToken(sessionToken);
    if (!payload || (payload.role !== "doctor" && payload.role !== "admin")) {
      return NextResponse.json(
        { error: "Unauthorized access: Doctor or Admin role required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const rollNumber = searchParams.get("rollNumber")?.trim();
    const query = searchParams.get("query")?.trim();

    const supabase = createAdminClient();

    // 1. If searching for a specific roll number or student name
    if (rollNumber) {
      let student: any = null;
      const { data: s1, error: e1 } = await supabase
        .from("students")
        .select(`
          id,
          roll_number,
          name,
          branch,
          year,
          phone,
          allergies,
          photo_path,
          residence_type,
          room_number,
          student_meal_times ( breakfast, lunch, dinner )
        `)
        .ilike("roll_number", rollNumber)
        .eq("status", "active")
        .maybeSingle();

      if (e1 && e1.code === "42703") {
        const { data: sFallback } = await supabase
          .from("students")
          .select(`
            id,
            roll_number,
            name,
            branch,
            year,
            phone,
            allergies,
            student_meal_times ( breakfast, lunch, dinner )
          `)
          .ilike("roll_number", rollNumber)
          .eq("status", "active")
          .maybeSingle();
        student = sFallback;
      } else {
        student = s1;
      }

      if (!student) {
        const { data: studentByName } = await supabase
          .from("students")
          .select(`
            id,
            roll_number,
            name,
            branch,
            year,
            phone,
            allergies,
            photo_path,
            residence_type,
            room_number,
            student_meal_times ( breakfast, lunch, dinner )
          `)
          .ilike("name", `%${rollNumber}%`)
          .eq("status", "active")
          .limit(1)
          .maybeSingle();
        student = studentByName;
      }

      if (!student) {
        return NextResponse.json({ student: null });
      }

      const mt = Array.isArray(student.student_meal_times)
        ? student.student_meal_times[0]
        : student.student_meal_times;

      let allergiesArray: string[] = [];
      if (Array.isArray(student.allergies)) {
        allergiesArray = student.allergies;
      } else if (typeof student.allergies === "string" && student.allergies.trim()) {
        allergiesArray = [student.allergies.trim()];
      }

      return NextResponse.json({
        student: {
          id: student.id,
          roll_number: student.roll_number,
          name: student.name,
          branch: student.branch || "Campus Department",
          year: student.year || 1,
          phone: student.phone || "+91 98765 43210",
          allergies: allergiesArray,
          photo_path: student.photo_path || null,
          residence_type: student.residence_type || "hostler",
          room_number: student.room_number || null,
          meal_times: mt
            ? {
                breakfast: mt.breakfast || "08:30:00",
                lunch: mt.lunch || "13:00:00",
                dinner: mt.dinner || "20:00:00",
              }
            : {
                breakfast: "08:30:00",
                lunch: "13:00:00",
                dinner: "20:00:00",
              },
        },
      });
    }

    // 2. If general search query (autocomplete)
    if (query) {
      const { data: students, error } = await supabase
        .from("students")
        .select("id, roll_number, name, branch, year")
        .eq("status", "active")
        .or(`name.ilike.%${query}%,roll_number.ilike.%${query}%`)
        .limit(8);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ students: students || [] });
    }

    return NextResponse.json({ students: [] });
  } catch (err: any) {
    console.error("GET /api/doctor/students error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch student" },
      { status: 500 }
    );
  }
}
