import { NextRequest, NextResponse } from "next/server";
import { PinAuthService } from "@/lib/auth/pin-service";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function sanitizeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  let str = String(val).replace(/"/g, '""');
  // Formula injection prevention: prefix =, +, -, @ with single quote
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
    if (!payload || payload.role !== "doctor") {
      return NextResponse.json(
        { error: "Unauthorized access: Doctor role required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "all"; // "month" | "range" | "all"
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
    let query = supabase
      .from("visits")
      .select(`
        id,
        visit_date,
        problem_category,
        notes,
        status,
        follow_up_date,
        students ( roll_number, name, branch, year ),
        visit_medications ( dose, days, medicines ( name ) )
      `)
      .eq("doctor_id", payload.id)
      .gte("visit_date", `${startDate}T00:00:00.000Z`)
      .lte("visit_date", `${endDate}T23:59:59.999Z`)
      .order("visit_date", { ascending: false });

    const { data: visits, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "The download could not be created. Please try again." },
        { status: 500 }
      );
    }

    if (!visits || visits.length === 0) {
      return NextResponse.json(
        { error: "No records in this period." },
        { status: 404 }
      );
    }

    // CSV Header
    const headers = [
      "Date",
      "Time",
      "Roll Number",
      "Student Name",
      "Branch",
      "Year",
      "Problem",
      "Medicines",
      "Total Doses",
      "Status",
      "Follow-up Date",
    ];

    const rows: string[] = [headers.join(",")];

    for (const v of visits) {
      const s = (v as any).students;
      const vDate = new Date(v.visit_date);
      const dateStr = v.visit_date.slice(0, 10);
      const timeStr = vDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const medsList = (v.visit_medications || [])
        .map((vm: any) => `${vm.medicines?.name || "Medication"} (${vm.dose || "1 tab"})`)
        .join(", ") || "None prescribed";

      const totalDoses = (v.visit_medications || []).reduce(
        (sum: number, vm: any) => sum + (parseInt(vm.days, 10) || 3) * 2,
        0
      );

      const statusStr =
        v.status === "recovered"
          ? "Recovered"
          : v.status === "not_recovered"
          ? "Not recovered"
          : "Active treatment";

      const followUp = v.follow_up_date ? v.follow_up_date.slice(0, 10) : "—";

      const row = [
        sanitizeCsvCell(dateStr),
        sanitizeCsvCell(timeStr),
        sanitizeCsvCell(s?.roll_number || "—"),
        sanitizeCsvCell(s?.name || "Student"),
        sanitizeCsvCell(s?.branch || "General"),
        sanitizeCsvCell(s?.year || 1),
        sanitizeCsvCell(v.problem_category || "General"),
        sanitizeCsvCell(medsList),
        sanitizeCsvCell(totalDoses || 1),
        sanitizeCsvCell(statusStr),
        sanitizeCsvCell(followUp),
      ];

      rows.push(row.join(","));
    }

    // Write to audit log
    try {
      await supabase.from("audit_logs").insert({
        action: "DOCTOR_EXPORT_CSV",
        target_type: "visits",
        target_id: payload.id,
        actor_email: payload.name,
        details: {
          doctor_id: payload.id,
          range: `${startDate} to ${endDate}`,
          rows_exported: visits.length,
          exported_at: new Date().toISOString(),
        },
      });
    } catch {
      // Non-fatal
    }

    // UTF-8 BOM so Excel opens it with correct encoding
    const csvContent = "\uFEFF" + rows.join("\r\n");
    const filename = `kiet-smart-care-records_${startDate}_to_${endDate}.csv`;

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

