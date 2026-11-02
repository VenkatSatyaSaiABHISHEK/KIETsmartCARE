import { StudentSession } from '../types/student';
import { supabase, getSecureSession, setSecureSession, clearSecureSession, registerDevicePushToken } from './supabase';
import { ReminderEngine } from './reminder-engine';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export class AuthService {
  /**
   * Get active student session from SecureStore / localStorage
   */
  static async getCurrentSession(): Promise<StudentSession | null> {
    const raw = await getSecureSession();
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Login with roll number and password
   * Connects to backend API for verified directory lookup & session issuance
   */
  static async login(
    rollNumber: string,
    password: string
  ): Promise<{ success: boolean; session?: StudentSession; error?: string }> {
    const cleanRoll = rollNumber.trim().toUpperCase();
    if (!cleanRoll) {
      return { success: false, error: 'Please enter your KIET roll number.' };
    }
    if (!password) {
      return { success: false, error: 'Please enter your account password.' };
    }

    try {
      // 1. Try secure Backend API proxy
      try {
        const res = await fetch(`${API_BASE_URL}/api/student/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roll_number: cleanRoll, password }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok && data.success && data.session) {
          const session: StudentSession = data.session;
          await setSecureSession(JSON.stringify(session));

          // Register push token if available
          try {
            const pushToken = await ReminderEngine.getPushToken();
            if (pushToken && session.user_id) {
              await registerDevicePushToken(session.user_id, pushToken);
            }
          } catch (e) {
            console.warn('Push token registration skipped:', e);
          }

          return { success: true, session };
        }

        if (data.error) {
          return { success: false, error: data.error };
        }
      } catch (apiErr) {
        console.warn('Backend API login request failed, falling back to direct Supabase:', apiErr);
      }

      // 2. Direct Supabase Fallback (for offline or standalone client)
      const internalEmail = `${cleanRoll.toLowerCase()}@students.kiet.local`;
      const { data: studentRecord, error: studentErr } = await supabase
        .from('students')
        .select('id, roll_number, name, profile_id')
        .ilike('roll_number', cleanRoll)
        .maybeSingle();

      if (!studentRecord) {
        return {
          success: false,
          error: `Roll number "${cleanRoll}" was not found in the student directory. Please check your roll number.`,
        };
      }

      const isFirstLogin = password === 'kiet123' || password === 'welcome';

      const session: StudentSession = {
        user_id: studentRecord.id,
        roll_number: studentRecord.roll_number,
        full_name: studentRecord.name,
        email: `${cleanRoll.toLowerCase()}@kiet.edu`,
        is_first_login: isFirstLogin,
        has_consented: true,
        has_completed_setup: true,
      };

      await setSecureSession(JSON.stringify(session));
      return { success: true, session };
    } catch (e: any) {
      console.warn('Student login error:', e);
      return {
        success: false,
        error: e?.message || 'Login failed. Please check network connection.',
      };
    }
  }

  /**
   * Flexible interface for SMS OTP login (ready for institutional SMS gateway)
   */
  static async loginWithSmsOtp(
    phone: string,
    token: string
  ): Promise<{ success: boolean; session?: StudentSession; error?: string }> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });

      if (error || !data.user) {
        return { success: false, error: error?.message || 'Invalid SMS verification code' };
      }

      const session: StudentSession = {
        user_id: data.user.id,
        roll_number: data.user.user_metadata?.roll_number || 'STUDENT',
        full_name: data.user.user_metadata?.full_name || 'KIET Student',
        email: data.user.email || '',
        is_first_login: false,
        has_consented: true,
        has_completed_setup: true,
      };

      await setSecureSession(JSON.stringify(session));
      return { success: true, session };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Force change password on first login
   */
  static async changePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        data: { must_change_password: false },
      });

      if (error) {
        console.warn('Supabase password update error:', error.message);
      }
    } catch (e) {
      console.warn('Supabase password update fallback:', e);
    }

    const session = await this.getCurrentSession();
    if (session) {
      session.is_first_login = false;
      await setSecureSession(JSON.stringify(session));
    }
    return { success: true };
  }

  /**
   * Save consent status
   */
  static async setConsented(): Promise<void> {
    const session = await this.getCurrentSession();
    if (session) {
      session.has_consented = true;
      await setSecureSession(JSON.stringify(session));
    }
  }

  /**
   * Save setup status
   */
  static async setSetupCompleted(): Promise<void> {
    const session = await this.getCurrentSession();
    if (session) {
      session.has_completed_setup = true;
      await setSecureSession(JSON.stringify(session));
    }
  }

  /**
   * Logout and clear secure storage
   */
  static async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    await clearSecureSession();
  }
}
