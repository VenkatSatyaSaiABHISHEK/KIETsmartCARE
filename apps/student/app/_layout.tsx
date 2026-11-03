import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { ReminderEngine } from '../src/services/reminder-engine';
import { startContinuousAlarm } from '../src/services/sound-player';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // 1. Initialize notification channels & permissions early at root
    ReminderEngine.init().catch(() => {});

    // 2. Listen for notifications received while app is running in foreground or background
    const subReceived = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[ROOT NOTIFICATION RECEIVED]', notification);
      // Play full audible alarm sound whenever a dose notification arrives
      const data = notification.request.content.data;
      if (data?.type === 'PRIMARY_REMINDER' || data?.type === 'TEST_ALARM') {
        startContinuousAlarm().catch(() => {});
      }
    });

    // 3. Listen for user tapping the notification banner on the lock screen / notification shade
    const subResponse = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('[ROOT NOTIFICATION RESPONSE]', response);
      const actionIdentifier = response.actionIdentifier;
      const data = response.notification.request.content.data;
      const doseId = data?.doseId;

      if (actionIdentifier === 'taken' && doseId) {
        ReminderEngine.recordDoseResponse(doseId, 'taken');
      } else if (actionIdentifier === 'taken_late' && doseId) {
        ReminderEngine.recordDoseResponse(doseId, 'taken_late');
      } else if (actionIdentifier === 'not_taken' && doseId) {
        ReminderEngine.recordDoseResponse(doseId, 'not_taken');
      } else {
        // Tapped body of notification -> bring user to tabs home where alarm takeover modal opens!
        router.push('/(tabs)');
      }
    });

    return () => {
      subReceived.remove();
      subResponse.remove();
    };
  }, [router]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#ffffff' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="consent" />
        <Stack.Screen name="setup" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="report-problem" />
      </Stack>
    </SafeAreaProvider>
  );
}
