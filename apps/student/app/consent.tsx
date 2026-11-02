import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AuthService } from '../src/services/auth';
import { StudentApi } from '../src/services/student-api';

export default function ConsentScreen() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAcceptConsent = async () => {
    if (!agreed) {
      alert('Please tap the agreement confirmation before proceeding.');
      return;
    }

    setIsSubmitting(true);
    try {
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
          <Text style={styles.brandTitle}>DATA GOVERNANCE & PRIVACY</Text>
          <Text style={styles.title}>Before you continue</Text>
          <Text style={styles.subtext}>
            KIET Smart Care coordinates campus clinical visits, local device reminders, and post-treatment recovery monitoring.
          </Text>
        </View>

        {/* Plain Text Disclosure */}
        <View style={styles.termsContent}>
          <Text style={styles.termsParagraph}>
            1. <Text style={styles.bold}>Zero Manual Alarm Setting:</Text> You do not need to manually create phone alarms. Whenever an OPD doctor issues a prescription, KIET Smart Care automatically sets high-precision scheduled alarms and notifications synchronized with your meal schedule.
          </Text>

          <Text style={styles.termsParagraph}>
            2. <Text style={styles.bold}>Sound & Background Execution:</Text> Scheduled reminders play a gentle clinical chime (<Text style={styles.italic}>chime_reminder.wav</Text>) and high-priority vibration even when the app is completely closed or your phone is locked.
          </Text>

          <Text style={styles.termsParagraph}>
            3. <Text style={styles.bold}>Action Buttons Without Opening the App:</Text> You can record your adherence directly from the lock-screen notification (<Text style={styles.italic}>Taken</Text>, <Text style={styles.italic}>Taken Late</Text>, or <Text style={styles.italic}>Not Taken</Text>) without launching the app. Responses queue locally if offline and sync automatically.
          </Text>

          <Text style={styles.termsParagraph}>
            4. <Text style={styles.bold}>Clinical Data Privacy:</Text> Your prescriptions and recovery telemetry are accessible only to authorized campus OPD doctors and triage health officers. General administrative staff have zero access to your medical diagnoses or treatment notes.
          </Text>

          <Text style={styles.termsParagraph}>
            5. <Text style={styles.bold}>Safety Invariant:</Text> The system strictly enforces the clinical protocol: if a dose is missed, you will be notified to resume your normal schedule and never double up.
          </Text>
        </View>

        {/* Checkbox Tap */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAgreed(!agreed)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
            {agreed && <Text style={styles.checkMark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            I consent to campus clinical telemetry and authorize KIET Smart Care to automatically schedule medicine alarms with sound on this device.
          </Text>
        </TouchableOpacity>

        {/* Agree Button */}
        <TouchableOpacity
          style={[styles.continueBtn, !agreed && styles.continueBtnDisabled]}
          onPress={handleAcceptConsent}
          disabled={isSubmitting || !agreed}
          activeOpacity={0.8}
        >
          <Text style={styles.continueBtnText}>
            {isSubmitting ? 'Saving...' : 'I Agree to the Above Terms'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  brandTitle: {
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '700',
    color: '#555555',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#121212',
  },
  subtext: {
    fontSize: 14,
    color: '#555555',
    marginTop: 6,
    lineHeight: 20,
  },
  termsContent: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EBEBEB',
    paddingVertical: 20,
    gap: 16,
    marginBottom: 24,
  },
  termsParagraph: {
    fontSize: 13,
    color: '#333333',
    lineHeight: 19,
  },
  bold: {
    fontWeight: '700',
    color: '#121212',
  },
  italic: {
    fontStyle: 'italic',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 28,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#AAAAAA',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: '#121212',
    borderColor: '#121212',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: '#333333',
    lineHeight: 18,
  },
  continueBtn: {
    height: 56,
    borderRadius: 12,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueBtnDisabled: {
    opacity: 0.35,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
