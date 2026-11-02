import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().email("A valid institutional email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const mfaVerifySchema = z.object({
  code: z
    .string()
    .length(6, "Authenticator code must be exactly 6 digits")
    .regex(/^\d{6}$/, "Must contain only numeric digits"),
});

export const staffCreateSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Valid institutional email address required"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Indian phone number must be 10 digits starting with 6-9"),
  role: z.enum(["doctor", "officer"], {
    errorMap: () => ({ message: "Role must be either doctor or officer" }),
  }),
  qualification: z.string().optional(),
  designation: z.string().optional(),
});

export const staffUpdateSchema = z.object({
  role: z.enum(["doctor", "officer"]).optional(),
  status: z.enum(["active", "disabled"]).optional(),
});

export const studentCreateSchema = z.object({
  roll_number: z
    .string()
    .min(5, "Roll number must be at least 5 alphanumeric characters")
    .regex(/^[A-Za-z0-9]+$/, "Roll number must be alphanumeric"),
  name: z.string().min(2, "Full student name is required"),
  branch: z.string().min(2, "Branch/Department code is required (e.g. CSE, ECE)"),
  year: z.number().int().min(1).max(4, "Year must be between 1 and 4"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Phone number must be a valid 10-digit mobile number"),
  emergency_contact: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Emergency contact must be a valid 10-digit mobile number"),
  allergies: z.array(z.string()).default([]),
  avatar_url: z.string().optional(),
});

export const studentUpdateSchema = studentCreateSchema.partial().extend({
  status: z.enum(["active", "graduated", "suspended"]).optional(),
});

export const columnMappingSchema = z.object({
  roll_number: z.string().min(1, "Roll number column mapping is required"),
  name: z.string().min(1, "Name column mapping is required"),
  branch: z.string().min(1, "Branch column mapping is required"),
  year: z.string().min(1, "Year column mapping is required"),
  phone: z.string().min(1, "Phone column mapping is required"),
  emergency_contact: z.string().min(1, "Emergency contact mapping is required"),
  allergies: z.string().optional().default(""),
});

export const adminSettingsSchema = z.object({
  meal_times: z.object({
    breakfast: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format HH:MM required"),
    lunch: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format HH:MM required"),
    dinner: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format HH:MM required"),
  }),
  emergency_contacts: z.object({
    clinic_opd: z.string().min(5, "Clinic OPD contact required"),
    ambulance: z.string().min(5, "Ambulance contact required"),
    emergency_national: z.string().min(3, "National emergency contact required"),
    security_desk: z.string().min(5, "Security desk contact required"),
  }),
  medicines: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(2),
      category: z.string().min(2),
      default_dose: z.string().min(1),
      stock_quantity: z.number().int().nonnegative(),
      allergy_keywords: z.array(z.string()),
    })
  ),
  presets: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(2),
      problem: z.string().min(2),
      medicine_names: z.array(z.string()),
    })
  ),
});
