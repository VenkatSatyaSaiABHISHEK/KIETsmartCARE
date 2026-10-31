import { NextRequest, NextResponse } from "next/server";
import { adminService } from "@/lib/admin/service";
import { adminSettingsSchema } from "@/lib/admin/validation";

export async function GET() {
  try {
    const settings = adminService.getSettings();
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = adminSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const updated = adminService.updateSettings(parsed.data);

    return NextResponse.json({
      success: true,
      settings: updated,
      message: "System configuration and medicine presets successfully saved.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
