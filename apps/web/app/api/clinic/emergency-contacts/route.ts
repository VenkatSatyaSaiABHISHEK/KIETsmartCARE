import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Query active doctor and officer profiles
    const { data: staff } = await supabase
      .from("profiles")
      .select("role, full_name, phone")
      .in("role", ["doctor", "officer"])
      .eq("status", "active")
      .order("created_at", { ascending: false });

    const doctor = staff?.find((s) => s.role === "doctor");
    const officer = staff?.find((s) => s.role === "officer");

    return NextResponse.json({
      success: true,
      contacts: {
        clinic: {
          label: "College Campus Clinic",
          phone: "+91-120-2983555",
          subtitle: "KIET Central Health Centre",
        },
        officer: {
          label: officer?.full_name ? `Campus Health Officer (${officer.full_name})` : "Campus Health Officer",
          phone: officer?.phone || "+91-9876543210",
          subtitle: "Adherence & Student Welfare Surveillance",
        },
        doctor: {
          label: doctor?.full_name ? `Campus OPD Doctor (${doctor.full_name})` : "Campus OPD Doctor",
          phone: doctor?.phone || "+91-9876543211",
          subtitle: "Emergency Medical Consultations",
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      contacts: {
        clinic: {
          label: "College Campus Clinic",
          phone: "+91-120-2983555",
          subtitle: "KIET Central Health Centre",
        },
        officer: {
          label: "Campus Health Officer",
          phone: "+91-9876543210",
          subtitle: "Adherence & Student Welfare Surveillance",
        },
        doctor: {
          label: "Campus OPD Doctor",
          phone: "+91-9876543211",
          subtitle: "Emergency Medical Consultations",
        },
      },
    });
  }
}

