import * as XLSX from "xlsx";

export interface ParsedStudentRow {
  roll_number: string;
  name: string;
  phone: string;
  room_number: string;
  residence_type: "Hosteler" | "Day Scholar";
  year: number;
  branch: string;
}

export interface ParseResult {
  valid: ParsedStudentRow[];
  invalid: { row: number; raw: Record<string, any>; reason: string }[];
}

/**
 * Normalizes roll number:
 * - Exactly 10 alphanumeric characters
 * - Converts all letters to UPPERCASE (e.g., '24ab012019' -> '24AB012019')
 */
export function normalizeRollNumber(raw: string): string | null {
  if (!raw) return null;
  // Remove whitespace
  const clean = raw.trim().toUpperCase();
  // Must be exactly 10 alphanumeric characters
  const isValid = /^[A-Z0-9]{10}$/.test(clean);
  return isValid ? clean : null;
}

/**
 * Normalizes phone number to 10 digits
 */
export function normalizePhone(raw: string): string | null {
  if (!raw) return null;
  const digits = raw.toString().replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return null;
}

/**
 * Parses raw JSON rows from Excel / CSV / PDF into structured student records
 */
export function validateAndNormalizeStudentRows(rawRows: Record<string, any>[]): ParseResult {
  const valid: ParsedStudentRow[] = [];
  const invalid: { row: number; raw: Record<string, any>; reason: string }[] = [];
  const seenRolls = new Set<string>();

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2; // considering 1-based index with header at row 1

    // Extract fields with case-insensitive key lookup
    const findVal = (keys: string[]): string => {
      for (const k of Object.keys(row)) {
        const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, "");
        for (const target of keys) {
          if (cleanK === target.toLowerCase().replace(/[^a-z0-9]/g, "") || cleanK.includes(target)) {
            return String(row[k] || "").trim();
          }
        }
      }
      return "";
    };

    const rawRoll = findVal(["roll", "rollnumber", "rollno", "studentid", "id"]);
    const rawName = findVal(["name", "studentname", "fullname"]);
    const rawPhone = findVal(["phone", "mobile", "contact", "phonenumber", "studentphone"]);
    const rawRoom = findVal(["room", "roomno", "roomnumber", "hostelroom"]);
    const rawResidence = findVal(["residence", "residencetype", "hostel", "hosteler", "dayscholar", "type"]);
    const rawYear = findVal(["year", "academicyear", "currentyear", "class"]);
    const rawBranch = findVal(["branch", "department", "dept", "course"]);

    // 1. Validate Roll Number (exactly 10 chars, uppercase)
    const roll_number = normalizeRollNumber(rawRoll);
    if (!roll_number) {
      invalid.push({
        row: rowNum,
        raw: row,
        reason: `Roll number "${rawRoll}" is invalid. It must be exactly 10 alphanumeric characters (uppercase).`,
      });
      return;
    }

    if (seenRolls.has(roll_number)) {
      invalid.push({
        row: rowNum,
        raw: row,
        reason: `Duplicate roll number "${roll_number}" found in file.`,
      });
      return;
    }
    seenRolls.add(roll_number);

    // 2. Validate Name
    if (!rawName || rawName.length < 2) {
      invalid.push({
        row: rowNum,
        raw: row,
        reason: `Student name is missing or too short.`,
      });
      return;
    }

    // 3. Validate Phone Number (10 digits)
    const phone = normalizePhone(rawPhone);
    if (!phone) {
      invalid.push({
        row: rowNum,
        raw: row,
        reason: `Phone number "${rawPhone}" is invalid. Must be exactly 10 digits.`,
      });
      return;
    }

    // 4. Validate Year
    let year = parseInt(rawYear, 10);
    if (isNaN(year) || year < 1 || year > 4) {
      year = 1; // Default to 1st year if unparseable
    }

    // 5. Residence Type & Room Number
    let residence_type: "Hosteler" | "Day Scholar" = "Hosteler";
    if (/day/i.test(rawResidence) || /scholar/i.test(rawResidence) || !rawRoom || rawRoom === "-" || rawRoom.toLowerCase() === "na") {
      residence_type = "Day Scholar";
    }
    const room_number = residence_type === "Hosteler" ? (rawRoom || "B-101") : "-";

    // 6. Branch
    const branch = rawBranch ? rawBranch.toUpperCase() : "CSE";

    valid.push({
      roll_number,
      name: rawName,
      phone,
      room_number,
      residence_type,
      year,
      branch,
    });
  });

  return { valid, invalid };
}

/**
 * Generate a ready-to-use 10-student Excel buffer template
 */
export function generateSampleExcelBuffer(): Buffer {
  const sampleData = [
    {
      "Roll Number (10 Chars)": "24AB012001",
      "Student Name": "Aarav Sharma",
      "Phone Number": "9876500001",
      "Room Number": "B-214",
      "Residence Type": "Hosteler",
      "Year": 1,
      "Branch": "CSE",
    },
    {
      "Roll Number (10 Chars)": "24AB012002",
      "Student Name": "Sneha Patel",
      "Phone Number": "9876500002",
      "Room Number": "G-102",
      "Residence Type": "Hosteler",
      "Year": 1,
      "Branch": "ECE",
    },
    {
      "Roll Number (10 Chars)": "24AB012003",
      "Student Name": "Rohan Verma",
      "Phone Number": "9876500003",
      "Room Number": "-",
      "Residence Type": "Day Scholar",
      "Year": 1,
      "Branch": "IT",
    },
    {
      "Roll Number (10 Chars)": "24AB012004",
      "Student Name": "Priya Nair",
      "Phone Number": "9876500004",
      "Room Number": "G-205",
      "Residence Type": "Hosteler",
      "Year": 2,
      "Branch": "CSE",
    },
    {
      "Roll Number (10 Chars)": "24AB012005",
      "Student Name": "Kabir Singh",
      "Phone Number": "9876500005",
      "Room Number": "B-301",
      "Residence Type": "Hosteler",
      "Year": 2,
      "Branch": "ME",
    },
    {
      "Roll Number (10 Chars)": "24AB012006",
      "Student Name": "Ananya Reddy",
      "Phone Number": "9876500006",
      "Room Number": "-",
      "Residence Type": "Day Scholar",
      "Year": 2,
      "Branch": "CSE",
    },
    {
      "Roll Number (10 Chars)": "24AB012007",
      "Student Name": "Manish Tyagi",
      "Phone Number": "9876500007",
      "Room Number": "B-110",
      "Residence Type": "Hosteler",
      "Year": 3,
      "Branch": "EE",
    },
    {
      "Roll Number (10 Chars)": "24AB012008",
      "Student Name": "Rahul Gupta",
      "Phone Number": "9876500008",
      "Room Number": "-",
      "Residence Type": "Day Scholar",
      "Year": 3,
      "Branch": "IT",
    },
    {
      "Roll Number (10 Chars)": "24AB012009",
      "Student Name": "Pooja Mishra",
      "Phone Number": "9876500009",
      "Room Number": "G-312",
      "Residence Type": "Hosteler",
      "Year": 4,
      "Branch": "CSE",
    },
    {
      "Roll Number (10 Chars)": "24AB012010",
      "Student Name": "Vikram Malhotra",
      "Phone Number": "9876500010",
      "Room Number": "B-408",
      "Residence Type": "Hosteler",
      "Year": 4,
      "Branch": "ECE",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "KIET_Students");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

