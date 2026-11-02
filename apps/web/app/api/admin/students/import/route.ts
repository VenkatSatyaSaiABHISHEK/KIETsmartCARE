import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PinAuthService } from "@/lib/auth/pin-service";
import * as XLSX from "xlsx";
import {
  validateAndNormalizeStudentRows,
  generateSampleExcelBuffer,
} from "@/lib/admin/student-file-parser";

export const dynamic = "force-dynamic";

// GET: Download 10-Student Sample Excel Template (.xlsx)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("sample") === "1" || searchParams.get("template") === "xlsx") {
    const buffer = generateSampleExcelBuffer();
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="KIET_Students_10_Sample.xlsx"',
      },
    });
  }
  return NextResponse.json({ message: "Student import API" });
}

// POST: Upload and ingest Excel / CSV / PDF or JSON student rows
export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get("kiet_session")?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized: Admin session required" }, { status: 401 });
    }

    const payload = PinAuthService.verifySessionToken(sessionToken);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
    }

    let rawRows: Record<string, any>[] = [];
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file provided in form data" }, { status: 400 });
      }

      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith(".pdf")) {
        // PDF Ingestion (dynamically loaded to avoid Next.js SSR bundle issues with pdfjs-dist)
        const pdfModule: any = await import("pdf-parse");
        const pdfParse = pdfModule.default || pdfModule;
        const pdfData = await pdfParse(fileBuffer);
        const text = pdfData.text || "";
        const lines: string[] = text.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);

        // Parse line items: expect line with Roll (10 chars), Phone (10 digits)
        lines.forEach((line: string) => {
          // Find 10-char roll: e.g. 24AB012001 or 2400290129
          const rollMatch = line.match(/\b([A-Za-z0-9]{10})\b/);
          // Find 10-digit phone
          const phoneMatch = line.match(/\b([6-9]\d{9})\b/);

          if (rollMatch && phoneMatch) {
            const roll = rollMatch[1].toUpperCase();
            const phone = phoneMatch[1];
            // Name is text between roll and phone or surrounding
            let name = line.replace(rollMatch[0], "").replace(phoneMatch[0], "").replace(/[^a-zA-Z\s]/g, " ").trim();
            if (!name || name.length < 2) name = "Student " + roll;

            const isHosteler = /hostel|room|b-|g-/i.test(line);
            const roomMatch = line.match(/\b([BGbg]-\d{3})\b/);

            rawRows.push({
              "Roll Number": roll,
              "Student Name": name,
              "Phone Number": phone,
              "Room Number": roomMatch ? roomMatch[1].toUpperCase() : isHosteler ? "B-101" : "-",
              "Residence Type": isHosteler ? "Hosteler" : "Day Scholar",
              "Year": 1,
              "Branch": "CSE",
            });
          }
        });
      } else {
        // Excel (.xlsx, .xls) or CSV
        const workbook = XLSX.read(fileBuffer, { type: "buffer" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: "" });
      }
    } else {
      // JSON body
      const json = await req.json();
      rawRows = json.rows || json.raw_rows || [];
    }

    if (!Array.isArray(rawRows) || rawRows.length === 0) {
      return NextResponse.json(
        { error: "No student records could be read from the file. Please check format." },
        { status: 400 }
      );
    }

    // Validate and normalize all rows
    const { valid, invalid } = validateAndNormalizeStudentRows(rawRows);

    if (valid.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "All rows failed validation.",
          invalid_count: invalid.length,
          errors: invalid.map((i) => `Row ${i.row}: ${i.reason}`),
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const enrolledStudents = [];

    // Ingest into Supabase
    for (const record of valid) {
      const internalEmail = `${record.roll_number.toLowerCase()}@kiet.edu`;
      const defaultPassword = record.roll_number; // Exactly uppercase roll number itself

      // 1. Create or resolve Auth user with roll number as initial password
      let profileId: string | null = null;
      try {
        const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
          email: internalEmail,
          password: defaultPassword,
          email_confirm: true,
          user_metadata: {
            roll_number: record.roll_number,
            full_name: record.name,
            role: "student",
          },
        });

        if (authUser?.user) {
          profileId = authUser.user.id;
        } else if (authErr) {
          // If already exists, find user by email and reset password to roll number
          const { data: userList } = await supabase.auth.admin.listUsers();
          const match = userList?.users?.find((u) => u.email === internalEmail);
          if (match) {
            profileId = match.id;
            await supabase.auth.admin.updateUserById(match.id, {
              password: defaultPassword,
              user_metadata: {
                roll_number: record.roll_number,
                full_name: record.name,
                role: "student",
              },
            });
          }
        }
      } catch (err) {
        console.warn("[BULK IMPORT] Auth creation notice:", err);
      }

      // 2. Insert or update into profiles
      if (profileId) {
        await supabase
          .from("profiles")
          .upsert(
            {
              id: profileId,
              role: "student",
              full_name: record.name,
              phone: record.phone,
              status: "active",
            },
            { onConflict: "id" }
          );
      }

      // 3. Upsert into students table
      const { data: student, error: studentErr } = await supabase
        .from("students")
        .upsert(
          {
            roll_number: record.roll_number,
            name: record.name,
            branch: record.branch,
            year: record.year,
            phone: record.phone,
            residence_type: /host/i.test(record.residence_type) ? "hostler" : "day_scholar",
            room_number: /host/i.test(record.residence_type) ? (record.room_number || "B-101") : null,
            emergency_contact: "+91-120-2983555",
            status: "active",
            profile_id: profileId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "roll_number" }
        )
        .select("id, roll_number, name")
        .single();

      if (studentErr) {
        console.error("[BULK IMPORT] Student upsert error:", studentErr);
      } else if (student) {
        // 4. Default meal times
        await supabase.from("student_meal_times").upsert(
          {
            student_id: student.id,
            breakfast: "08:15:00",
            lunch: "13:30:00",
            dinner: "20:30:00",
          },
          { onConflict: "student_id" }
        );

        enrolledStudents.push(student);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully enrolled ${enrolledStudents.length} students into the directory.`,
      enrolled_count: enrolledStudents.length,
      invalid_count: invalid.length,
      errors: invalid.map((i) => `Row ${i.row}: ${i.reason}`),
      students: enrolledStudents,
    });
  } catch (err: any) {
    console.error("[BULK IMPORT EXCEPTION]", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error during import" },
      { status: 500 }
    );
  }
}
