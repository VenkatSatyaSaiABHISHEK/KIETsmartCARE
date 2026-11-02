import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { studentCreateSchema, studentUpdateSchema } from "@/lib/admin/validation";
import { generateTemporaryPassword } from "@/lib/admin/service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase();
    const branch = searchParams.get("branch")?.trim().toUpperCase();
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : undefined;

    const supabase = createAdminClient();
    let query = supabase
      .from("students")
      .select("id, roll_number, name, branch, year, phone, emergency_contact, allergies, status, created_at, residence_type, room_number")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (branch && branch !== "ALL") {
      query = query.ilike("branch", branch);
    }
    if (year && !isNaN(year)) {
      query = query.eq("year", year);
    }

    const { data: students, error } = await query;
    if (error) {
      console.error("Failed to query students from Supabase:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let filtered = students || [];
    if (search) {
      filtered = filtered.filter(
        (s) =>
          s.roll_number?.toLowerCase().includes(search) ||
          s.name?.toLowerCase().includes(search) ||
          s.phone?.includes(search)
      );
    }

    return NextResponse.json({ students: filtered });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch students" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = studentCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const cleanRoll = data.roll_number.trim().toUpperCase();
    const cleanEmail = `${cleanRoll.toLowerCase()}@students.kiet.local`;
    const temporary_password = generateTemporaryPassword("Stu");
    const supabase = createAdminClient();

    // Check if student with this roll number already exists
    const { data: existingStudent } = await supabase
      .from("students")
      .select("id, roll_number")
      .ilike("roll_number", cleanRoll)
      .maybeSingle();

    if (existingStudent) {
      return NextResponse.json(
        { error: `Student with roll number ${cleanRoll} is already registered.` },
        { status: 400 }
      );
    }

    // 1. Provision user in Supabase auth.users
    let authUserId: string;
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password: temporary_password,
      email_confirm: true,
      user_metadata: {
        role: "student",
        full_name: data.name,
        roll_number: cleanRoll,
      },
    });

    if (authErr) {
      // If user already exists in auth, find them
      const { data: userList } = await supabase.auth.admin.listUsers();
      const match = userList?.users?.find((u) => u.email === cleanEmail);
      if (match) {
        authUserId = match.id;
        await supabase.auth.admin.updateUserById(authUserId, {
          password: temporary_password,
        });
      } else {
        throw new Error(`Failed to create student authentication user: ${authErr.message}`);
      }
    } else {
      authUserId = authUser.user.id;
    }

    // 2. Ensure profile exists in profiles table
    await supabase.from("profiles").upsert(
      {
        id: authUserId,
        role: "student",
        full_name: data.name,
        phone: data.phone,
        status: "active",
      },
      { onConflict: "id" }
    );

    // 3. Insert real student record in students table
    const { data: insertedStudent, error: insertErr } = await supabase
      .from("students")
      .insert({
        profile_id: authUserId,
        roll_number: cleanRoll,
        name: data.name,
        branch: data.branch,
        year: data.year,
        phone: data.phone,
        emergency_contact: data.emergency_contact,
        allergies: data.allergies || [],
        status: "active",
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Failed to insert student into DB:", insertErr);
      throw new Error(`Database error: ${insertErr.message}`);
    }

    // 4. Create default meal times record
    await supabase.from("student_meal_times").upsert(
      {
        student_id: insertedStudent.id,
        breakfast: "08:00:00",
        lunch: "13:00:00",
        dinner: "20:00:00",
      },
      { onConflict: "student_id" }
    );

    return NextResponse.json({
      success: true,
      student: insertedStudent,
      temporary_password,
      message: "Student enrolled successfully in database. Share the temporary password once with the student.",
    });
  } catch (error: any) {
    console.error("Student enrollment error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to enroll student" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: student, error: fetchErr } = await supabase
      .from("students")
      .select("id, profile_id, roll_number, name")
      .eq("id", id)
      .single();

    if (fetchErr || !student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const temporary_password = generateTemporaryPassword("Stu");
    if (student.profile_id) {
      await supabase.auth.admin.updateUserById(student.profile_id, {
        password: temporary_password,
      });
    }

    return NextResponse.json({
      success: true,
      student,
      temporary_password,
      message: "Student password reset successfully.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to reset student password" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    const parsed = studentUpdateSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data: updated, error } = await supabase
      .from("students")
      .update(parsed.data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      student: updated,
      message: "Student record updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update student" },
      { status: 500 }
    );
  }
}
