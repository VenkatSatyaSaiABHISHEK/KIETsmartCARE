import { NextRequest, NextResponse } from "next/server";
import { adminService } from "@/lib/admin/service";
import { studentCreateSchema, studentUpdateSchema } from "@/lib/admin/validation";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const branch = searchParams.get("branch") || undefined;
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : undefined;

    const students = adminService.getStudents(search, branch, year);
    return NextResponse.json({ students });
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

    const result = adminService.createStudent(parsed.data);

    return NextResponse.json({
      success: true,
      student: result.student,
      temporary_password: result.temporary_password,
      message: "Student enrolled successfully. Share the temporary password once with the student.",
    });
  } catch (error: any) {
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

    const result = adminService.resetStudentPassword(id);

    return NextResponse.json({
      success: true,
      student: result.student,
      temporary_password: result.temporary_password,
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

    const updated = adminService.updateStudent(id, parsed.data);
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
