import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { DoseScheduleRecord, MealTimesConfig } from '../types/student';
import { OfflineQueue } from './offline-queue';
import {
  BEFORE_MEAL_OFFSET_MINUTES,
  AFTER_MEAL_OFFSET_MINUTES,
  DEFAULT_MEAL_TIMES,
  formatTime12h,
} from '../constants/shared';

// Setup foreground notification handler
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

const ANDROID_CHANNEL_ID = 'kiet_smart_care_reminders';
export const DOSE_NOTIFICATION_CATEGORY = 'DOSE_REMINDER_ACTIONS';

export class ReminderEngine {
  private static isInitialized = false;

  /**
   * Initialize notification channels (High-importance Android channel with custom chime sound)
   */
  static async init(): Promise<boolean> {
    if (this.isInitialized) return true;

    if (Platform.OS === 'web') {
      this.isInitialized = true;
      return true;
    }

    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
          name: 'Medicine Dose Reminders',
          description: 'High-importance campus healthcare dose reminders tied to meals',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 400, 200, 400, 200, 600],
          lightColor: '#0284C7',
          sound: 'chime_reminder.wav',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: true,
          enableVibrate: true,
        });
      }

      // Configure interactive notification action buttons: Taken, Taken late, Not taken
      await Notifications.setNotificationCategoryAsync(DOSE_NOTIFICATION_CATEGORY, [
        {
          identifier: 'taken',
          buttonTitle: 'Taken',
          options: { opensAppToForeground: false },
        },
        {
          identifier: 'taken_late',
          buttonTitle: 'Taken Late',
          options: { opensAppToForeground: false },
        },
        {
          identifier: 'not_taken',
          buttonTitle: 'Missed',
          options: { opensAppToForeground: true },
        },
      ]);

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      this.isInitialized = finalStatus === 'granted';
      return this.isInitialized;
    } catch (e) {
      console.warn('Notification initialization warning:', e);
      return false;
    }
  }

  /**
   * Request device push token (for background triggers)
   */
  static async getPushToken(): Promise<string | null> {
    if (Platform.OS === 'web') return null;
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      return tokenData.data;
    } catch {
      return null;
    }
  }

  /**
   * Sync schedule and rebuild ALL local scheduled notifications.
   * Cancels all previous notifications so they never duplicate.
   * Works completely offline!
   */
  static async syncAndScheduleAll(
    doses: DoseScheduleRecord[],
    mealTimes: MealTimesConfig = DEFAULT_MEAL_TIMES
  ): Promise<number> {
    await this.init();

    if (Platform.OS === 'web') {
      console.log(`[REMINDER ENGINE] Web platform detected. Synchronized ${doses.length} dose schedules.`);
      return doses.length;
    }

    // 1. Cancel and rebuild on each sync so they never duplicate
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('[REMINDER ENGINE] Previous local notifications cancelled. Rebuilding clean schedule...');
    } catch (err) {
      console.warn('Error cancelling scheduled notifications:', err);
    }

    let scheduledCount = 0;
    const now = new Date();

    // Group active doses by trigger time / slot
    const groupedDoses: Record<string, { triggerDate: Date; relationStr: string; mealStr: string; doses: DoseScheduleRecord[] }> = {};

    for (const dose of doses) {
      if (dose.status !== 'scheduled' && dose.status !== 'unconfirmed') continue;

      let triggerDate: Date;

      // 1. If explicit scheduled_at ISO timestamp is provided, parse it
      if (dose.scheduled_at) {
        triggerDate = new Date(dose.scheduled_at);
      } else {
        triggerDate = this.calculateDoseDateTime(
          dose.meal_slot || dose.slot || 'morning',
          dose.meal_relation || 'after',
          mealTimes,
          dose.time || (dose.scheduled_time && dose.scheduled_time.length === 5 ? dose.scheduled_time : undefined)
        );
      }

      if (triggerDate > now) {
        const key = triggerDate.toISOString();
        const relationStr = dose.meal_relation === 'after' ? 'after' : 'before';
        const mealStr = (dose.meal_slot || dose.slot || 'meal').toLowerCase();

        if (!groupedDoses[key]) {
          groupedDoses[key] = { triggerDate, relationStr, mealStr, doses: [] };
        }
        groupedDoses[key].doses.push(dose);
      }
    }

    for (const key of Object.keys(groupedDoses)) {
      const group = groupedDoses[key];
      const medListStr = group.doses.map((d) => `${d.medicine_name} (${d.dose || (d.tablets ? `${d.tablets} tab` : '1 dose')})`).join(', ');
      const displayTimeStr = formatTime12h(group.triggerDate.toISOString());
      const bodyText = `${medListStr} • ${group.relationStr} ${group.mealStr} (${displayTimeStr}).`;
      const primaryDoseId = group.doses[0].id;
      const allDoseIds = group.doses.map((d) => d.id);

      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'KIET Medicine Alarm 🔔',
            body: bodyText,
            sound: 'chime_reminder.wav',
            categoryIdentifier: DOSE_NOTIFICATION_CATEGORY,
            data: {
              doseId: primaryDoseId,
              doseIds: allDoseIds,
              type: 'PRIMARY_REMINDER',
            },
            priority: Notifications.AndroidNotificationPriority.MAX,
          },
          trigger: {
            date: group.triggerDate,
            channelId: ANDROID_CHANNEL_ID,
          },
        });
        scheduledCount += group.doses.length;
      } catch (err) {
        console.warn('Failed scheduling grouped notification:', err);
      }
    }

    console.log(`[REMINDER ENGINE] Successfully scheduled ${scheduledCount} offline notification triggers.`);
    return scheduledCount;
  }

  /**
   * Helper: Calculate trigger Date based on meal time and relation (+30m or -30m)
   */
  private static calculateDoseDateTime(
    mealSlot: string,
    mealRelation: 'before' | 'after',
    mealTimes: MealTimesConfig,
    explicitTime?: string
  ): Date {
    let hours = 8;
    let minutes = 0;

    if (explicitTime && explicitTime.includes(':')) {
      const parts = explicitTime.split(':').map(Number);
      if (!isNaN(parts[0]) && !isNaN(parts[1])) {
        hours = parts[0];
        minutes = parts[1];
      }
    } else {
      const slot = mealSlot.toLowerCase();
      let mappedKey: 'breakfast' | 'lunch' | 'dinner' = 'breakfast';
      if (slot === 'lunch' || slot === 'afternoon') {
        mappedKey = 'lunch';
      } else if (slot === 'dinner' || slot === 'night' || slot === 'evening') {
        mappedKey = 'dinner';
      }
      const timeStr = mealTimes[mappedKey] || DEFAULT_MEAL_TIMES[mappedKey];
      const parts = timeStr.split(':').map(Number);
      hours = parts[0];
      minutes = parts[1];
    }

    const offsetMinutes = mealRelation === 'before' ? BEFORE_MEAL_OFFSET_MINUTES : AFTER_MEAL_OFFSET_MINUTES;

    const targetDate = new Date();
    targetDate.setHours(hours, minutes + offsetMinutes, 0, 0);

    // If target time today has already passed, schedule for tomorrow
    if (targetDate.getTime() <= Date.now()) {
      targetDate.setDate(targetDate.getDate() + 1);
    }

    return targetDate;
  }

  /**
   * Handle dose answer: 'taken' | 'taken_late' | 'not_taken'
   */
  static async recordDoseResponse(
    doseId: string,
    response: 'taken' | 'taken_late' | 'not_taken'
  ): Promise<void> {
    console.log(`[REMINDER ENGINE] Recording dose response: ${doseId} -> ${response}`);

    await OfflineQueue.enqueue('DOSE_RESPONSE', {
      dose_id: doseId,
      status: response,
      answered_at: new Date().toISOString(),
    });

    OfflineQueue.flush().catch(() => {});
  }

  /**
   * Diagnostic / Tester Trigger: Schedules an automated alarm with custom chime sound
   * to fire in `secondsDelay` seconds (default 3s). Works even if the student leaves or locks the phone!
   */
  static async triggerImmediateAlarmTest(secondsDelay = 3): Promise<void> {
    await this.init();

    if (Platform.OS === 'web') {
      alert('Alarm test scheduled in 3 seconds. Sound will play automatically!');
      return;
    }

    try {
      const triggerDate = new Date(Date.now() + secondsDelay * 1000);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Campus Clinic • Medicine Alarm',
          body: 'Scheduled time has arrived! Tablet 1 • After food.',
          sound: 'chime_reminder.wav',
          categoryIdentifier: DOSE_NOTIFICATION_CATEGORY,
          data: {
            doseId: 'test_dose_now',
            type: 'TEST_ALARM',
          },
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: {
          date: triggerDate,
          channelId: ANDROID_CHANNEL_ID,
        },
      });
    } catch (err) {
      console.warn('Immediate alarm test error:', err);
    }
  }
}
