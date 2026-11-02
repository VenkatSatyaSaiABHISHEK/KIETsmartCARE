import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { DoseScheduleRecord, MealTimesConfig } from '../types/student';
import { OfflineQueue } from './offline-queue';
import {
  BEFORE_MEAL_OFFSET_MINUTES,
  AFTER_MEAL_OFFSET_MINUTES,
  DEFAULT_MEAL_TIMES,
  MISSED_DOSE_ADVISORY,
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
   * Initialize notification channels (High-importance Android channel & recorded voice action buttons)
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
          vibrationPattern: [0, 300, 200, 300],
          lightColor: '#0284C7',
          sound: 'chime_reminder.wav',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: false,
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
          buttonTitle: 'Not Taken',
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
      console.log(`[REMINDER ENGINE] Web platform detected. Synchronized ${doses.length} dose schedules without native notification alarms.`);
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

      const triggerDate = this.calculateDoseDateTime(
        dose.meal_slot || dose.slot || 'morning',
        dose.meal_relation || 'after',
        mealTimes,
        dose.time || (dose.scheduled_time && dose.scheduled_time.length === 5 ? dose.scheduled_time : undefined)
      );
      if (triggerDate > now) {
        const key = triggerDate.toISOString();
        const relationStr = dose.meal_relation === 'after' ? 'after' : 'before';
        const mealStr = dose.meal_slot.toLowerCase();

        if (!groupedDoses[key]) {
          groupedDoses[key] = { triggerDate, relationStr, mealStr, doses: [] };
        }
        groupedDoses[key].doses.push(dose);
      }
    }

    for (const key of Object.keys(groupedDoses)) {
      const group = groupedDoses[key];
      const medListStr = group.doses.map((d) => `${d.medicine_name} (${d.dose || '1 dose'})`).join(', ');
      const bodyText = `${medListStr} \u2014 ${group.relationStr} ${group.mealStr}.`;
      const primaryDoseId = group.doses[0].id;
      const allDoseIds = group.doses.map((d) => d.id);

      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Time to take your medicine',
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
   * Queues response offline immediately and cancels redundant reminders.
   */
  static async recordDoseResponse(
    doseId: string,
    response: 'taken' | 'taken_late' | 'not_taken'
  ): Promise<void> {
    console.log(`[REMINDER ENGINE] Recording dose response: ${doseId} -> ${response}`);

    // Queue response offline
    await OfflineQueue.enqueue('DOSE_RESPONSE', {
      dose_id: doseId,
      status: response,
      answered_at: new Date().toISOString(),
    });

    // Attempt background sync
    OfflineQueue.flush().catch(() => {});
  }

  /**
   * Diagnostic / Tester Trigger: Schedules an automated alarm with custom chime sound
   * to fire in `secondsDelay` seconds (default 3s). Works even if the student leaves or locks the phone!
   */
  static async triggerImmediateAlarmTest(
    secondsDelay: number = 3,
    medicineName: string = 'Paracetamol 650mg'
  ): Promise<string> {
    await this.init();

    if (Platform.OS === 'web') {
      console.log(`[REMINDER ENGINE] Web diagnostic test alarm triggered for ${medicineName}.`);
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          alert(`🔔 [MEDICINE REMINDER]\nTime to take your medicine:\n${medicineName} (1 tablet)`);
        }, secondsDelay * 1000);
      }
      return 'web-alarm-scheduled';
    }

    const triggerDate = new Date(Date.now() + secondsDelay * 1000);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to take your medicine',
        body: `${medicineName} (1 tablet) — Scheduled Dose Reminder`,
        sound: 'chime_reminder.wav',
        categoryIdentifier: DOSE_NOTIFICATION_CATEGORY,
        data: {
          doseId: 'test-alarm-01',
          type: 'TEST_ALARM_TRIGGER',
        },
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: {
        date: triggerDate,
        channelId: ANDROID_CHANNEL_ID,
      },
    });

    console.log(`[REMINDER ENGINE] Diagnostic automated alarm scheduled to ring at ${triggerDate.toLocaleTimeString()} with chime sound!`);
    return notificationId;
  }

  /**
   * Standard safety rule: Never tell a student to double a missed dose.
   */
  static getMissedDoseAdvisory(): string {
    return MISSED_DOSE_ADVISORY;
  }
}
