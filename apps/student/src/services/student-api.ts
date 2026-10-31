import {
  StudentProfileData,
  DoseScheduleRecord,
  PrescriptionRecord,
  RecoveryInquiry,
  MealTimesConfig,
} from '../types/student';
import { OfflineQueue } from './offline-queue';
import { DEFAULT_MEAL_TIMES } from '@kiet-smart-care/shared';

// In-memory student state
let currentStudentProfile: StudentProfileData = {
  id: 'std-001',
  roll_number: '2200290120019',
  full_name: 'Aarav Sharma',
  department: 'Computer Science & Engineering',
  year: 3,
  hostel_status: 'Hosteler',
  hostel_name: 'Tagore Hostel',
  room_number: 'T-302',
  allergies: ['Penicillin', 'Sulfa drugs'],
  meal_times: {
    breakfast: '08:15',
    lunch: '13:30',
    dinner: '20:30',
  },
  emergency_contact: '+91 98765 43210',
  language: 'en',
};

let currentDoses: DoseScheduleRecord[] = [
  {
    id: 'dose-01',
    prescription_id: 'rx-101',
    medicine_name: 'Paracetamol 650mg',
    dose: '1 tablet',
    scheduled_time: '14:00', // Lunch + 30m
    meal_slot: 'lunch',
    meal_relation: 'after',
    status: 'scheduled',
  },
  {
    id: 'dose-02',
    prescription_id: 'rx-101',
    medicine_name: 'Pantoprazole 40mg',
    dose: '1 tablet',
    scheduled_time: '07:45', // Breakfast - 30m
    meal_slot: 'breakfast',
    meal_relation: 'before',
    status: 'taken',
    confirmed_at: '07:50 AM',
  },
  {
    id: 'dose-03',
    prescription_id: 'rx-101',
    medicine_name: 'Paracetamol 650mg',
    dose: '1 tablet',
    scheduled_time: '21:00', // Dinner + 30m
    meal_slot: 'dinner',
    meal_relation: 'after',
    status: 'scheduled',
  },
  {
    id: 'dose-04',
    prescription_id: 'rx-101',
    medicine_name: 'Cetirizine 10mg',
    dose: '1 tablet',
    scheduled_time: '21:00', // Dinner + 30m
    meal_slot: 'dinner',
    meal_relation: 'after',
    status: 'scheduled',
  },
];

let activeRecoveryInquiry: RecoveryInquiry | null = {
  id: 'rec-001',
  visit_id: 'vst-101',
  problem_name: 'Fever & Head Cold',
  due_date: 'Today',
};

const currentPrescriptions: PrescriptionRecord[] = [
  {
    id: 'rx-101',
    doctor_name: 'Dr. Alok Verma, MBBS, MD',
    problem_category: 'Fever & Head Cold',
    start_date: '29 Oct 2026',
    end_date: '01 Nov 2026',
    is_active: true,
    medicines: [
      {
        name: 'Paracetamol 650mg',
        dose: '1 tablet',
        meal_relation: 'after',
        meal_slot: 'lunch, dinner',
        duration_days: 3,
      },
      {
        name: 'Pantoprazole 40mg',
        dose: '1 tablet',
        meal_relation: 'before',
        meal_slot: 'breakfast',
        duration_days: 3,
      },
      {
        name: 'Cetirizine 10mg',
        dose: '1 tablet',
        meal_relation: 'after',
        meal_slot: 'dinner',
        duration_days: 3,
      },
    ],
  },
  {
    id: 'rx-092',
    doctor_name: 'Dr. R. K. Singhal',
    problem_category: 'Tension Headache',
    start_date: '14 Sep 2026',
    end_date: '16 Sep 2026',
    is_active: false,
    medicines: [
      {
        name: 'Paracetamol 500mg',
        dose: '1 tablet',
        meal_relation: 'after',
        meal_slot: 'lunch',
        duration_days: 2,
      },
    ],
  },
];

export class StudentApi {
  static async getProfile(): Promise<StudentProfileData> {
    return currentStudentProfile;
  }

  static async updateMealTimes(times: MealTimesConfig): Promise<void> {
    currentStudentProfile.meal_times = times;
    await OfflineQueue.enqueue('MEAL_TIMES_UPDATE', { meal_times: times });
  }

  static async updateLanguage(lang: 'en' | 'te'): Promise<void> {
    currentStudentProfile.language = lang;
  }

  static async getDoses(): Promise<DoseScheduleRecord[]> {
    return currentDoses;
  }

  static async submitDoseAnswer(
    doseId: string,
    status: 'taken' | 'taken_late' | 'not_taken'
  ): Promise<void> {
    currentDoses = currentDoses.map((d) =>
      d.id === doseId
        ? {
            ...d,
            status,
            confirmed_at: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          }
        : d
    );
  }

  static async getPrescriptions(): Promise<PrescriptionRecord[]> {
    return currentPrescriptions;
  }

  static async getRecoveryInquiry(): Promise<RecoveryInquiry | null> {
    return activeRecoveryInquiry;
  }

  static async submitRecoveryResponse(
    inquiryId: string,
    response: 'better' | 'same' | 'worse'
  ): Promise<void> {
    if (activeRecoveryInquiry && activeRecoveryInquiry.id === inquiryId) {
      activeRecoveryInquiry.status = response;
      activeRecoveryInquiry.answered_at = new Date().toISOString();
    }

    await OfflineQueue.enqueue('RECOVERY_RESPONSE', {
      inquiry_id: inquiryId,
      status: response,
      timestamp: new Date().toISOString(),
    });

    if (response === 'same' || response === 'worse') {
      console.log('[RED ALERT DISPATCH] Triggering immediate high-priority Red Alert to Dr. Verma & Health Officer!');
    }
  }

  static async reportProblem(description: string): Promise<{ success: boolean; redAlertCreated: boolean }> {
    await OfflineQueue.enqueue('SIDE_EFFECT_REPORT', {
      student_id: currentStudentProfile.id,
      roll_number: currentStudentProfile.roll_number,
      description,
      timestamp: new Date().toISOString(),
    });

    console.log('[RED ALERT DISPATCH] Adverse side effect reported by student. Red alert sent to doctor & officer.');

    return {
      success: true,
      redAlertCreated: true,
    };
  }

  static async recordConsent(): Promise<void> {
    await OfflineQueue.enqueue('DOSE_RESPONSE', {
      action: 'CONSENT_ACCEPTED',
      version: 'v1.0',
      timestamp: new Date().toISOString(),
    });
    console.log('[CONSENT LEDGER] Recorded student consent in consent_records.');
  }
}
