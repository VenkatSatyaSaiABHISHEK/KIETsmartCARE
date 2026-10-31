import { NextRequest, NextResponse } from "next/server";
import { adminService } from "@/lib/admin/service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || undefined;
    const search = searchParams.get("search") || undefined;

    const audit_logs = adminService.getAuditLogs(action, search);

    return NextResponse.json({
      audit_logs,
      total_count: audit_logs.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
