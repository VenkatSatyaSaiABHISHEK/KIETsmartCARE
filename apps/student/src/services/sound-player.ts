import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SoundTheme = 'chime' | 'bell' | 'voice';

export interface SoundOption {
  id: SoundTheme;
  title: string;
  subtitle: string;
  icon: string;
  nativeAsset: any;
  webUrl: string;
}

export const SOUND_OPTIONS: SoundOption[] = [
  {
    id: 'chime',
    title: 'Crystal Medical Chime',
    subtitle: 'Crisp, pleasant rising tone (Default medical grade chime)',
    icon: 'Sparkles',
    nativeAsset: require('../../assets/sounds/chime_reminder.wav'),
    webUrl: '/sounds/chime_reminder.mp3',
  },
  {
    id: 'bell',
    title: 'Gentle Hospital Bell',
    subtitle: 'Calm harmonic bell with soothing resonance',
    icon: 'Bell',
    nativeAsset: require('../../assets/sounds/gentle_bell.wav'),
    webUrl: '/sounds/gentle_bell.mp3',
  },
  {
    id: 'voice',
    title: 'Voice Dose Alert',
    subtitle: 'Direct spoken prompt: "Student, time for your medicine"',
    icon: 'Mic',
    nativeAsset: require('../../assets/sounds/voice_dose_reminder.wav'),
    webUrl: '/sounds/voice_dose_reminder.mp3',
  },
];

const SOUND_PREF_KEY = '@kiet_selected_sound_theme';

let currentTheme: SoundTheme = 'chime';
let soundObject: Audio.Sound | null = null;
let previewSoundObject: Audio.Sound | null = null;
let audioContext: AudioContext | null = null;
let alarmLoopInterval: any = null;
let currentHtmlAudio: HTMLAudioElement | null = null;
let isRinging = false;

// Initialize saved sound theme from storage
AsyncStorage.getItem(SOUND_PREF_KEY).then((saved) => {
  if (saved && (saved === 'chime' || saved === 'bell' || saved === 'voice')) {
    currentTheme = saved as SoundTheme;
  }
}).catch(() => {});

export async function setSelectedSoundTheme(theme: SoundTheme): Promise<void> {
  currentTheme = theme;
  try {
    await AsyncStorage.setItem(SOUND_PREF_KEY, theme);
  } catch {}
}

export function getSelectedSoundTheme(): SoundTheme {
  return currentTheme;
}

function getAudioContext(): AudioContext | null {
  if (Platform.OS !== 'web') return null;
  if (typeof window === 'undefined') return null;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioContext || audioContext.state === 'closed') {
      audioContext = new AudioCtx();
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    return audioContext;
  } catch {
    return null;
  }
}

/**
 * Configure audio mode to ensure sound plays even if device is on silent/ringer switch off
 */
async function configureAudioMode(): Promise<void> {
  if (Platform.OS !== 'web') {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });
    } catch (e) {
      console.warn('[SOUND PLAYER] Failed to set audio mode:', e);
    }
  }
}

/**
 * Preview a specific sound theme in Sound Lab
 */
export async function previewSound(theme: SoundTheme): Promise<void> {
  await stopPreviewSound();
  const option = SOUND_OPTIONS.find((s) => s.id === theme) || SOUND_OPTIONS[0];

  if (Platform.OS !== 'web') {
    try {
      await configureAudioMode();
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const { sound } = await Audio.Sound.createAsync(
        option.nativeAsset,
        { shouldPlay: true, isLooping: false, volume: 1.0 }
      );
      previewSoundObject = sound;
      await previewSoundObject.playAsync();
      return;
    } catch (err) {
      console.warn('[SOUND PLAYER] Preview sound failed:', err);
    }
    return;
  }

  // Web preview
  try {
    if (typeof window !== 'undefined' && (window as any).Audio) {
      const a = new (window as any).Audio(option.webUrl);
      a.volume = 1.0;
      a.play().catch(() => playAlarmChime());
    }
  } catch {
    playAlarmChime();
  }
}

export async function stopPreviewSound(): Promise<void> {
  if (previewSoundObject) {
    try {
      await previewSoundObject.stopAsync();
      await previewSoundObject.unloadAsync();
    } catch {}
    previewSoundObject = null;
  }
}

/**
 * Play a single pulse of the active sound theme
 */
export async function playAlarmChime(): Promise<void> {
  if (Platform.OS !== 'web') {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  }

  const option = SOUND_OPTIONS.find((s) => s.id === currentTheme) || SOUND_OPTIONS[0];

  // --- NATIVE PLATFORM ---
  if (Platform.OS !== 'web') {
    try {
      await configureAudioMode();

      if (soundObject) {
        try {
          await soundObject.stopAsync();
          await soundObject.unloadAsync();
        } catch {}
        soundObject = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        option.nativeAsset,
        { shouldPlay: true, isLooping: false, volume: 1.0 }
      );
      soundObject = sound;
      await soundObject.setVolumeAsync(1.0);
      await soundObject.playAsync();
      return;
    } catch (err) {
      console.warn('[SOUND PLAYER] Native sound playback failed:', err);
    }
    return;
  }

  // --- WEB PLATFORM ---
  try {
    if (typeof window !== 'undefined') {
      if (!currentHtmlAudio && (window as any).Audio) {
        currentHtmlAudio = new (window as any).Audio(option.webUrl);
      }
      if (currentHtmlAudio) {
        currentHtmlAudio.currentTime = 0;
        currentHtmlAudio.volume = 1.0;
        const playPromise = currentHtmlAudio.play();
        if (playPromise !== undefined) {
          await playPromise;
          return;
        }
      }
    }
  } catch {}

  // Synthesizer fallback
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const playChimeTone = (freq: number, startOffset: number, duration: number, gainLevel = 0.5) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + startOffset);
      gain.gain.setValueAtTime(0.0001, now + startOffset);
      gain.gain.exponentialRampToValueAtTime(gainLevel, now + startOffset + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration);
    };

    playChimeTone(659.25, 0.0, 0.7, 0.5);
    playChimeTone(830.61, 0.22, 0.7, 0.5);
    playChimeTone(987.77, 0.45, 1.1, 0.55);
  } catch {}
}

/**
 * Start continuous looping alarm for medicine takeover
 */
export async function startContinuousAlarm(): Promise<void> {
  if (isRinging) return;
  isRinging = true;

  const option = SOUND_OPTIONS.find((s) => s.id === currentTheme) || SOUND_OPTIONS[0];

  if (Platform.OS !== 'web') {
    try {
      await configureAudioMode();
      if (soundObject) {
        try {
          await soundObject.stopAsync();
          await soundObject.unloadAsync();
        } catch {}
        soundObject = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        option.nativeAsset,
        { shouldPlay: true, isLooping: true, volume: 1.0 }
      );
      soundObject = sound;
      await soundObject.setIsLoopingAsync(true);
      await soundObject.setVolumeAsync(1.0);
      await soundObject.playAsync();
      return;
    } catch (e) {
      console.warn('[SOUND PLAYER] Continuous alarm error:', e);
    }
  }

  // Web fallback with interval
  playAlarmChime();

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification('KIET Smart Care • Medicine Time!', {
        body: 'Your scheduled medicine dose is due now. Please take your medicine.',
        icon: '/favicon.ico',
        requireInteraction: true,
      });
    } catch {}
  }

  if (alarmLoopInterval) clearInterval(alarmLoopInterval);
  alarmLoopInterval = setInterval(() => {
    if (!isRinging) {
      clearInterval(alarmLoopInterval);
      alarmLoopInterval = null;
      return;
    }
    playAlarmChime();
  }, 2200);
}

/**
 * Stop alarm immediately
 */
export async function stopAlarm(): Promise<void> {
  isRinging = false;

  await stopPreviewSound();

  if (soundObject) {
    try {
      await soundObject.stopAsync();
      await soundObject.unloadAsync();
    } catch {}
    soundObject = null;
  }

  if (alarmLoopInterval) {
    clearInterval(alarmLoopInterval);
    alarmLoopInterval = null;
  }

  if (currentHtmlAudio) {
    try {
      currentHtmlAudio.pause();
      currentHtmlAudio.currentTime = 0;
    } catch {}
  }
}

export function isAlarmRinging(): boolean {
  return isRinging;
}

/**
 * Request audio and notification permissions and unlock AudioContext
 */
export async function enableAudioAndNotifications(): Promise<boolean> {
  if (Platform.OS !== 'web') {
    try {
      await configureAudioMode();
      playAlarmChime();
      return true;
    } catch {
      return false;
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume();
      }

      if ('Notification' in window && Notification.permission !== 'granted') {
        await Notification.requestPermission();
      }

      return true;
    } catch {
      return false;
    }
  }
  return true;
}
