import { NextRequest, NextResponse } from "next/server";
import { adminService } from "@/lib/admin/service";
import { columnMappingSchema } from "@/lib/admin/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { raw_rows, mapping } = body;

    if (!Array.isArray(raw_rows) || raw_rows.length === 0) {
      return NextResponse.json(
        { error: "No student records provided in payload" },
        { status: 400 }
      );
    }

    const parsedMapping = columnMappingSchema.safeParse(mapping);
    if (!parsedMapping.success) {
      return NextResponse.json(
        { error: `Column mapping error: ${parsedMapping.error.issues[0].message}` },
        { status: 400 }
      );
    }

    const summary = adminService.bulkImportStudents(raw_rows, parsedMapping.data);

    return NextResponse.json({
      success: true,
      summary,
      message: `Batch ingestion complete: ${summary.valid_count} enrolled, ${summary.invalid_count} rejected.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to process bulk import" },
      { status: 500 }
    );
  }
}
