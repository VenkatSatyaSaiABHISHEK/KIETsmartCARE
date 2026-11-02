import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

// Universal storage adapter: localStorage on Web, SecureStore on Mobile
const UniversalStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (isWeb) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
      } catch {
        return null;
      }
      return null;
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (isWeb) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } catch {}
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      console.warn('SecureStore setItem failed:', e);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (isWeb) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } catch {}
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.warn('SecureStore deleteItem failed:', e);
    }
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient<any>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: UniversalStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

const SESSION_KEY = 'kiet_student_session';

export async function getSecureSession(): Promise<string | null> {
  return UniversalStorageAdapter.getItem(SESSION_KEY);
}

export async function setSecureSession(sessionJson: string): Promise<void> {
  await UniversalStorageAdapter.setItem(SESSION_KEY, sessionJson);
}

export async function clearSecureSession(): Promise<void> {
  await UniversalStorageAdapter.removeItem(SESSION_KEY);
}

/**
 * Register the Expo push token in the devices table at login
 */
export async function registerDevicePushToken(studentId: string, pushToken: string): Promise<void> {
  if (!studentId || !pushToken) return;

  try {
    const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'web' ? 'web' : 'android';
    await supabase.from('devices').upsert({
      student_id: studentId,
      expo_push_token: pushToken,
      platform,
    }, { onConflict: 'student_id,expo_push_token' });
  } catch (err) {
    console.warn('[PUSH REGISTRATION] Device token upsert error:', err);
  }
}
