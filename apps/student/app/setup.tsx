import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, Clock, BatteryCharging, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { ReminderEngine } from '../src/services/reminder-engine';
import { StudentApi } from '../src/services/student-api';
import { AuthService } from '../src/services/auth';

export default function SetupScreen() {
  const router = useRouter();
  const [breakfast, setBreakfast] = useState('08:00');
  const [lunch, setLunch] = useState('13:00');
  const [dinner, setDinner] = useState('20:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCompleteSetup = async () => {
    setIsSubmitting(true);
    try {
      // 1. Initialize notification channels & permissions
      await ReminderEngine.init();

      // 2. Save meal times
      await StudentApi.updateMealTimes({ breakfast, lunch, dinner });

      // 3. Sync initial schedule & build local alarms
      const doses = await StudentApi.getDoses();
      await ReminderEngine.syncAndScheduleAll(doses, { breakfast, lunch, dinner });

      // 4. Mark setup complete in session
      await AuthService.setSetupCompleted();

      router.replace('/(tabs)');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Clock color="#ffffff" size={24} />
        </View>
        <Text style={styles.title}>Meal Timings & Alarms</Text>
        <Text style={styles.subtitle}>
          Set your typical meal hours so medicine reminders ring at the right moment.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Meal Time Inputs */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Your Typical Daily Meal Schedule</Text>
          <Text style={styles.cardSub}>
            Reminders will fire 30 minutes after or before these times based on doctor instructions.
          </Text>

          <View style={styles.timeInputRow}>
            <View style={styles.timeInputBox}>
              <Text style={styles.timeLabel}>Breakfast (24h)</Text>
              <TextInput
                style={styles.timeInput}
                value={breakfast}
                onChangeText={setBreakfast}
                placeholder="08:00"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
              <Text style={styles.offsetNote}>Reminders: 07:30 or 08:30</Text>
            </View>

            <View style={styles.timeInputBox}>
              <Text style={styles.timeLabel}>Lunch (24h)</Text>
              <TextInput
                style={styles.timeInput}
                value={lunch}
                onChangeText={setLunch}
                placeholder="13:00"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
              <Text style={styles.offsetNote}>Reminders: 12:30 or 13:30</Text>
            </View>

            <View style={styles.timeInputBox}>
              <Text style={styles.timeLabel}>Dinner (24h)</Text>
              <TextInput
                style={styles.timeInput}
                value={dinner}
                onChangeText={setDinner}
                placeholder="20:00"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
              <Text style={styles.offsetNote}>Reminders: 19:30 or 20:30</Text>
            </View>
          </View>
        </View>

        {/* Android Battery Optimization Instruction */}
        {Platform.OS === 'android' ? (
          <View style={[styles.card, styles.batteryCard]}>
            <View style={styles.batteryHeader}>
              <BatteryCharging color="#92400e" size={20} />
              <Text style={styles.batteryTitle}>Android Battery Optimization</Text>
            </View>
            <Text style={styles.batteryBody}>
              To guarantee that local reminders ring on time even when your phone is in deep sleep or Doze mode:
            </Text>
            <Text style={styles.batteryStep}>
              1. Open Phone Settings &gt; Apps &gt; KIET Smart Care.
            </Text>
            <Text style={styles.batteryStep}>
              2. Select &quot;Battery&quot; and set to &quot;Unrestricted&quot; (Don&apos;t optimize).
            </Text>
          </View>
        ) : (
          <View style={[styles.card, styles.iosNoticeCard]}>
            <View style={styles.batteryHeader}>
              <Bell color="#1e40af" size={20} />
              <Text style={styles.iosTitle}>iOS Notification Protocol</Text>
            </View>
            <Text style={styles.iosBody}>
              On iOS, reminders arrive as high-priority alert banners with system sound rather than a continuous alarm ring. Keep KIET Smart Care notifications enabled in iOS Settings.
            </Text>
          </View>
        )}

        <View style={[styles.card, styles.offlineCard]}>
          <ShieldCheck color="#166534" size={20} />
          <View style={styles.offlineTextWrap}>
            <Text style={styles.offlineTitle}>Zero Internet Required for Alarms</Text>
            <Text style={styles.offlineBody}>
              All scheduled dose alarms are stored locally on your device. Reminders will ring reliably even in airplane mode or during network outages.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={handleCompleteSetup}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>
            {isSubmitting ? 'Configuring Alarms...' : 'Complete Setup & Open App'}
          </Text>
          <ArrowRight color="#ffffff" size={18} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0a0a0a',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: '#71717a',
    marginTop: 4,
  },
  scrollContent: {
    padding: 24,
    gap: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#f4f4f5',
    borderRadius: 20,
    padding: 18,
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0a0a0a',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12,
    color: '#71717a',
    lineHeight: 16,
    marginBottom: 18,
  },
  timeInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timeInputBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0a0a0a',
    marginBottom: 6,
  },
  timeInput: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a0a0a',
    paddingVertical: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  offsetNote: {
    fontSize: 9,
    color: '#a1a1aa',
    marginTop: 4,
  },
  batteryCard: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  batteryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  batteryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400e',
  },
  batteryBody: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 16,
    marginBottom: 6,
  },
  batteryStep: {
    fontSize: 12,
    fontWeight: '600',
    color: '#78350f',
    lineHeight: 18,
  },
  iosNoticeCard: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  iosTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e40af',
  },
  iosBody: {
    fontSize: 12,
    color: '#1e3a8a',
    lineHeight: 16,
  },
  offlineCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  offlineTextWrap: {
    flex: 1,
  },
  offlineTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 2,
  },
  offlineBody: {
    fontSize: 12,
    color: '#15803d',
    lineHeight: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f4f4f5',
  },
  continueBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#0a0a0a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
