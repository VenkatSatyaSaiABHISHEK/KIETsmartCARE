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
import { ShieldCheck, CheckCircle2, Lock, EyeOff, BellRing, ArrowRight } from 'lucide-react-native';
import { AuthService } from '../src/services/auth';
import { StudentApi } from '../src/services/student-api';

export default function ConsentScreen() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAcceptConsent = async () => {
    if (!agreed) {
      alert('Please check the confirmation box to indicate your consent.');
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
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <ShieldCheck color="#ffffff" size={24} />
        </View>
        <Text style={styles.title}>Student Healthcare Consent</Text>
        <Text style={styles.subtitle}>
          Plain-language disclosure of your health data rights at KIET.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>What data is collected?</Text>

          <View style={styles.bulletRow}>
            <BellRing color="#2563eb" size={18} style={styles.bulletIcon} />
            <Text style={styles.bulletText}>
              <Text style={styles.boldText}>Prescription Details: </Text>
              Medicines, doses, and durations prescribed to your roll number by Campus OPD Doctors.
            </Text>
          </View>

          <View style={styles.bulletRow}>
            <CheckCircle2 color="#2563eb" size={18} style={styles.bulletIcon} />
            <Text style={styles.bulletText}>
              <Text style={styles.boldText}>Dose Confirmations: </Text>
              Your responses (Taken, Taken late, Not taken) when medication alarms ring.
            </Text>
          </View>

          <View style={styles.bulletRow}>
            <EyeOff color="#2563eb" size={18} style={styles.bulletIcon} />
            <Text style={styles.bulletText}>
              <Text style={styles.boldText}>Recovery Outcome: </Text>
              Your end-of-course recovery check (Better, Same, Worse) and any reported side effects.
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Why is it collected?</Text>
          <Text style={styles.paragraph}>
            1. To automatically program high-importance local alarms on your phone tied to your meal times (Breakfast, Lunch, Dinner).
          </Text>
          <Text style={styles.paragraph}>
            2. To trigger immediate RED ALERTS to your prescribing doctor and the Campus Health Officer if you do not recover or experience adverse symptoms.
          </Text>
        </View>

        <View style={[styles.card, styles.privacyHighlightCard]}>
          <View style={styles.lockRow}>
            <Lock color="#166534" size={18} />
            <Text style={styles.privacyHeading}>Strict Privacy Invariants</Text>
          </View>
          <Text style={styles.privacyBody}>
            &bull; Administrative staff <Text style={styles.boldText}>cannot read</Text> your clinical notes or medical history.
          </Text>
          <Text style={styles.privacyBody}>
            &bull; Your records are sealed by database Row Level Security and are never made public.
          </Text>
          <Text style={styles.privacyBody}>
            &bull; Every time medical details are viewed, an entry is permanently written to the campus audit ledger.
          </Text>
        </View>

        {/* Checkbox confirmation */}
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setAgreed(!agreed)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkboxBox, agreed && styles.checkboxActive]}>
            {agreed && <CheckCircle2 color="#ffffff" size={16} />}
          </View>
          <Text style={styles.checkboxLabel}>
            I understand what health data is collected, agree to automated meal reminders, and give my consent.
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Persistent Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.acceptBtn, !agreed && styles.acceptBtnDisabled]}
          onPress={handleAcceptConsent}
          disabled={!agreed || isSubmitting}
          activeOpacity={0.85}
        >
          <Text style={styles.acceptBtnText}>
            {isSubmitting ? 'Recording Consent...' : 'Accept & Proceed to Setup'}
          </Text>
          <ArrowRight color="#ffffff" size={18} />
        </TouchableOpacity>
        <Text style={styles.disclaimerText}>
          The app cannot be used without recording student consent in consent_records.
        </Text>
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
    paddingBottom: 120,
  },
  card: {
    backgroundColor: '#f4f4f5',
    borderRadius: 20,
    padding: 18,
  },
  privacyHighlightCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0a0a0a',
    marginBottom: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  bulletIcon: {
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: '#3f3f46',
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
    color: '#0a0a0a',
  },
  paragraph: {
    fontSize: 13,
    color: '#3f3f46',
    lineHeight: 18,
    marginBottom: 8,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  privacyHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534',
  },
  privacyBody: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 18,
    marginBottom: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    gap: 12,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#a1a1aa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#0a0a0a',
    borderColor: '#0a0a0a',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12,
    color: '#0a0a0a',
    lineHeight: 16,
    fontWeight: '600',
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
  acceptBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#0a0a0a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  acceptBtnDisabled: {
    opacity: 0.45,
  },
  acceptBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  disclaimerText: {
    textAlign: 'center',
    fontSize: 10,
    color: '#a1a1aa',
    marginTop: 6,
  },
});
