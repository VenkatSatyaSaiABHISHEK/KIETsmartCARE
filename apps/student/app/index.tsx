import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
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
      <View style={styles.logoBadge}>
        <ShieldCheck color="#ffffff" size={40} />
      </View>
      <Text style={styles.title}>KIET Smart Care</Text>
      <Text style={styles.subtitle}>Campus Healthcare System</Text>
      <ActivityIndicator size="small" color="#0a0a0a" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0a0a0a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#71717a',
    marginTop: 4,
  },
  loader: {
    marginTop: 28,
  },
});
