import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { data: categories, error } = await supabase
      .from("problem_categories")
      .select("id, name, sort_order")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (error || !categories || categories.length === 0) {
      return NextResponse.json({
        categories: [
          { name: "Headache", sort_order: 1 },
          { name: "Body pain", sort_order: 2 },
          { name: "Fever", sort_order: 3 },
          { name: "Cold and cough", sort_order: 4 },
          { name: "Stomach pain", sort_order: 5 },
          { name: "Vomiting", sort_order: 6 },
          { name: "Sore throat", sort_order: 7 },
          { name: "Injury", sort_order: 8 },
          { name: "Other", sort_order: 9 },
        ],
      });
    }

    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json({
      categories: [
        { name: "Headache", sort_order: 1 },
        { name: "Body pain", sort_order: 2 },
        { name: "Fever", sort_order: 3 },
        { name: "Cold and cough", sort_order: 4 },
        { name: "Stomach pain", sort_order: 5 },
        { name: "Vomiting", sort_order: 6 },
        { name: "Sore throat", sort_order: 7 },
        { name: "Injury", sort_order: 8 },
        { name: "Other", sort_order: 9 },
      ],
    });
  }
}

