import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthService } from '../src/services/auth';
import { ReminderEngine } from '../src/services/reminder-engine';
import { StudentApi } from '../src/services/student-api';

export default function EntryRouterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function determineRoute() {
      try {
        const session = await AuthService.getCurrentSession();
        if (!session) {
          router.replace('/login');
          return;
        }

        if (session.is_first_login) {
          router.replace('/login');
          return;
        }

        if (!session.has_consented) {
          router.replace('/consent');
          return;
        }

        if (!session.has_completed_setup) {
          router.replace('/setup');
          return;
        }

        // Resync local notification schedules on app launch
        const [profile, doses] = await Promise.all([
          StudentApi.getProfile(),
          StudentApi.getDoses(),
        ]);
        if (profile) {
          ReminderEngine.syncAndScheduleAll(doses, profile.meal_times).catch(() => {});
        }

        router.replace('/(tabs)');
      } catch (e) {
        console.warn('Routing determination error:', e);
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    }

    determineRoute();
  }, [router]);

  return (
    <View style={styles.splashContainer}>
      <Text style={styles.brandTitle}>KIET SMART CARE</Text>
      <Text style={styles.subtext}>Campus Healthcare Network</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#121212',
    letterSpacing: -0.3,
  },
  subtext: {
    fontSize: 13,
    color: '#555555',
    marginTop: 6,
  },
});
