import { NextRequest, NextResponse } from "next/server";
import { PinAuthService } from "@/lib/auth/pin-service";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("problem_aliases")
      .select("alias, canonical, created_at")
      .order("canonical", { ascending: true });

    if (error) {
      // Fallback default list if table not yet created
      return NextResponse.json({
        aliases: [
          { alias: "head ache", canonical: "Headache" },
          { alias: "headache", canonical: "Headache" },
          { alias: "migraine", canonical: "Headache" },
          { alias: "fever", canonical: "Acute Viral Illness" },
          { alias: "viral fever", canonical: "Acute Viral Illness" },
          { alias: "cold and cough", canonical: "Cold & Cough Congestion" },
          { alias: "bronchial congestion", canonical: "Cold & Cough Congestion" },
          { alias: "acidity", canonical: "Acute Acidity & Gastritis" },
          { alias: "acute gastritis", canonical: "Acute Acidity & Gastritis" },
          { alias: "food poisoning", canonical: "Acute Gastroenteritis" },
          { alias: "sprain", canonical: "Physical Injury / Sprain" },
        ],
      });
    }

    return NextResponse.json({ aliases: data || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch aliases" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get("kiet_session")?.value;
    const payload = sessionToken ? PinAuthService.verifySessionToken(sessionToken) : null;
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Administrator authorization required." }, { status: 403 });
    }

    const body = await req.json();
    const { alias, canonical } = body;

    if (!alias || !canonical) {
      return NextResponse.json(
        { error: "Both alias and canonical name are required." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const cleanAlias = alias.trim().toLowerCase();
    const cleanCanonical = canonical.trim();

    const { error } = await supabase.from("problem_aliases").upsert({
      alias: cleanAlias,
      canonical: cleanCanonical,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to save problem alias" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get("kiet_session")?.value;
    const payload = sessionToken ? PinAuthService.verifySessionToken(sessionToken) : null;
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Administrator authorization required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const alias = searchParams.get("alias");

    if (!alias) {
      return NextResponse.json({ error: "Alias is required." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("problem_aliases")
      .delete()
      .eq("alias", alias.trim().toLowerCase());

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to delete problem alias" },
      { status: 500 }
    );
  }
}

