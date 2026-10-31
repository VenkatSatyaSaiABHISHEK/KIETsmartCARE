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
    dose: z.ZodString;
    times_per_day: z.ZodNumber;
    meal_relation: z.ZodEnum<["before", "after"]>;
    meal_slots: z.ZodArray<z.ZodEnum<["breakfast", "lunch", "dinner"]>, "many">;
    number_of_days: z.ZodNumber;
    instructions: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    medicine_name: string;
    dose: string;
    times_per_day: number;
    meal_relation: "before" | "after";
    meal_slots: ("breakfast" | "lunch" | "dinner")[];
    number_of_days: number;
    instructions?: string | undefined;
}, {
    medicine_name: string;
    dose: string;
    times_per_day: number;
    meal_relation: "before" | "after";
    meal_slots: ("breakfast" | "lunch" | "dinner")[];
    number_of_days: number;
    instructions?: string | undefined;
}>;
export declare const createVisitSchema: z.ZodObject<{
    roll_number: z.ZodString;
    problem_category: z.ZodString;
    clinical_notes: z.ZodOptional<z.ZodString>;
    vitals: z.ZodOptional<z.ZodObject<{
        blood_pressure: z.ZodOptional<z.ZodString>;
        pulse: z.ZodOptional<z.ZodNumber>;
        temperature_f: z.ZodOptional<z.ZodNumber>;
        spo2: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        blood_pressure?: string | undefined;
        pulse?: number | undefined;
        temperature_f?: number | undefined;
        spo2?: number | undefined;
    }, {
        blood_pressure?: string | undefined;
        pulse?: number | undefined;
        temperature_f?: number | undefined;
        spo2?: number | undefined;
    }>>;
    medicines: z.ZodArray<z.ZodObject<{
        medicine_name: z.ZodString;
        dose: z.ZodString;
        times_per_day: z.ZodNumber;
        meal_relation: z.ZodEnum<["before", "after"]>;
        meal_slots: z.ZodArray<z.ZodEnum<["breakfast", "lunch", "dinner"]>, "many">;
        number_of_days: z.ZodNumber;
        instructions: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        medicine_name: string;
        dose: string;
        times_per_day: number;
        meal_relation: "before" | "after";
        meal_slots: ("breakfast" | "lunch" | "dinner")[];
        number_of_days: number;
        instructions?: string | undefined;
    }, {
        medicine_name: string;
        dose: string;
        times_per_day: number;
        meal_relation: "before" | "after";
        meal_slots: ("breakfast" | "lunch" | "dinner")[];
        number_of_days: number;
        instructions?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    roll_number: string;
    problem_category: string;
    medicines: {
        medicine_name: string;
        dose: string;
        times_per_day: number;
        meal_relation: "before" | "after";
        meal_slots: ("breakfast" | "lunch" | "dinner")[];
        number_of_days: number;
        instructions?: string | undefined;
    }[];
    clinical_notes?: string | undefined;
    vitals?: {
        blood_pressure?: string | undefined;
        pulse?: number | undefined;
        temperature_f?: number | undefined;
        spo2?: number | undefined;
    } | undefined;
}, {
    roll_number: string;
    problem_category: string;
    medicines: {
        medicine_name: string;
        dose: string;
        times_per_day: number;
        meal_relation: "before" | "after";
        meal_slots: ("breakfast" | "lunch" | "dinner")[];
        number_of_days: number;
        instructions?: string | undefined;
    }[];
    clinical_notes?: string | undefined;
    vitals?: {
        blood_pressure?: string | undefined;
        pulse?: number | undefined;
        temperature_f?: number | undefined;
        spo2?: number | undefined;
    } | undefined;
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
