import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { Asset } from 'expo-asset';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import { CHIME_BASE64_MP3 } from '../constants/chime-audio-base64';

let soundObject: Audio.Sound | null = null;
let audioContext: AudioContext | null = null;
let alarmLoopInterval: any = null;
let currentHtmlAudio: HTMLAudioElement | null = null;
let isRinging = false;
let cachedAudioFileUri: string | null = null;

/**
 * Resolves a 100% reliable local file URI on Android/iOS.
 * Writes the embedded base64 MP3 to device cache storage, ensuring zero dependency on network or bundler asset bugs.
 */
async function resolveSoundUri(): Promise<string> {
  if (Platform.OS !== 'web') {
    if (cachedAudioFileUri) return cachedAudioFileUri;
    try {
      const targetPath = `${FileSystem.cacheDirectory}chime_reminder.mp3`;
      const info = await FileSystem.getInfoAsync(targetPath);
      if (!info.exists || info.size === 0) {
        await FileSystem.writeAsStringAsync(targetPath, CHIME_BASE64_MP3, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }
      cachedAudioFileUri = targetPath;
      return targetPath;
    } catch (err) {
      console.warn('[SOUND PLAYER] Failed writing local cache sound:', err);
      return `data:audio/mp3;base64,${CHIME_BASE64_MP3}`;
    }
  }
  return `data:audio/mp3;base64,${CHIME_BASE64_MP3}`;
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
 * Play a single chime pulse (used in preview & repeating in real alarm)
 */
export async function playAlarmChime(): Promise<void> {
  // Always trigger physical haptic feedback immediately
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}

  // --- NATIVE PLATFORM (ANDROID / IOS) ---
  if (Platform.OS !== 'web') {
    try {
      await configureAudioMode();

      // Stop previous instance if exists
      if (soundObject) {
        try {
          await soundObject.stopAsync();
          await soundObject.unloadAsync();
        } catch {}
        soundObject = null;
      }

      const fileUri = await resolveSoundUri();

      const { sound } = await Audio.Sound.createAsync(
        { uri: fileUri },
        { shouldPlay: true, isLooping: false, volume: 1.0 }
      );
      soundObject = sound;
      await soundObject.setVolumeAsync(1.0);
      await soundObject.playAsync();
      return;
    } catch (err) {
      console.warn('[SOUND PLAYER] Native sound playback failed with cached file, trying require fallback:', err);
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/chime_reminder.mp3'),
          { shouldPlay: true, isLooping: false, volume: 1.0 }
        );
        soundObject = sound;
        await soundObject.setVolumeAsync(1.0);
        await soundObject.playAsync();
        return;
      } catch (fbErr) {
        console.warn('[SOUND PLAYER] All native audio playbacks failed:', fbErr);
      }
    }
    return;
  }

  // --- WEB PLATFORM ---
  // 1. Try playing custom sound asset
  try {
    if (!currentHtmlAudio) {
      currentHtmlAudio = new Audio('/sounds/chime_reminder.wav');
    }
    currentHtmlAudio.currentTime = 0;
    currentHtmlAudio.volume = 1.0;
    const playPromise = currentHtmlAudio.play();
    if (playPromise !== undefined) {
      await playPromise;
      return;
    }
  } catch {
    // Fallback to Web Audio synthesizer
  }

  // 2. Synthesize crystal-clear harmonic medical bell chime (E5 -> G#5 -> B5)
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

    // Medical Chime Sequence: 3 rising tones + 2 chord pulses
    playChimeTone(659.25, 0.0, 0.7, 0.5);  // E5
    playChimeTone(830.61, 0.22, 0.7, 0.5); // G#5
    playChimeTone(987.77, 0.45, 1.1, 0.55); // B5

    // Gentle repeat echo
    playChimeTone(659.25, 0.9, 0.5, 0.35);
    playChimeTone(987.77, 1.1, 1.1, 0.4);
  } catch (synthErr) {
    console.warn('[SOUND PLAYER] Synthesizer error:', synthErr);
  }
}

/**
 * Start REAL ALARM: continuous non-stop ringing until dismissed or taken!
 */
export async function startContinuousAlarm(): Promise<void> {
  if (isRinging) return;
  isRinging = true;

  // On Native, play looping audio directly
  if (Platform.OS !== 'web') {
    try {
      await configureAudioMode();
      if (soundObject) {
        try {
          await soundObject.stopAsync();
          await soundObject.unloadAsync();
        } catch {}
      }

      const fileUri = await resolveSoundUri();

      const { sound } = await Audio.Sound.createAsync(
        { uri: fileUri },
        { shouldPlay: true, isLooping: true, volume: 1.0 }
      );
      soundObject = sound;
      await soundObject.setIsLoopingAsync(true);
      await soundObject.setVolumeAsync(1.0);
      await soundObject.playAsync();
      return;
    } catch (e) {
      console.warn('[SOUND PLAYER] Native continuous alarm error:', e);
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/chime_reminder.mp3'),
          { shouldPlay: true, isLooping: true, volume: 1.0 }
        );
        soundObject = sound;
        await soundObject.setIsLoopingAsync(true);
        await soundObject.setVolumeAsync(1.0);
        await soundObject.playAsync();
        return;
      } catch {}
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
  }, 1800);
}

/**
 * Stop alarm immediately (silence ringing)
 */
export async function stopAlarm(): Promise<void> {
  isRinging = false;

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
      // Test 1 quick pulse so native audio engine initializes
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
