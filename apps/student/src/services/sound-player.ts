import { Platform } from 'react-native';

let audioContext: AudioContext | null = null;
let alarmLoopInterval: any = null;
let currentHtmlAudio: HTMLAudioElement | null = null;
let isRinging = false;

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
 * Play a single chime pulse (used in preview & repeating in real alarm)
 */
export async function playAlarmChime(): Promise<void> {
  if (Platform.OS !== 'web') return;

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

    const playChimeTone = (freq: number, startOffset: number, duration: number, gainLevel = 0.4) => {
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
    playChimeTone(659.25, 0.0, 0.7, 0.4);  // E5
    playChimeTone(830.61, 0.22, 0.7, 0.4); // G#5
    playChimeTone(987.77, 0.45, 1.1, 0.45); // B5

    // Gentle repeat echo
    playChimeTone(659.25, 0.9, 0.5, 0.3);
    playChimeTone(987.77, 1.1, 1.1, 0.35);
  } catch (synthErr) {
    console.warn('[SOUND PLAYER] Synthesizer error:', synthErr);
  }
}

/**
 * Start REAL ALARM: continuous non-stop ringing until dismissed or taken!
 */
export function startContinuousAlarm(): void {
  if (isRinging) return;
  isRinging = true;

  // Fire first chime immediately
  playAlarmChime();

  // Show system notification if browser permits
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification('KIET Smart Care \u2014 Medicine Time!', {
        body: 'Your scheduled medicine dose is due now. Please take your medicine.',
        icon: '/favicon.ico',
        requireInteraction: true,
      });
    } catch {}
  }

  // Loop every 1.8 seconds continuously like a real alarm clock
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
export function stopAlarm(): void {
  isRinging = false;
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
 * Request notification permissions and unlock AudioContext on user interaction
 */
export async function enableAudioAndNotifications(): Promise<boolean> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
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
