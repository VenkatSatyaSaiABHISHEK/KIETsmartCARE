import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { DoseScheduleRecord, MealTimesConfig, StudentProfileData } from '../types/student';
import { OfflineQueue } from './offline-queue';
import {
  BEFORE_MEAL_OFFSET_MINUTES,
  AFTER_MEAL_OFFSET_MINUTES,
  DEFAULT_MEAL_TIMES,
  formatTime12h,
} from '../constants/shared';

// Foreground notification presentation options
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

// Android channel configuration - bumped to v9 to force Android OS to create fresh ALARM-stream channel
export const ANDROID_CHANNEL_ID = 'kiet_medicine_alarm_v9';
export const NOTIFEE_FULLSCREEN_CHANNEL_ID = 'kiet_alarm_full_screen';
export const DOSE_NOTIFICATION_CATEGORY = 'DOSE_REMINDER_ACTIONS';

export class ReminderEngine {
  private static isInitialized = false;

  /**
   * Initialize notification channels (High-importance Android channel with custom chime sound & ALARM stream privileges)
   */
  static async init(): Promise<boolean> {
    if (this.isInitialized) return true;

    if (Platform.OS === 'web') {
      this.isInitialized = true;
      return true;
    }

    try {
      if (Platform.OS === 'android') {
        // Delete deprecated channels so system resets properly
        const oldChannels = [
          'kiet_alarm_channel_v1',
          'kiet_alarm_channel_v2',
          'kiet_alarm_channel_v3',
          'kiet_alarm_channel_v4',
          'kiet_alarm_channel_v5',
          'kiet_medicine_alarm_v8',
        ];
        for (const oldCh of oldChannels) {
          try {
            await Notifications.deleteNotificationChannelAsync(oldCh);
          } catch {}
        }

        // Configure high-priority alarm channel bypassing silent/vibrate when user needs medicine
        await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
          name: 'KIET Medicine Alarms',
          description: 'High-importance campus healthcare dose reminders that ring with sound and vibration',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 600, 300, 600, 300, 1000],
          lightColor: '#0284C7',
          sound: 'chime_reminder',
          audioAttributes: {
            usage: Notifications.AndroidAudioUsage.ALARM,
            contentType: Notifications.AndroidAudioContentType.SONIFICATION,
            flags: {
              enforceAudibility: true,
              requestHardwareAudioVideoSynchronization: false,
            },
          },
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: true,
          enableVibrate: true,
          showBadge: true,
        });

        // Initialize Notifee Full-Screen Alarm Channel
        try {
          const notifee = require('@notifee/react-native').default;
          const { AndroidImportance } = require('@notifee/react-native');
          if (notifee) {
            await notifee.createChannel({
              id: NOTIFEE_FULLSCREEN_CHANNEL_ID,
              name: 'KIET Medicine Alarms (Full Screen Wakeup)',
              importance: AndroidImportance.HIGH,
              sound: 'chime_reminder',
              vibration: true,
              vibrationPattern: [0, 600, 300, 600, 300, 1000],
              bypassDnd: true,
            });
          }
        } catch {}
      }

      // Configure interactive notification action buttons: Taken, Taken Late, Not Taken
      await Notifications.setNotificationCategoryAsync(DOSE_NOTIFICATION_CATEGORY, [
        {
          identifier: 'taken',
          buttonTitle: '✓ Taken',
          options: { opensAppToForeground: false },
        },
        {
          identifier: 'taken_late',
          buttonTitle: '🕒 Taken Late',
          options: { opensAppToForeground: false },
        },
        {
          identifier: 'not_taken',
          buttonTitle: '✕ Not Taken',
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
   * Sync schedule and rebuild ALL local scheduled notifications with full-screen wakeup triggers.
   */
  static async syncAndScheduleAll(
    doses: DoseScheduleRecord[],
    mealTimes: MealTimesConfig = DEFAULT_MEAL_TIMES,
    profile?: StudentProfileData | null
  ): Promise<number> {
    await this.init();

    if (Platform.OS === 'web') {
      console.log(`[REMINDER ENGINE] Web platform detected. Synchronized ${doses.length} dose schedules.`);
      return doses.length;
    }

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      // Also cancel Notifee scheduled triggers
      try {
        const notifee = require('@notifee/react-native').default;
        if (notifee) {
          await notifee.cancelAllNotifications();
        }
      } catch {}
      console.log('[REMINDER ENGINE] Previous local notifications cancelled. Rebuilding clean schedule...');
    } catch (err) {
      console.warn('Error cancelling scheduled notifications:', err);
    }

    let scheduledCount = 0;
    const now = new Date();

    const firstName = profile?.full_name ? profile.full_name.trim().split(' ')[0] : 'Student';

    const groupedDoses: Record<string, { triggerDate: Date; relationStr: string; mealStr: string; doses: DoseScheduleRecord[] }> = {};

    for (const dose of doses) {
      if (dose.status !== 'scheduled' && dose.status !== 'unconfirmed') continue;

      let triggerDate: Date;

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

      const diffMs = triggerDate.getTime() - now.getTime();
      let effectiveTriggerDate = triggerDate;
      if (diffMs <= 0 && Math.abs(diffMs) <= 60 * 1000) {
        effectiveTriggerDate = new Date(Date.now() + 2000);
      } else if (diffMs < -60 * 1000) {
        continue;
      }

      if (effectiveTriggerDate.getTime() > now.getTime()) {
        const key = triggerDate.toISOString();
        const relationStr = dose.meal_relation === 'after' ? 'After' : 'Before';
        const rawSlot = (dose.meal_slot || dose.slot || 'food').toLowerCase();
        const mealStr = rawSlot.charAt(0).toUpperCase() + rawSlot.slice(1);

        if (!groupedDoses[key]) {
          groupedDoses[key] = { triggerDate: effectiveTriggerDate, relationStr, mealStr, doses: [] };
        }
        groupedDoses[key].doses.push(dose);
      }
    }

    for (const key of Object.keys(groupedDoses)) {
      const group = groupedDoses[key];
      const medListStr = group.doses
        .map((d) => `${d.medicine_name || 'Tablet'} (${d.tablets ? `${d.tablets} tablets` : d.dose || '1 tablet'})`)
        .join(', ');

      const notificationTitle = `${firstName}, time for your medicine`;
      const notificationBody = `${group.relationStr} ${group.mealStr}: ${medListStr}`;

      const primaryDoseId = group.doses[0].id;
      const allDoseIds = group.doses.map((d) => d.id);
      const uniqueNotifId = `kiet_dose_${group.triggerDate.getTime()}`;

      // 1. Android Native Full-Screen Intent via Notifee (wakes screen & displays full UI over lock screen)
      if (Platform.OS === 'android') {
        try {
          const notifee = require('@notifee/react-native').default;
          const { AndroidImportance, AndroidCategory, AndroidVisibility, TriggerType } = require('@notifee/react-native');
          if (notifee) {
            await notifee.createTriggerNotification(
              {
                id: uniqueNotifId,
                title: notificationTitle,
                body: notificationBody,
                data: {
                  doseId: primaryDoseId,
                  doseIds: allDoseIds.join(','),
                  type: 'PRIMARY_REMINDER',
                },
                android: {
                  channelId: NOTIFEE_FULLSCREEN_CHANNEL_ID,
                  importance: AndroidImportance.HIGH,
                  category: AndroidCategory.ALARM,
                  sound: 'chime_reminder',
                  fullScreenAction: {
                    id: 'default',
                    launchActivity: 'default',
                  },
                  pressAction: {
                    id: 'default',
                    launchActivity: 'default',
                  },
                  visibility: AndroidVisibility.PUBLIC,
                  autoCancel: false,
                  ongoing: true,
                },
              },
              {
                type: TriggerType.TIMESTAMP,
                timestamp: group.triggerDate.getTime(),
                alarmManager: {
                  allowWhileIdle: true,
                },
              }
            );
          }
        } catch (notifErr) {
          console.warn('[REMINDER ENGINE] Full-screen intent scheduling note:', notifErr);
        }
      }

      // 2. Expo Notifications Trigger (acts as backup & handles notification drawer)
      try {
        await Notifications.scheduleNotificationAsync({
          identifier: uniqueNotifId,
          content: {
            title: notificationTitle,
            body: notificationBody,
            sound: 'chime_reminder',
            categoryIdentifier: DOSE_NOTIFICATION_CATEGORY,
            data: {
              doseId: primaryDoseId,
              doseIds: allDoseIds,
              type: 'PRIMARY_REMINDER',
            },
            priority: Notifications.AndroidNotificationPriority.MAX,
            vibrate: [0, 600, 300, 600, 300, 1000],
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
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
    response: 'taken' | 'taken_late' | 'not_taken',
    lateMinutes = 0
  ): Promise<void> {
    console.log(`[REMINDER ENGINE] Recording dose response: ${doseId} -> ${response} (lateMinutes: ${lateMinutes})`);

    await OfflineQueue.enqueue('DOSE_RESPONSE', {
      dose_id: doseId,
      status: response,
      late_minutes: lateMinutes,
      answered_at: new Date().toISOString(),
    });

    OfflineQueue.flush().catch(() => {});
  }

  /**
   * Diagnostic / Tester Trigger
   */
  static async triggerImmediateAlarmTest(secondsDelay = 3, firstName = 'Student'): Promise<void> {
    await this.init();

    if (Platform.OS === 'web') {
      alert('Alarm test scheduled in 3 seconds. Sound will play automatically!');
      return;
    }

    try {
      const triggerDate = new Date(Date.now() + secondsDelay * 1000);
      await Notifications.scheduleNotificationAsync({
        identifier: `kiet_test_${triggerDate.getTime()}`,
        content: {
          title: `${firstName}, time for your medicine`,
          body: 'After food: Tablet 1 (1 tablet)',
          sound: 'chime_reminder',
          categoryIdentifier: DOSE_NOTIFICATION_CATEGORY,
          data: {
            doseId: 'test_dose_now',
            type: 'TEST_ALARM',
          },
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 600, 300, 600, 300, 1000],
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
          channelId: ANDROID_CHANNEL_ID,
        },
      });
    } catch (err) {
      console.warn('Immediate alarm test error:', err);
    }
  }
}
