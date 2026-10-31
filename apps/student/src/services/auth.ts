import { StudentSession } from '../types/student';
import { getSecureSession, setSecureSession, clearSecureSession, registerDevicePushToken } from './supabase';
import { ReminderEngine } from './reminder-engine';

export class AuthService {
  /**
   * Get active student session from SecureStore
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
   */
  static async login(rollNumber: string, password: string): Promise<{ success: boolean; session?: StudentSession; error?: string }> {
    const cleanRoll = rollNumber.trim();
    if (!cleanRoll) {
      return { success: false, error: 'Please enter your KIET roll number.' };
    }
    if (!password) {
      return { success: false, error: 'Please enter your account password.' };
    }

    // Default first password simulation: if password is "kiet123", force change on first login!
    const isFirstTime = password === 'kiet123' || password === 'welcome';

    const session: StudentSession = {
      user_id: 'std-001',
      roll_number: cleanRoll,
      full_name: 'Aarav Sharma',
      email: `${cleanRoll}@kiet.edu`,
      is_first_login: isFirstTime,
      has_consented: !isFirstTime,
      has_completed_setup: !isFirstTime,
    };

    await setSecureSession(JSON.stringify(session));

    // Register push token
    try {
      const pushToken = await ReminderEngine.getPushToken();
      if (pushToken) {
        await registerDevicePushToken(session.user_id, pushToken);
      }
    } catch (e) {
      console.warn('Push token registration skipped:', e);
    }

    return { success: true, session };
  }

  /**
   * Force change password on first login
   */
  static async changePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
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
    await clearSecureSession();
  }
}
