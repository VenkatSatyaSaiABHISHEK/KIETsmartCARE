import { NextRequest, NextResponse } from "next/server";
import { adminService } from "@/lib/admin/service";
import { staffCreateSchema, staffUpdateSchema } from "@/lib/admin/validation";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const role = searchParams.get("role") || undefined;

    const staff = adminService.getStaffList(search, role);
    return NextResponse.json({ staff });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = staffCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // In production, this executes via `supabaseAdmin.auth.admin.createUser()` with the SERVICE_ROLE_KEY
    // The service role key NEVER touches the client browser.
    const result = adminService.createStaff(parsed.data);

    return NextResponse.json({
      success: true,
      staff: result.staff,
      temporary_password: result.temporary_password,
      message: "Staff member created successfully. Note the temporary password now; it will not be displayed again.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to create staff member" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, role } = body;

    if (!id) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 });
    }

    const parsed = staffUpdateSchema.safeParse({ status, role });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    let updatedStaff;
    if (status) {
      updatedStaff = adminService.updateStaffStatus(id, status);
    }
    if (role) {
      updatedStaff = adminService.changeStaffRole(id, role);
    }

    return NextResponse.json({
      success: true,
      staff: updatedStaff,
      message: "Staff member updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update staff member" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 });
    }

    const result = adminService.resetStaffPassword(id);

    return NextResponse.json({
      success: true,
      staff: result.staff,
      temporary_password: result.temporary_password,
      message: "Password reset. Transmit temporary password securely to staff member.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to reset password" },
      { status: 500 }
    );
  }
}
