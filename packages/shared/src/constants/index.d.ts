export declare const USER_ROLES: readonly ["admin", "doctor", "officer", "student"];
export type UserRole = (typeof USER_ROLES)[number];
export declare const MEAL_TYPES: readonly ["breakfast", "lunch", "dinner"];
export type MealType = (typeof MEAL_TYPES)[number];
export declare const CLINICAL_DOSE_SLOTS: readonly ["morning", "afternoon", "evening", "night"];
export type ClinicalDoseSlot = (typeof CLINICAL_DOSE_SLOTS)[number];
export declare const DEFAULT_SLOT_TIMES: Record<ClinicalDoseSlot, string>;
export declare const MEAL_RELATIONS: readonly ["before", "after"];
export type MealRelation = (typeof MEAL_RELATIONS)[number];
export declare const DEFAULT_MEAL_TIMES: Record<MealType, string>;
export declare const BEFORE_MEAL_OFFSET_MINUTES = -30;
export declare const AFTER_MEAL_OFFSET_MINUTES = 30;
export declare const DOSE_STATUSES: readonly ["scheduled", "taken", "taken_late", "not_taken", "unconfirmed"];
export type DoseStatus = (typeof DOSE_STATUSES)[number];
export declare const RECOVERY_STATUSES: readonly ["better", "same", "worse", "side_effect", "no_response"];
export type RecoveryStatus = (typeof RECOVERY_STATUSES)[number];
export declare const ALERT_LEVELS: readonly ["red", "yellow", "info"];
export type AlertLevel = (typeof ALERT_LEVELS)[number];
export declare const ALERT_TRIGGERS: {
    RED: readonly ["same", "worse", "side_effect"];
    YELLOW: readonly ["no_response"];
};
export declare const MISSED_DOSE_ADVISORY = "Never double up on a missed dose. Follow your prescription directions or contact your doctor for guidance.";
export declare const ROLE_ROUTE_MAP: Record<UserRole, string>;
export declare const EMERGENCY_CONTACTS: {
    CAMPUS_HEALTH_CENTRE: string;
    AMBULANCE: string;
    EMERGENCY_NATIONAL: string;
};
export declare const STORAGE_BUCKETS: {
    readonly PRESCRIPTIONS: "prescriptions";
    readonly MEDICAL_RECORDS: "medical-records";
    readonly AUDIT_EXPORTS: "audit-exports";
};
