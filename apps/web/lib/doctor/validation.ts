import { z } from "zod";

export const medicineRowSchema = z.object({
  id: z.string().optional(),
  medicine_name: z.string().min(2, "Select or enter medicine name"),
  dose: z.string().min(1, "Dose is required (e.g., 1 tablet, 500mg)"),
  times_per_day: z.number().int().min(1).max(4, "Max 4 doses per day"),
  meal_relation: z.enum(["before", "after"]),
  meal_slots: z.array(z.enum(["breakfast", "lunch", "dinner"])).min(1, "Select at least one meal time"),
  number_of_days: z.number().int().min(1, "Minimum 1 day").max(30, "Max 30 days per course"),
  quantity_handed_over: z.number().int().min(1, "Quantity handed over must be at least 1"),
  instructions: z.string().optional(),
});

export const visitFormSchema = z.object({
  student_id: z.string().min(1, "Select a valid student"),
  roll_number: z.string().min(3, "Roll number is required"),
  problem_category: z.string().min(2, "Select or specify a problem category"),
  clinical_notes: z.string().optional(),
  medicines: z.array(medicineRowSchema).min(1, "At least one medicine is strictly required to prescribe"),
  follow_up_date: z.string().optional(),
});

export const studentSearchSchema = z.string().trim().min(1, "Enter a roll number to search");

export type MedicineRowFormValues = z.infer<typeof medicineRowSchema>;
export type VisitFormValues = z.infer<typeof visitFormSchema>;
