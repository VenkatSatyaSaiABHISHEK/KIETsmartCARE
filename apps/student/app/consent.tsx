import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldCheck, Bell, Zap, BatteryCharging, Check } from 'lucide-react-native';
import { AuthService } from '../src/services/auth';
import { StudentApi } from '../src/services/student-api';
import { ReminderEngine } from '../src/services/reminder-engine';
import { enableAudioAndNotifications } from '../src/services/sound-player';

export default function ConsentScreen() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAcceptConsent = async () => {
    if (!agreed) {
      Alert.alert(
        'Required Confirmation',
        'Please review the clinical automation policies and tap the checkbox before continuing.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Initialize high-importance notification channel & request notification permission
      await ReminderEngine.init();

      // 2. Request native Android background/battery exemption dialog (1-tap OS popup)
      if (Platform.OS === 'android') {
        try {
          await Linking.sendIntent(
            'android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
            [{ key: 'data', value: 'package:edu.kiet.smartcare.student' }]
          );
        } catch (e) {
          console.warn('[CONSENT] Battery intent notice:', e);
        }
      }

      // 3. Initialize audio engine
      await enableAudioAndNotifications();

      await StudentApi.recordConsent();
      await AuthService.setConsented();
      router.replace('/setup');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badgeWrap}>
            <ShieldCheck size={16} color="#0284C7" />
            <Text style={styles.brandTitle}>CAMPUS CLINIC AUTOMATION</Text>
          </View>
          <Text style={styles.title}>System Permissions & Privacy</Text>
          <Text style={styles.subtext}>
            KIET Smart Care operates a closed-loop system ensuring you never miss a dose, even when offline or asleep.
          </Text>
        </View>

        {/* Feature Cards */}
        <View style={styles.featureList}>
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Zap size={20} color="#0284C7" />
            </View>
            <View style={styles.featureBody}>
              <Text style={styles.featureTitle}>Zero Manual Alarms</Text>
              <Text style={styles.featureDesc}>
                Whenever the OPD doctor prescribes medicine, the system automatically schedules offline device alarms tied to your personalized meal timings.
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Bell size={20} color="#059669" />
            </View>
            <View style={styles.featureBody}>
              <Text style={styles.featureTitle}>High-Priority Alarms & Sound</Text>
              <Text style={styles.featureDesc}>
                Scheduled alarms play an audible chime sound and vibrate. The full-screen alarm screen rings continuously until marked taken or snoozed.
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <BatteryCharging size={20} color="#D97706" />
            </View>
            <View style={styles.featureBody}>
              <Text style={styles.featureTitle}>Background & Lock-Screen Adherence</Text>
              <Text style={styles.featureDesc}>
                Reminders arrive on your lock screen with 1-tap action buttons (<Text style={styles.bold}>Taken</Text>, <Text style={styles.bold}>Taken Late</Text>, <Text style={styles.bold}>Missed</Text>) without opening the app.
              </Text>
            </View>
          </View>
        </View>

        {/* Agreement Checkbox */}
        <TouchableOpacity
          style={styles.checkboxContainer}
          activeOpacity={0.8}
          onPress={() => setAgreed(!agreed)}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
          </View>
          <Text style={styles.checkboxLabel}>
            I understand and authorize KIET Smart Care to schedule medical reminders and play audible chime alarms for my prescribed treatments.
          </Text>
        </TouchableOpacity>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.continueButton, !agreed && styles.buttonDisabled]}
          onPress={handleAcceptConsent}
          disabled={isSubmitting}
        >
          <Text style={styles.continueButtonText}>
            {isSubmitting ? 'Configuring System...' : 'Allow & Continue'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  featureList: {
    gap: 12,
    marginBottom: 24,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureBody: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  bold: {
    fontWeight: '700',
    color: '#334155',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  continueButton: {
    height: 52,
    backgroundColor: '#0284C7',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
