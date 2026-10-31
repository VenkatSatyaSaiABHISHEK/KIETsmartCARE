import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key);
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

const SESSION_KEY = 'kiet_student_session';

export async function getSecureSession(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SESSION_KEY);
  } catch {
    return null;
  }
}

export async function setSecureSession(sessionJson: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(SESSION_KEY, sessionJson);
  } catch (err) {
    console.warn('SecureStore error saving session:', err);
  }
}

export async function clearSecureSession(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  } catch (err) {
    console.warn('SecureStore error deleting session:', err);
  }
}

/**
 * Register the Expo push token in the devices table at login
 */
export async function registerDevicePushToken(studentId: string, pushToken: string): Promise<void> {
  console.log(`[PUSH REGISTRATION] Registering device push token for student ${studentId}: ${pushToken} (${Platform.OS})`);
  // Will be backed by real Supabase insert in Prompt 6:
  // await supabase.from('devices').upsert({ student_id: studentId, push_token: pushToken, platform: Platform.OS });
}
