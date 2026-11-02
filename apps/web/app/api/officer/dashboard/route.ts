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
    if (!payload || payload.role !== "officer") {
      return NextResponse.json(
        { error: "Access denied: Health Officer role required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "today"; // 'today' | '7d' | '30d'
    const anchorDateParam = searchParams.get("anchorDate"); // YYYY-MM-DD

    const supabase = createAdminClient();

    // 1. Attempt PostgreSQL SECURITY DEFINER RPC officer_dashboard
    const { data: rpcData, error: rpcErr } = await supabase.rpc("officer_dashboard", {
      anchor_date: anchorDateParam || undefined,
      period,
    });

    if (!rpcErr && rpcData) {
      return NextResponse.json(rpcData, {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }

    // 2. Fallback execution directly on live database rows (100% real data)
    // Timezone: Asia/Kolkata
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const nowIst = new Date(now.getTime() + istOffset);
    const todayIstStr = nowIst.toISOString().slice(0, 10);
    const anchorDate = anchorDateParam || todayIstStr;

    // Period boundaries in IST
    const anchorStart = new Date(`${anchorDate}T00:00:00.000+05:30`);
    const anchorEnd = new Date(`${anchorDate}T23:59:59.999+05:30`);

    let periodStart = anchorStart;
    if (period === "7d") {
      const d = new Date(anchorStart);
      d.setDate(d.getDate() - 6);
      periodStart = d;
    } else if (period === "30d") {
      const d = new Date(anchorStart);
      d.setDate(d.getDate() - 29);
      periodStart = d;
    }
    const periodEnd = anchorEnd;

    // Execute queries in parallel
    const [
      openRedAlertsRes,
      noResponseAlertsRes,
      allOpenAlertsRes,
      activeVisitsRes,
      periodVisitsRes,
      sevenDayVisitsRes,
      dosesRes,
      needsCallRes,
    ] = await Promise.all([
      // Open red alerts right now
      supabase
        .from("alerts")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "in_progress"])
        .eq("severity", "red"),

      // No response alerts right now
      supabase
        .from("alerts")
        .select("student_id", { count: "exact", head: true })
        .in("status", ["open", "in_progress"])
        .eq("type", "no_response"),

      // Total open alerts for masthead
      supabase
        .from("alerts")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "in_progress"]),

      // Active visits right now
      supabase
        .from("visits")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),

      // Visits in this period
      supabase
        .from("visits")
        .select("id, student_id, problem_category, status, visit_date")
        .gte("visit_date", periodStart.toISOString())
        .lte("visit_date", periodEnd.toISOString()),

      // Visits in the last 7 days ending at anchorDate
      supabase
        .from("visits")
        .select("student_id, visit_date")
        .gte("visit_date", new Date(anchorStart.getTime() - 6 * 86400000).toISOString())
        .lte("visit_date", anchorEnd.toISOString()),

      // Doses scheduled up to now within period
      supabase
        .from("dose_schedule")
        .select(`
          id,
          scheduled_at,
          dose_events ( response )
        `)
        .gte("scheduled_at", periodStart.toISOString())
        .lte("scheduled_at", now.toISOString()),

      // Needs a call now: open alerts sorted longest waiting first
      supabase
        .from("alerts")
        .select(`
          id,
          type,
          severity,
          created_at,
          students ( id, name, roll_number, branch, phone )
        `)
        .in("status", ["open", "in_progress"])
        .order("created_at", { ascending: true }),
    ]);

    const openAlertsCount = openRedAlertsRes.count || 0;
    const noResponseCount = noResponseAlertsRes.count || 0;
    const totalOpenAlerts = allOpenAlertsRes.count || 0;
    const activeTreatmentsCount = activeVisitsRes.count || 0;

    // This period metrics
    const periodVisits = periodVisitsRes.data || [];
    const distinctStudentsThisPeriod = new Set(periodVisits.map((v) => v.student_id)).size;
    const recoveredThisPeriod = periodVisits.filter((v) => v.status === "recovered").length;
    const notRecoveredThisPeriod = periodVisits.filter((v) => v.status === "not_recovered").length;

    // Doses confirmed
    const doses = dosesRes.data || [];
    const dosesDue = doses.length;
    const dosesConfirmed = doses.filter((d: any) => {
      const resp = d.dose_events?.[0]?.response;
      return resp === "taken" || resp === "taken_late";
    }).length;

    // Last 7 days strip
    const last7Days: any[] = [];
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = 6; i >= 0; i--) {
      const target = new Date(anchorStart);
      target.setDate(target.getDate() - i);
      const targetDateStr = target.toISOString().slice(0, 10);
      const dayStart = new Date(`${targetDateStr}T00:00:00.000+05:30`);
      const dayEnd = new Date(`${targetDateStr}T23:59:59.999+05:30`);

      const dayVisits = (sevenDayVisitsRes.data || []).filter((v) => {
        const vd = new Date(v.visit_date);
        return vd >= dayStart && vd <= dayEnd;
      });

      const uniqueStudentsDay = new Set(dayVisits.map((v) => v.student_id)).size;

      last7Days.push({
        date: targetDateStr,
        weekday: weekdays[target.getDay()],
        day_number: `${target.getDate()} ${monthNames[target.getMonth()]}`,
        students_seen: uniqueStudentsDay,
        is_anchor: targetDateStr === anchorDate,
      });
    }

    // Common Problems (Top 5 categories with auto-widening)
    let problemVisits = periodVisits;
    let widened = false;
    let commonStart = periodStart.toISOString().slice(0, 10);
    let commonEnd = anchorDate;

    if (problemVisits.length === 0) {
      // Widen to 30 days
      const thirtyDaysAgo = new Date(anchorStart.getTime() - 29 * 86400000);
      const { data: thirtyDayData } = await supabase
        .from("visits")
        .select("problem_category, visit_date")
        .gte("visit_date", thirtyDaysAgo.toISOString())
        .lte("visit_date", anchorEnd.toISOString());

      if (thirtyDayData && thirtyDayData.length > 0) {
        problemVisits = thirtyDayData as any;
        widened = true;
        commonStart = thirtyDaysAgo.toISOString().slice(0, 10);
      } else {
        // Widen to all-time
        const { data: allTimeData } = await supabase
          .from("visits")
          .select("problem_category, visit_date")
          .order("visit_date", { ascending: false })
          .limit(100);

        if (allTimeData && allTimeData.length > 0) {
          problemVisits = allTimeData as any;
          widened = true;
          commonStart = allTimeData[allTimeData.length - 1].visit_date.slice(0, 10);
          commonEnd = allTimeData[0].visit_date.slice(0, 10);
        }
      }
    }

    // Normalization mapping with dynamic aliases from problem_aliases table
    const { data: dbAliases } = await supabase
      .from("problem_aliases")
      .select("alias, canonical");

    const aliasMap = new Map<string, string>();
    if (dbAliases) {
      for (const a of dbAliases) {
        aliasMap.set(a.alias.toLowerCase().trim(), a.canonical);
      }
    }

    const problemCounts: Record<string, number> = {};
    for (const v of problemVisits) {
      const raw = (v.problem_category || "").trim();
      if (!raw) continue;
      const lower = raw.toLowerCase();
      let normalized: string = aliasMap.get(lower) || "";

      if (!normalized) {
        for (const [al, can] of aliasMap.entries()) {
          if (lower.includes(al)) {
            normalized = can;
            break;
          }
        }
      }

      if (!normalized) {
        if (lower.includes("fever") || lower.includes("viral")) normalized = "Acute Viral Illness";
        else if (lower.includes("cough") || lower.includes("cold") || lower.includes("bronchial")) normalized = "Cold & Cough Congestion";
        else if (lower.includes("stomach") || lower.includes("gastric") || lower.includes("acidity")) normalized = "Acute Acidity & Gastritis";
        else if (lower.includes("headache") || lower.includes("migraine")) normalized = "Headache";
        else if (lower.includes("injury") || lower.includes("sprain")) normalized = "Physical Injury / Sprain";
        else if (lower.includes("diarrhea") || lower.includes("vomit")) normalized = "Acute Gastroenteritis";
        else {
          normalized = raw.charAt(0).toUpperCase() + raw.slice(1);
        }
      }

      problemCounts[normalized] = (problemCounts[normalized] || 0) + 1;
    }

    const commonProblemsItems = Object.entries(problemCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Needs Call Now
    const needsCall = (needsCallRes.data || []).map((a: any) => ({
      id: a.id,
      student_id: a.students?.id,
      student_name: a.students?.name || "Student",
      roll_number: a.students?.roll_number || "N/A",
      branch: a.students?.branch || "N/A",
      phone: a.students?.phone || "+91 98765 43210",
      reason: a.type,
      severity: a.severity,
      created_at: a.created_at,
    }));

    const responsePayload = {
      anchor_date: anchorDate,
      period,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      needs_action: {
        open_alerts: openAlertsCount,
        no_response: noResponseCount,
      },
      under_treatment: {
        active: activeTreatmentsCount,
        doses_confirmed: dosesConfirmed,
        doses_due: dosesDue,
      },
      this_period: {
        students_seen: distinctStudentsThisPeriod,
        recovered: recoveredThisPeriod,
        not_recovered: notRecoveredThisPeriod,
      },
      last_7_days: last7Days,
      common_problems: {
        start_date: commonStart,
        end_date: commonEnd,
        widened,
        items: commonProblemsItems,
      },
      needs_call: needsCall,
      open_alert_count: totalOpenAlerts,
    };

    return NextResponse.json(responsePayload, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load officer dashboard" },
      { status: 500 }
    );
  }
}
