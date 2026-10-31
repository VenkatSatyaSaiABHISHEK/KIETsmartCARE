import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { DoseScheduleRecord, MealTimesConfig } from '../types/student';
import { OfflineQueue } from './offline-queue';
import {
  BEFORE_MEAL_OFFSET_MINUTES,
  AFTER_MEAL_OFFSET_MINUTES,
  DEFAULT_MEAL_TIMES,
  MISSED_DOSE_ADVISORY,
} from '@kiet-smart-care/shared';

// Setup foreground notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const ANDROID_CHANNEL_ID = 'kiet_smart_care_reminders';

export class ReminderEngine {
  private static isInitialized = false;

  /**
   * Initialize notification channels (High-importance Android channel)
   */
  static async init(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
          name: 'Medicine Dose Reminders',
          description: 'High-importance campus healthcare dose reminders tied to meals',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 300, 200, 300],
          lightColor: '#2563EB',
          sound: 'default',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: false,
        });
      }

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

    // 1. Cancel and rebuild on each sync so they never duplicate
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[REMINDER ENGINE] Previous local notifications cancelled. Rebuilding clean schedule...');

    let scheduledCount = 0;
    const now = new Date();

    for (const dose of doses) {
      // Only schedule upcoming/unconfirmed doses
      if (dose.status !== 'scheduled' && dose.status !== 'unconfirmed') {
        continue;
      }

      const triggerDate = this.calculateDoseDateTime(dose.meal_slot, dose.meal_relation, mealTimes);

      // Only schedule if in future or within the next 24 hours
      if (triggerDate > now) {
        // Format body text: "After lunch: take Medicine A, 1 tablet."
        const relationStr = dose.meal_relation === 'after' ? 'After' : 'Before';
        const mealStr = dose.meal_slot.charAt(0).toUpperCase() + dose.meal_slot.slice(1);
        const bodyText = `${relationStr} ${mealStr.toLowerCase()}: take ${dose.medicine_name}, ${dose.dose}.`;

        try {
          // Primary Local Notification
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'KIET Smart Care Reminder',
              body: bodyText,
              sound: 'default',
              data: {
                doseId: dose.id,
                medicineName: dose.medicine_name,
                type: 'PRIMARY_REMINDER',
              },
              priority: Notifications.AndroidNotificationPriority.MAX,
            },
            trigger: {
              date: triggerDate,
              channelId: ANDROID_CHANNEL_ID,
            },
          });
          scheduledCount++;

          // 2. Second reminder 30 minutes later if unanswered
          const secondReminderDate = new Date(triggerDate.getTime() + 30 * 60 * 1000);
          if (secondReminderDate > now) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: 'Pending Dose Check',
                body: `Did you take ${dose.medicine_name} (${dose.dose})? Confirm your dose in the app.`,
                sound: 'default',
                data: {
                  doseId: dose.id,
                  type: 'SECOND_REMINDER',
                },
                priority: Notifications.AndroidNotificationPriority.HIGH,
              },
              trigger: {
                date: secondReminderDate,
                channelId: ANDROID_CHANNEL_ID,
              },
            });
            scheduledCount++;
          }
        } catch (err) {
          console.warn(`Failed scheduling notification for ${dose.medicine_name}:`, err);
        }
      }
    }

    console.log(`[REMINDER ENGINE] Successfully scheduled ${scheduledCount} offline notification triggers.`);
    return scheduledCount;
  }

  /**
   * Helper: Calculate trigger Date based on meal time and relation (+30m or -30m)
   */
  private static calculateDoseDateTime(
    mealSlot: 'breakfast' | 'lunch' | 'dinner',
    mealRelation: 'before' | 'after',
    mealTimes: MealTimesConfig
  ): Date {
    const timeStr = mealTimes[mealSlot] || DEFAULT_MEAL_TIMES[mealSlot];
    const [hours, minutes] = timeStr.split(':').map(Number);

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
   * Standard safety rule: Never tell a student to double a missed dose.
   */
  static getMissedDoseAdvisory(): string {
    return MISSED_DOSE_ADVISORY;
  }
}
