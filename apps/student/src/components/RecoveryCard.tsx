import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { HeartPulse, Check, PhoneCall, AlertOctagon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { RecoveryInquiry } from '../types/student';
import { EMERGENCY_CONTACTS } from '@kiet-smart-care/shared';

interface RecoveryCardProps {
  inquiry: RecoveryInquiry;
  onAnswer: (response: 'better' | 'same' | 'worse') => void;
}

export function RecoveryCard({ inquiry, onAnswer }: RecoveryCardProps) {
  const [answeredState, setAnsweredState] = useState<'better' | 'same' | 'worse' | null>(
    inquiry.status || null
  );

  const handleSelect = (response: 'better' | 'same' | 'worse') => {
    try {
      Haptics.notificationAsync(
        response === 'better'
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning
      );
    } catch {}

    setAnsweredState(response);
    onAnswer(response);
  };

  const handleContactDoctor = () => {
    Linking.openURL(`tel:${EMERGENCY_CONTACTS.CAMPUS_HEALTH_CENTRE}`);
  };

  if (answeredState === 'better') {
    return (
      <View style={[styles.card, styles.resolvedCard]}>
        <Check color="#166534" size={24} />
        <View style={styles.resolvedTextContainer}>
          <Text style={styles.resolvedTitle}>Glad you feel better!</Text>
          <Text style={styles.resolvedSub}>
            Your recovery report for &ldquo;{inquiry.problem_name}&rdquo; has been logged.
          </Text>
        </View>
      </View>
    );
  }

  const isEscalated = answeredState === 'same' || answeredState === 'worse';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.badge}>
          <HeartPulse color="#ffffff" size={14} />
          <Text style={styles.badgeText}>End-of-Course Health Check</Text>
        </View>
      </View>

      <Text style={styles.questionText}>
        Is your {inquiry.problem_name.toLowerCase()} better?
      </Text>
      <Text style={styles.subText}>
        Your medication course is finished. Tap below to report your recovery status to Dr. Verma.
      </Text>

      {!isEscalated ? (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.answerButton, styles.betterButton]}
            onPress={() => handleSelect('better')}
            activeOpacity={0.8}
          >
            <Text style={styles.betterText}>Better</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.answerButton, styles.sameButton]}
            onPress={() => handleSelect('same')}
            activeOpacity={0.8}
          >
            <Text style={styles.sameText}>Same</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.answerButton, styles.worseButton]}
            onPress={() => handleSelect('worse')}
            activeOpacity={0.8}
          >
            <Text style={styles.worseText}>Worse</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.alertBanner}>
          <View style={styles.alertHeader}>
            <AlertOctagon color="#b91c1c" size={20} />
            <Text style={styles.alertTitle}>Doctor & Health Officer Notified</Text>
          </View>
          <Text style={styles.alertBody}>
            Since you reported feeling &ldquo;{answeredState}&rdquo;, a red priority alert has been sent to your doctor and campus health officer.
          </Text>
          <TouchableOpacity
            style={styles.contactDocBtn}
            onPress={handleContactDoctor}
            activeOpacity={0.85}
          >
            <PhoneCall color="#ffffff" size={16} />
            <Text style={styles.contactDocText}>Contact Campus Clinic Doctor</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0a0a0a',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  resolvedCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resolvedTextContainer: {
    flex: 1,
  },
  resolvedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#166534',
  },
  resolvedSub: {
    fontSize: 12,
    color: '#15803d',
    marginTop: 2,
  },
  cardHeader: {
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#27272a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  questionText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.4,
  },
  subText: {
    fontSize: 13,
    color: '#a1a1aa',
    marginTop: 6,
    lineHeight: 18,
    marginBottom: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  answerButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  betterButton: {
    backgroundColor: '#ffffff',
  },
  betterText: {
    color: '#0a0a0a',
    fontWeight: '800',
    fontSize: 14,
  },
  sameButton: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  sameText: {
    color: '#fbbf24', // Amber
    fontWeight: '700',
    fontSize: 14,
  },
  worseButton: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  worseText: {
    color: '#f87171', // Red
    fontWeight: '700',
    fontSize: 14,
  },
  alertBanner: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 16,
    padding: 16,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  alertTitle: {
    color: '#991b1b',
    fontSize: 14,
    fontWeight: '800',
  },
  alertBody: {
    color: '#7f1d1d',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 14,
  },
  contactDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    borderRadius: 12,
    height: 44,
    gap: 8,
  },
  contactDocText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
});
