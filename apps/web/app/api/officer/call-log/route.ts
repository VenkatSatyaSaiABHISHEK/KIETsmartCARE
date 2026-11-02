import { NextRequest, NextResponse } from "next/server";
import { PinAuthService } from "@/lib/auth/pin-service";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { alertId, outcome, notes, resolveAlert } = body;

    if (!alertId || !outcome) {
      return NextResponse.json(
        { error: "Alert ID and call outcome are required." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Map outcome to valid enum
    let dbOutcome = "reached";
    if (outcome.includes("Not reached")) dbOutcome = "unreachable";
    else if (outcome.includes("advised")) dbOutcome = "call_back_requested";
    else if (outcome.includes("Emergency")) dbOutcome = "emergency_escalated";

    // 1. Insert into call_logs
    const { data: callLog, error: callErr } = await supabase
      .from("call_logs")
      .insert({
        alert_id: alertId,
        officer_id: payload.id,
        outcome: dbOutcome,
        notes: notes ? notes.trim() : `Call outcome: ${outcome}`,
        called_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (callErr) {
      // If table doesn't support the raw string, continue safely
      console.warn("Call log insert error:", callErr.message);
    }

    // 2. Insert into audit_logs
    try {
      await supabase.from("audit_logs").insert({
        user_id: payload.id,
        action: "OFFICER_CALL_LOGGED",
        table_name: "call_logs",
        record_id: callLog?.id || null,
        metadata: {
          alert_id: alertId,
          officer_name: payload.name,
          outcome,
          notes,
          timestamp: new Date().toISOString(),
        },
      });
    } catch {
      // Ignore
    }

    // 3. Resolve alert if requested or outcome is successful
    if (resolveAlert || outcome.includes("Reached and fine")) {
      await supabase
        .from("alerts")
        .update({
          status: "resolved",
          resolved_by: payload.id,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", alertId);
    } else {
      // Mark as in_progress
      await supabase
        .from("alerts")
        .update({
          status: "in_progress",
        })
        .eq("id", alertId);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to log call outcome" },
      { status: 500 }
    );
  }
}

