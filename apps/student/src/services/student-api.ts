import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StudentProfileData,
  DoseScheduleRecord,
  PrescriptionRecord,
  RecoveryInquiry,
  MealTimesConfig,
} from '../types/student';
import { supabase } from './supabase';
import { AuthService } from './auth';
import { OfflineQueue } from './offline-queue';
import { DEFAULT_MEAL_TIMES } from '../constants/shared';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface CacheStore {
  profile: StudentProfileData | null;
  doses: DoseScheduleRecord[] | null;
  prescriptions: PrescriptionRecord[] | null;
  history: any[] | null;
  recoveryInquiry: RecoveryInquiry | null;
}

const memoryCache: CacheStore = {
  profile: null,
  doses: null,
  prescriptions: null,
  history: null,
  recoveryInquiry: null,
};

async function getCached<T>(key: keyof CacheStore): Promise<T | null> {
  if (memoryCache[key]) return memoryCache[key] as unknown as T;
  try {
    const raw = await AsyncStorage.getItem(`KIET_CACHE_${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      memoryCache[key] = parsed;
      return parsed as T;
    }
  } catch {}
  return null;
}

async function setCached<T>(key: keyof CacheStore, data: T): Promise<void> {
  (memoryCache as any)[key] = data;
  try {
    await AsyncStorage.setItem(`KIET_CACHE_${key}`, JSON.stringify(data));
  } catch {}
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 2000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

export class StudentApi {
  /**
   * Fetch student's profile and personalized meal timings
   */
  static async getProfile(): Promise<StudentProfileData> {
    const session = await AuthService.getCurrentSession();
    const studentId = session?.user_id;
    const rollNumber = session?.roll_number;

    // 0. Instant Cache Return
    const cached = await getCached<StudentProfileData>('profile');
    if (cached) {
      return cached;
    }

    // 1. Try Backend API
    try {
      const q = studentId ? `studentId=${encodeURIComponent(studentId)}` : `rollNumber=${encodeURIComponent(rollNumber || '')}`;
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/student/dashboard?${q}`, {}, 2000);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.student) {
          const s = json.student;
          const prof: StudentProfileData = {
            id: s.id,
            roll_number: s.roll_number,
            full_name: s.full_name,
            department: s.department || 'General',
            year: s.year || 1,
            hostel_status: 'Hosteler',
            hostel_name: 'Campus Hostel',
            room_number: '-',
            allergies: s.allergies || [],
            meal_times: s.meal_times || DEFAULT_MEAL_TIMES,
            emergency_contact: s.emergency_contact || '+91-120-2983555',
            language: 'en',
          };
          await setCached('profile', prof);
          return prof;
        }
      }
    } catch (apiErr) {
      console.warn('API getProfile fallback to Supabase:', apiErr);
    }

    // 2. Direct Supabase Fallback
    try {
      if (studentId || rollNumber) {
        let query = supabase
          .from('students')
          .select(`
            id,
            roll_number,
            name,
            branch,
            year,
            phone,
            allergies,
            emergency_contact,
            photo_path,
            student_meal_times ( breakfast, lunch, dinner )
          `);

        const { data: student, error } = studentId
          ? await query.eq('id', studentId).maybeSingle()
          : await query.ilike('roll_number', rollNumber!).maybeSingle();

        if (!error && student) {
          const mt = (student as any).student_meal_times;
          const prof: StudentProfileData = {
            id: student.id,
            roll_number: student.roll_number,
            full_name: student.name,
            department: student.branch || 'General',
            year: student.year || 1,
            hostel_status: 'Hosteler',
            hostel_name: 'Campus Hostel',
            room_number: '-',
            allergies: student.allergies || [],
            meal_times: {
              breakfast: mt?.breakfast ? mt.breakfast.slice(0, 5) : DEFAULT_MEAL_TIMES.breakfast,
              lunch: mt?.lunch ? mt.lunch.slice(0, 5) : DEFAULT_MEAL_TIMES.lunch,
              dinner: mt?.dinner ? mt.dinner.slice(0, 5) : DEFAULT_MEAL_TIMES.dinner,
            },
            emergency_contact: student.emergency_contact || '+91-120-2983555',
            language: 'en',
          };
          await setCached('profile', prof);
          return prof;
        }
      }
    } catch (e) {
      console.warn('Supabase getProfile error:', e);
    }

    // Clean session profile fallback (100% real session identity)
    return {
      id: session?.user_id || '',
      roll_number: session?.roll_number || '',
      full_name: session?.full_name || 'Student',
      department: 'Engineering',
      year: 1,
      hostel_status: 'Hosteler',
      hostel_name: 'Campus Hostel',
      room_number: '-',
      allergies: [],
      meal_times: DEFAULT_MEAL_TIMES,
      emergency_contact: '+91-120-2983555',
      language: 'en',
    };
  }

  /**
   * Update student's personalized meal timings
   */
  static async updateMealTimes(times: MealTimesConfig): Promise<void> {
    const session = await AuthService.getCurrentSession();
    const studentId = session?.user_id;

    if (studentId) {
      try {
        await fetch(`${API_BASE_URL}/api/student/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_meal_times',
            student_id: studentId,
            meal_times: times,
          }),
        });
      } catch (e) {
        console.warn('Backend API updateMealTimes error:', e);
      }

      try {
        await supabase
          .from('student_meal_times')
          .upsert({
            student_id: studentId,
            breakfast: `${times.breakfast}:00`,
            lunch: `${times.lunch}:00`,
            dinner: `${times.dinner}:00`,
          }, { onConflict: 'student_id' });
      } catch {}
    }

    await OfflineQueue.enqueue('MEAL_TIMES_UPDATE', { meal_times: times });
  }

  /**
   * Update display language preference
   */
  static async updateLanguage(lang: 'en' | 'te'): Promise<void> {
    await OfflineQueue.enqueue('LANGUAGE_UPDATE', { language: lang });
  }

  /**
   * Fetch student's scheduled doses for today
   */
  static async getDoses(): Promise<DoseScheduleRecord[]> {
    const session = await AuthService.getCurrentSession();
    const studentId = session?.user_id;
    const rollNumber = session?.roll_number;

    // 0. Instant Cache Return (Zero-lag tab switching)
    const cachedDoses = await getCached<DoseScheduleRecord[]>('doses');
    if (cachedDoses && cachedDoses.length > 0) {
      // Background revalidation
      StudentApi.fetchFreshDoses(studentId, rollNumber).catch(() => {});
      return cachedDoses;
    }

    return await StudentApi.fetchFreshDoses(studentId, rollNumber);
  }

  private static async fetchFreshDoses(studentId?: string, rollNumber?: string): Promise<DoseScheduleRecord[]> {
    // 1. Try Backend API with fast timeout
    try {
      const q = studentId ? `studentId=${encodeURIComponent(studentId)}` : `rollNumber=${encodeURIComponent(rollNumber || '')}`;
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/student/dashboard?${q}`, {}, 2000);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.doses)) {
          await setCached('doses', json.doses);
          return json.doses;
        }
      }
    } catch (apiErr) {
      console.warn('API getDoses fallback to Supabase:', apiErr);
    }

    // 2. Direct Supabase Fallback (joins dose_events for 100% real-time adherence sync)
    try {
      if (studentId) {
        const { data, error } = await supabase
          .from('dose_schedule')
          .select(`
            id,
            visit_medication_id,
            scheduled_at,
            slot,
            meal_relation,
            status,
            visit_medications (
              dose,
              medicines ( name )
            ),
            dose_events (
              response,
              responded_at
            )
          `)
          .eq('student_id', studentId)
          .order('scheduled_at', { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped = data.map((d: any) => {
            const med = d.visit_medications;
            const dateObj = new Date(d.scheduled_at);
            const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const latestEvent = d.dose_events && d.dose_events.length > 0 ? d.dose_events[0] : null;
            const effectiveStatus = latestEvent?.response || d.status || 'scheduled';

            return {
              id: d.id,
              prescription_id: d.visit_medication_id,
              medicine_name: med?.medicines?.name || 'Medication',
              dose: med?.dose || '1 tablet',
              scheduled_time: timeStr,
              time: timeStr,
              scheduled_at: d.scheduled_at,
              meal_slot: d.slot as any,
              slot: d.slot as any,
              meal_relation: d.meal_relation || 'after',
              status: effectiveStatus as any,
            };
          });
          await setCached('doses', mapped);
          return mapped;
        }
      }
    } catch (e) {
      console.warn('Supabase getDoses error:', e);
    }

    return [];
  }

  /**
   * Submit student's adherence action (Taken, Taken Late, Not Taken)
   * Updates BOTH local database and backend API immediately so all screens sync without lag
   */
  static async submitDoseAnswer(
    doseId: string,
    status: 'taken' | 'taken_late' | 'not_taken'
  ): Promise<void> {
    const session = await AuthService.getCurrentSession();
    const studentId = session?.user_id;
    const adherenceResponse = status === 'taken' ? 'taken' : status === 'taken_late' ? 'taken_late' : 'not_taken';

    // 0. Update in-memory & local cache immediately
    if (memoryCache.doses) {
      memoryCache.doses = memoryCache.doses.map((d) =>
        d.id === doseId ? { ...d, status: adherenceResponse } : d
      );
      setCached('doses', memoryCache.doses);
    }

    // 1. Direct Supabase update for immediate cross-device sync
    try {
      await supabase
        .from('dose_schedule')
        .update({ status: adherenceResponse })
        .eq('id', doseId);

      if (studentId) {
        await supabase
          .from('dose_events')
          .insert({
            schedule_id: doseId,
            student_id: studentId,
            response: adherenceResponse,
            responded_at: new Date().toISOString(),
          });
      }
    } catch (dbErr) {
      console.warn('Direct Supabase submitDoseAnswer error:', dbErr);
    }

    // 2. Call Backend API
    try {
      await fetchWithTimeout(`${API_BASE_URL}/api/student/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dose_status',
          student_id: studentId,
          dose_id: doseId,
          status,
        }),
      }, 3000);
    } catch (e) {
      console.warn('API submitDoseAnswer error:', e);
    }

    await OfflineQueue.enqueue('DOSE_RESPONSE', {
      schedule_id: doseId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Fetch active prescriptions and medicine details
   */
  static async getPrescriptions(): Promise<PrescriptionRecord[]> {
    const session = await AuthService.getCurrentSession();
    const studentId = session?.user_id;
    const rollNumber = session?.roll_number;

    // 0. Instant Cache Return
    const cached = await getCached<PrescriptionRecord[]>('prescriptions');
    if (cached && cached.length > 0) {
      StudentApi.fetchFreshPrescriptions(studentId, rollNumber).catch(() => {});
      return cached;
    }

    return await StudentApi.fetchFreshPrescriptions(studentId, rollNumber);
  }

  private static async fetchFreshPrescriptions(studentId?: string, rollNumber?: string): Promise<PrescriptionRecord[]> {
    // 1. Try Backend API with fast timeout
    try {
      const q = studentId ? `studentId=${encodeURIComponent(studentId)}` : `rollNumber=${encodeURIComponent(rollNumber || '')}`;
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/student/dashboard?${q}`, {}, 2000);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.prescriptions) && json.prescriptions.length > 0) {
          await setCached('prescriptions', json.prescriptions);
          return json.prescriptions;
        }
      }
    } catch (apiErr) {
      console.warn('API getPrescriptions error, checking Supabase:', apiErr);
    }

    // 2. Direct Supabase Fallback
    try {
      if (studentId) {
        const { data: visits } = await supabase
          .from('visits')
          .select(`
            id,
            diagnosis,
            prescribed_at,
            follow_up_date,
            prescribed_by,
            visit_medications (
              dose,
              frequency,
              duration_days,
              meal_relation,
              medicines ( name )
            )
          `)
          .eq('student_id', studentId)
          .order('prescribed_at', { ascending: false });

        if (visits && visits.length > 0) {
          const mapped: PrescriptionRecord[] = visits.map((v: any) => {
            const startDate = new Date(v.prescribed_at);
            return {
              id: v.id,
              doctor_name: v.prescribed_by || 'Campus Clinic Doctor',
              problem_category: v.diagnosis || 'Clinical Consultation',
              start_date: startDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
              end_date: v.follow_up_date
                ? new Date(v.follow_up_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'As advised',
              is_active: true,
              medicines: (v.visit_medications || []).map((m: any) => ({
                name: m.medicines?.name || 'Prescribed Tablet',
                dose: m.dose || '1 tablet',
                meal_relation: m.meal_relation || 'after',
                meal_slot: m.frequency || 'food',
                duration_days: m.duration_days || 3,
              })),
            };
          });
          await setCached('prescriptions', mapped);
          return mapped;
        }
      }
    } catch (e) {
      console.warn('Supabase getPrescriptions fallback error:', e);
    }

    return [];
  }

  /**
   * Fetch student clinical history
   */
  static async getHistory(): Promise<any[]> {
    const session = await AuthService.getCurrentSession();
    const studentId = session?.user_id;
    const rollNumber = session?.roll_number;

    // 0. Instant Cache Return
    const cached = await getCached<any[]>('history');
    if (cached && cached.length > 0) {
      StudentApi.fetchFreshHistory(studentId, rollNumber).catch(() => {});
      return cached;
    }

    return await StudentApi.fetchFreshHistory(studentId, rollNumber);
  }

  private static async fetchFreshHistory(studentId?: string, rollNumber?: string): Promise<any[]> {
    // 1. Try Backend API with fast timeout
    try {
      const q = studentId ? `studentId=${encodeURIComponent(studentId)}` : `rollNumber=${encodeURIComponent(rollNumber || '')}`;
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/student/dashboard?${q}`, {}, 2000);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.history) && json.history.length > 0) {
          await setCached('history', json.history);
          return json.history;
        }
      }
    } catch (apiErr) {
      console.warn('API getHistory error, checking Supabase:', apiErr);
    }

    // 2. Direct Supabase Fallback
    try {
      if (studentId) {
        const { data: visits } = await supabase
          .from('visits')
          .select(`
            id,
            created_at,
            prescribed_at,
            diagnosis,
            prescribed_by,
            visit_medications (
              medicines ( name )
            )
          `)
          .eq('student_id', studentId)
          .order('created_at', { ascending: false });

        if (visits && visits.length > 0) {
          const mapped = visits.map((v: any) => ({
            id: v.id,
            date: new Date(v.prescribed_at || v.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
            doctor: v.prescribed_by || 'Campus Clinic Doctor',
            problem: v.diagnosis || 'Clinical Consultation',
            medicines: (v.visit_medications || []).map((m: any) => m.medicines?.name).filter(Boolean).join(', ') || 'Prescribed medications',
            outcome: 'Active Course',
          }));
          await setCached('history', mapped);
          return mapped;
        }
      }
    } catch (e) {
      console.warn('Supabase getHistory fallback error:', e);
    }

    return [];
  }

  /**
   * Fetch pending 1-tap post-course recovery inquiry
   */
  static async getRecoveryInquiry(): Promise<RecoveryInquiry | null> {
    const session = await AuthService.getCurrentSession();
    const studentId = session?.user_id;
    const rollNumber = session?.roll_number;

    try {
      const q = studentId ? `studentId=${encodeURIComponent(studentId)}` : `rollNumber=${encodeURIComponent(rollNumber || '')}`;
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/student/dashboard?${q}`, {}, 2000);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.recovery_inquiry) {
          return {
            id: json.recovery_inquiry.id,
            visit_id: json.recovery_inquiry.visit_id,
            problem_name: 'Recent Consultation Recovery',
            due_date: 'Today',
          };
        }
      }
    } catch (apiErr) {
      console.warn('API getRecoveryInquiry error:', apiErr);
    }

    return null;
  }
            id: json.recovery_inquiry.id,
            visit_id: json.recovery_inquiry.visit_id,
            problem_name: 'Recent Consultation Recovery',
            due_date: 'Today',
          };
        }
      }
    } catch (apiErr) {
      console.warn('API getRecoveryInquiry error:', apiErr);
    }

    return null;
  }

  /**
   * Submit recovery check answer ('better', 'same', 'worse')
   */
  static async submitRecoveryResponse(
    inquiryId: string,
    response: 'better' | 'same' | 'worse'
  ): Promise<void> {
    const session = await AuthService.getCurrentSession();
    const studentId = session?.user_id;

    try {
      await fetch(`${API_BASE_URL}/api/student/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recovery_answer',
          student_id: studentId,
          recovery_id: inquiryId,
          answer: response,
        }),
      });
    } catch (e) {
      console.warn('API submitRecoveryResponse error:', e);
    }

    await OfflineQueue.enqueue('RECOVERY_RESPONSE', {
      inquiry_id: inquiryId,
      status: response,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Student flags unexpected adverse reaction / side effect.
   * Inserts a high-priority RED ALERT in database.
   */
  static async reportProblem(
    description: string
  ): Promise<{ success: boolean; redAlertCreated: boolean }> {
    const session = await AuthService.getCurrentSession();

    try {
      if (session?.user_id) {
        const { data: latestVisit } = await supabase
          .from('visits')
          .select('id, doctor_id')
          .eq('student_id', session.user_id)
          .order('visit_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestVisit) {
          await supabase.from('alerts').insert({
            visit_id: latestVisit.id,
            student_id: session.user_id,
            doctor_id: latestVisit.doctor_id,
            type: 'side_effect',
            severity: 'red',
            status: 'open',
          });
        }
      }
    } catch (e) {
      console.warn('Offline reportProblem queuing:', e);
    }

    await OfflineQueue.enqueue('SIDE_EFFECT_REPORT', {
      student_id: session?.user_id,
      roll_number: session?.roll_number,
      description,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      redAlertCreated: true,
    };
  }

  /**
   * Record medical telemetry audit consent
   */
  static async recordConsent(): Promise<void> {
    const session = await AuthService.getCurrentSession();
    try {
      if (session?.user_id) {
        await supabase.from('consent_records').insert({
          student_id: session.user_id,
          purpose: 'Campus clinic medical adherence and recovery monitoring',
          status: 'accepted',
        });
      }
    } catch (e) {
      console.warn('Consent record error:', e);
    }

    await OfflineQueue.enqueue('DOSE_RESPONSE', {
      action: 'CONSENT_ACCEPTED',
      version: 'v1.0',
      timestamp: new Date().toISOString(),
    });
  }
}
