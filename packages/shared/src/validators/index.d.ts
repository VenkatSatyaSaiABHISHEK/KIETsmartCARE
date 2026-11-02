import { z } from 'zod';
export declare const mealTimesSchema: z.ZodObject<{
    breakfast: z.ZodString;
    lunch: z.ZodString;
    dinner: z.ZodString;
}, "strip", z.ZodTypeAny, {
    breakfast: string;
    lunch: string;
    dinner: string;
}, {
    breakfast: string;
    lunch: string;
    dinner: string;
}>;
export declare const medicineEntrySchema: z.ZodObject<{
    medicine_name: z.ZodString;
    tablets_per_dose: z.ZodNumber;
    total_doses: z.ZodNumber;
    meal_relation: z.ZodEnum<["before", "after"]>;
    instructions: z.ZodOptional<z.ZodString>;
    planned_slots: z.ZodArray<z.ZodObject<{
        slot_name: z.ZodEnum<["morning", "afternoon", "evening", "night"]>;
        scheduled_at: z.ZodString;
        meal_relation: z.ZodEnum<["before", "after"]>;
        tablets: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        meal_relation: "before" | "after";
        slot_name: "morning" | "afternoon" | "evening" | "night";
        scheduled_at: string;
        tablets: number;
    }, {
        meal_relation: "before" | "after";
        slot_name: "morning" | "afternoon" | "evening" | "night";
        scheduled_at: string;
        tablets: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    medicine_name: string;
    tablets_per_dose: number;
    total_doses: number;
    meal_relation: "before" | "after";
    planned_slots: {
        meal_relation: "before" | "after";
        slot_name: "morning" | "afternoon" | "evening" | "night";
        scheduled_at: string;
        tablets: number;
    }[];
    instructions?: string | undefined;
}, {
    medicine_name: string;
    tablets_per_dose: number;
    total_doses: number;
    meal_relation: "before" | "after";
    planned_slots: {
        meal_relation: "before" | "after";
        slot_name: "morning" | "afternoon" | "evening" | "night";
        scheduled_at: string;
        tablets: number;
    }[];
    instructions?: string | undefined;
}>;
export declare const createVisitSchema: z.ZodObject<{
    roll_number: z.ZodString;
    problem_category: z.ZodString;
    clinical_notes: z.ZodOptional<z.ZodString>;
    follow_up_date: z.ZodOptional<z.ZodString>;
    medicines: z.ZodArray<z.ZodObject<{
        medicine_name: z.ZodString;
        tablets_per_dose: z.ZodNumber;
        total_doses: z.ZodNumber;
        meal_relation: z.ZodEnum<["before", "after"]>;
        instructions: z.ZodOptional<z.ZodString>;
        planned_slots: z.ZodArray<z.ZodObject<{
            slot_name: z.ZodEnum<["morning", "afternoon", "evening", "night"]>;
            scheduled_at: z.ZodString;
            meal_relation: z.ZodEnum<["before", "after"]>;
            tablets: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            meal_relation: "before" | "after";
            slot_name: "morning" | "afternoon" | "evening" | "night";
            scheduled_at: string;
            tablets: number;
        }, {
            meal_relation: "before" | "after";
            slot_name: "morning" | "afternoon" | "evening" | "night";
            scheduled_at: string;
            tablets: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        medicine_name: string;
        tablets_per_dose: number;
        total_doses: number;
        meal_relation: "before" | "after";
        planned_slots: {
            meal_relation: "before" | "after";
            slot_name: "morning" | "afternoon" | "evening" | "night";
            scheduled_at: string;
            tablets: number;
        }[];
        instructions?: string | undefined;
    }, {
        medicine_name: string;
        tablets_per_dose: number;
        total_doses: number;
        meal_relation: "before" | "after";
        planned_slots: {
            meal_relation: "before" | "after";
            slot_name: "morning" | "afternoon" | "evening" | "night";
            scheduled_at: string;
            tablets: number;
        }[];
        instructions?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    roll_number: string;
    problem_category: string;
    medicines: {
        medicine_name: string;
        tablets_per_dose: number;
        total_doses: number;
        meal_relation: "before" | "after";
        planned_slots: {
            meal_relation: "before" | "after";
            slot_name: "morning" | "afternoon" | "evening" | "night";
            scheduled_at: string;
            tablets: number;
        }[];
        instructions?: string | undefined;
    }[];
    clinical_notes?: string | undefined;
    follow_up_date?: string | undefined;
}, {
    roll_number: string;
    problem_category: string;
    medicines: {
        medicine_name: string;
        tablets_per_dose: number;
        total_doses: number;
        meal_relation: "before" | "after";
        planned_slots: {
            meal_relation: "before" | "after";
            slot_name: "morning" | "afternoon" | "evening" | "night";
            scheduled_at: string;
            tablets: number;
        }[];
        instructions?: string | undefined;
    }[];
    clinical_notes?: string | undefined;
    follow_up_date?: string | undefined;
}>;
export declare const doseResponseSchema: z.ZodObject<{
    dose_id: z.ZodString;
    status: z.ZodEnum<["taken", "taken_late", "not_taken"]>;
    response_time: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "taken" | "taken_late" | "not_taken";
    dose_id: string;
    response_time?: string | undefined;
}, {
    status: "taken" | "taken_late" | "not_taken";
    dose_id: string;
    response_time?: string | undefined;
}>;
export declare const recoveryCheckResponseSchema: z.ZodObject<{
    recovery_check_id: z.ZodString;
    status: z.ZodEnum<["better", "same", "worse"]>;
    side_effects: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "better" | "same" | "worse";
    recovery_check_id: string;
    side_effects?: string | undefined;
}, {
    status: "better" | "same" | "worse";
    recovery_check_id: string;
    side_effects?: string | undefined;
}>;
export declare const callLogSchema: z.ZodObject<{
    alert_id: z.ZodString;
    outcome: z.ZodEnum<["reached", "unreachable", "call_back_requested", "emergency_escalated"]>;
    officer_notes: z.ZodString;
}, "strip", z.ZodTypeAny, {
    alert_id: string;
    outcome: "reached" | "unreachable" | "call_back_requested" | "emergency_escalated";
    officer_notes: string;
}, {
    alert_id: string;
    outcome: "reached" | "unreachable" | "call_back_requested" | "emergency_escalated";
    officer_notes: string;
}>;
export declare const studentCreateSchema: z.ZodObject<{
    email: z.ZodString;
    full_name: z.ZodString;
    roll_number: z.ZodString;
    department: z.ZodString;
    year: z.ZodNumber;
    hostel_status: z.ZodEnum<["hosteler", "day_scholar"]>;
    hostel_name: z.ZodOptional<z.ZodString>;
    room_number: z.ZodOptional<z.ZodString>;
    emergency_phone: z.ZodString;
    meal_times: z.ZodOptional<z.ZodObject<{
        breakfast: z.ZodString;
        lunch: z.ZodString;
        dinner: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        breakfast: string;
        lunch: string;
        dinner: string;
    }, {
        breakfast: string;
        lunch: string;
        dinner: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    roll_number: string;
    email: string;
    full_name: string;
    department: string;
    year: number;
    hostel_status: "hosteler" | "day_scholar";
    emergency_phone: string;
    hostel_name?: string | undefined;
    room_number?: string | undefined;
    meal_times?: {
        breakfast: string;
        lunch: string;
        dinner: string;
    } | undefined;
}, {
    roll_number: string;
    email: string;
    full_name: string;
    department: string;
    year: number;
    hostel_status: "hosteler" | "day_scholar";
    emergency_phone: string;
    hostel_name?: string | undefined;
    room_number?: string | undefined;
    meal_times?: {
        breakfast: string;
        lunch: string;
        dinner: string;
    } | undefined;
}>;
export declare const staffCreateSchema: z.ZodObject<{
    email: z.ZodString;
    full_name: z.ZodString;
    role: z.ZodEnum<["doctor", "officer"]>;
    designation: z.ZodString;
    department: z.ZodOptional<z.ZodString>;
    license_number: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    full_name: string;
    role: "doctor" | "officer";
    designation: string;
    department?: string | undefined;
    license_number?: string | undefined;
}, {
    email: string;
    full_name: string;
    role: "doctor" | "officer";
    designation: string;
    department?: string | undefined;
    license_number?: string | undefined;
}>;
export declare const consentSchema: z.ZodObject<{
    consent_given: z.ZodLiteral<true>;
    version: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    consent_given: true;
    version: string;
}, {
    consent_given: true;
    version?: string | undefined;
}>;
