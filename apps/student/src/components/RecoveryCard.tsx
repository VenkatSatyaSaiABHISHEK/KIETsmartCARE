import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { HeartPulse, CheckCircle2, AlertTriangle, PhoneCall } from 'lucide-react-native';
import { RecoveryInquiry } from '../types/student';
import { EMERGENCY_CONTACTS } from '../constants/shared';

interface RecoveryCardProps {
  inquiry: RecoveryInquiry;
  onAnswer: (response: 'better' | 'same' | 'worse') => void;
}

export function RecoveryCard({ inquiry, onAnswer }: RecoveryCardProps) {
  const [answeredState, setAnsweredState] = useState<'better' | 'same' | 'worse' | null>(
    inquiry.status || null
  );

  const handleSelect = (response: 'better' | 'same' | 'worse') => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(
          response === 'better'
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Warning
        );
      } catch {}
    }

    setAnsweredState(response);
    onAnswer(response);
  };

  const handleContactDoctor = () => {
    Linking.openURL(`tel:${EMERGENCY_CONTACTS.CAMPUS_HEALTH_CENTRE}`);
  };

  if (answeredState === 'better') {
    return (
      <View style={[styles.card, styles.cardSuccess]}>
        <View style={styles.headerRow}>
          <CheckCircle2 size={20} color="#059669" />
          <Text style={styles.successTitle}>Glad you are feeling better!</Text>
        </View>
        <Text style={styles.subtext}>
          Your recovery check for &ldquo;{inquiry.problem_name}&rdquo; has been confirmed and logged with campus health.
        </Text>
      </View>
    );
  }

  const isEscalated = answeredState === 'same' || answeredState === 'worse';

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <HeartPulse size={18} color="#0284C7" />
        <Text style={styles.badgeText}>POST-COURSE RECOVERY CHECK</Text>
      </View>
      <Text style={styles.title}>How are you feeling?</Text>
      <Text style={styles.subtext}>
        Your prescription course ended recently. Please confirm your current health status for doctor follow-up:
      </Text>

      {isEscalated ? (
        <View style={styles.escalatedBox}>
          <View style={styles.escalatedHeader}>
            <AlertTriangle size={16} color="#B91C1C" />
            <Text style={styles.escalatedHeading}>
              {answeredState === 'worse' ? 'Alert Logged: Feeling Worse' : 'Alert Logged: Symptoms Unchanged'}
            </Text>
          </View>
          <Text style={styles.escalatedText}>
            A high-priority alert was dispatched to your doctor and Health Officer. An officer may reach out to check on you.
          </Text>
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={handleContactDoctor}
            activeOpacity={0.8}
          >
            <PhoneCall size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.contactBtnText}>Call Campus Health Centre</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.btn, styles.btnBetter]}
            onPress={() => handleSelect('better')}
            activeOpacity={0.8}
          >
            <Text style={styles.btnBetterText}>Better</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnSame]}
            onPress={() => handleSelect('same')}
            activeOpacity={0.8}
          >
            <Text style={styles.btnSameText}>Same</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnWorse]}
            onPress={() => handleSelect('worse')}
            activeOpacity={0.8}
          >
            <Text style={styles.btnWorseText}>Worse</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardSuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F1B33',
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
  },
  subtext: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  btnBetter: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  btnBetterText: {
    color: '#065F46',
    fontSize: 13,
    fontWeight: '700',
  },
  btnSame: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  btnSameText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '700',
  },
  btnWorse: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  btnWorseText: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '700',
  },
  escalatedBox: {
    padding: 14,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  escalatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  escalatedHeading: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '700',
  },
  escalatedText: {
    color: '#7F1D1D',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  contactBtn: {
    backgroundColor: '#B91C1C',
    borderRadius: 8,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  contactBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
