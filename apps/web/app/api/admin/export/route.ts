import { NextRequest, NextResponse } from "next/server";
import { PinAuthService } from "@/lib/auth/pin-service";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function sanitizeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  let str = String(val).replace(/"/g, '""');
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str}"`;
}

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
    if (!payload || payload.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized access: Administrator role required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "all";
    let startDate = searchParams.get("startDate");
    let endDate = searchParams.get("endDate");

    const now = new Date();
    if (range === "month") {
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      startDate = `${y}-${m}-01`;
      const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
      endDate = `${y}-${m}-${String(lastDay).padStart(2, "0")}`;
    } else if (range === "all" || !startDate || !endDate) {
      startDate = "2020-01-01";
      endDate = now.toISOString().slice(0, 10);
    }

    const supabase = createAdminClient();
    let records: any[] = [];

    // Attempt SECURITY DEFINER function first
    const { data: rpcData, error: rpcErr } = await supabase.rpc(
      "get_admin_attendance_records",
      {
        p_start_date: startDate,
        p_end_date: endDate,
      }
    );

    if (!rpcErr && rpcData && Array.isArray(rpcData)) {
      records = rpcData;
    } else {
      // Fallback direct query strictly selecting attendance fields only (NO clinical tables)
      const { data: fallbackData } = await supabase
        .from("visits")
        .select(`
          id,
          visit_date,
          students ( roll_number, name, branch, year ),
          profiles:doctor_id ( full_name )
        `)
        .gte("visit_date", `${startDate}T00:00:00.000Z`)
        .lte("visit_date", `${endDate}T23:59:59.999Z`)
        .order("visit_date", { ascending: false });

      if (fallbackData) {
        records = fallbackData.map((v: any) => ({
          visit_id: v.id,
          visit_date: v.visit_date.slice(0, 10),
          visit_time: new Date(v.visit_date).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          roll_number: v.students?.roll_number,
          student_name: v.students?.name,
          branch: v.students?.branch,
          year: v.students?.year,
          doctor_name: v.profiles?.full_name || "Campus Clinic Doctor",
        }));
      }
    }

    if (!records || records.length === 0) {
      return NextResponse.json(
        { error: "No records in this period." },
        { status: 404 }
      );
    }

    // STRICT ATTENDANCE HEADERS — ZERO CLINICAL COLUMNS
    const headers = [
      "Date",
      "Time",
      "Roll Number",
      "Student Name",
      "Branch",
      "Year",
      "Doctor Name",
    ];

    const rows: string[] = [headers.join(",")];

    for (const r of records) {
      const row = [
        sanitizeCsvCell(r.visit_date),
        sanitizeCsvCell(r.visit_time),
        sanitizeCsvCell(r.roll_number || "—"),
        sanitizeCsvCell(r.student_name || "Student"),
        sanitizeCsvCell(r.branch || "General"),
        sanitizeCsvCell(r.year || 1),
        sanitizeCsvCell(r.doctor_name || "Campus Doctor"),
      ];
      rows.push(row.join(","));
    }

    // Audit log
    try {
      await supabase.from("audit_logs").insert({
        action: "ADMIN_ATTENDANCE_EXPORT_CSV",
        target_type: "attendance_records",
        target_id: payload.id,
        actor_email: payload.name,
        details: {
          admin_id: payload.id,
          range: `${startDate} to ${endDate}`,
          rows_exported: records.length,
          exported_at: new Date().toISOString(),
        },
      });
    } catch {
      // Non-fatal
    }

    const csvContent = "\uFEFF" + rows.join("\r\n");
    const filename = `kiet-smart-care-attendance_${startDate}_to_${endDate}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "The download could not be created. Please try again." },
      { status: 500 }
    );
  }
}

