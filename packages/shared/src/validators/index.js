import { z } from 'zod';
import { MEAL_RELATIONS } from '../constants';
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const mealTimesSchema = z.object({
    breakfast: z.string().regex(timeRegex, 'Must be 24h format HH:mm (e.g. 08:00)'),
    lunch: z.string().regex(timeRegex, 'Must be 24h format HH:mm (e.g. 13:00)'),
    dinner: z.string().regex(timeRegex, 'Must be 24h format HH:mm (e.g. 20:00)'),
});
export const medicineEntrySchema = z.object({
    medicine_name: z.string().min(2, 'Medicine name is required'),
    tablets_per_dose: z.number().int().min(1).max(3),
    total_doses: z.number().int().min(1).max(7),
    meal_relation: z.enum(MEAL_RELATIONS),
    instructions: z.string().optional(),
    planned_slots: z.array(z.object({
        slot_name: z.enum(['morning', 'afternoon', 'evening', 'night']),
        scheduled_at: z.string().datetime(),
        meal_relation: z.enum(MEAL_RELATIONS),
        tablets: z.number().int().min(1).max(3),
    })).min(1, 'At least one dose slot is required').max(7),
});
export const createVisitSchema = z.object({
    roll_number: z.string().min(3, 'Roll number is required').trim(),
    problem_category: z.string().min(2, 'Problem category is required'),
    clinical_notes: z.string().optional(),
    follow_up_date: z.string().optional(),
    medicines: z.array(medicineEntrySchema).min(1, 'Add at least one medicine').max(4, 'Maximum 4 medicines per visit'),
});
export const doseResponseSchema = z.object({
    dose_id: z.string().uuid(),
    status: z.enum(['taken', 'taken_late', 'not_taken']),
    response_time: z.string().datetime().optional(),
});
export const recoveryCheckResponseSchema = z.object({
    recovery_check_id: z.string().uuid(),
    status: z.enum(['better', 'same', 'worse']),
    side_effects: z.string().optional(),
});
export const callLogSchema = z.object({
    alert_id: z.string().uuid(),
    outcome: z.enum(['reached', 'unreachable', 'call_back_requested', 'emergency_escalated']),
    officer_notes: z.string().min(3, 'Call notes are required'),
});
export const studentCreateSchema = z.object({
    email: z.string().email(),
    full_name: z.string().min(2),
    roll_number: z.string().min(3).trim(),
    department: z.string().min(2),
    year: z.number().int().min(1).max(5),
    hostel_status: z.enum(['hosteler', 'day_scholar']),
    hostel_name: z.string().optional(),
    room_number: z.string().optional(),
    emergency_phone: z.string().min(10, 'Valid emergency phone required'),
    meal_times: mealTimesSchema.optional(),
});
export const staffCreateSchema = z.object({
    email: z.string().email(),
    full_name: z.string().min(2),
    role: z.enum(['doctor', 'officer']),
    designation: z.string().min(2),
    department: z.string().optional(),
    license_number: z.string().optional(),
});
export const consentSchema = z.object({
    consent_given: z.literal(true, {
        errorMap: () => ({ message: 'You must consent to continue' }),
    }),
    version: z.string().default('v1.0'),
});
