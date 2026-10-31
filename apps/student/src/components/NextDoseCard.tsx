import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { DoseScheduleRecord } from '../types/student';
import { ReminderEngine } from '../services/reminder-engine';

interface NextDoseCardProps {
  dose: DoseScheduleRecord | null;
  onAnswerDose: (doseId: string, status: 'taken' | 'taken_late' | 'not_taken') => void;
}

export function NextDoseCard({ dose, onAnswerDose }: NextDoseCardProps) {
  const [showMissedAdvisory, setShowMissedAdvisory] = useState(false);

  if (!dose) {
    return (
      <View style={[styles.card, styles.emptyCard]}>
        <CheckCircle2 color="#4ade80" size={32} />
        <Text style={styles.emptyTitle}>All doses completed for today</Text>
        <Text style={styles.emptySub}>
          Next scheduled medication alarms will sync automatically.
        </Text>
      </View>
    );
  }

  const triggerHaptic = (type: 'success' | 'warning' | 'error') => {
    try {
      if (type === 'success') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (type === 'warning') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      // Haptics fallback on web or unsupported platforms
    }
  };

  const handleTaken = () => {
    triggerHaptic('success');
    setShowMissedAdvisory(false);
    onAnswerDose(dose.id, 'taken');
  };

  const handleTakenLate = () => {
    triggerHaptic('warning');
    setShowMissedAdvisory(false);
    onAnswerDose(dose.id, 'taken_late');
  };

  const handleNotTaken = () => {
    triggerHaptic('error');
    setShowMissedAdvisory(true);
    onAnswerDose(dose.id, 'not_taken');
  };

  const relationText = dose.meal_relation === 'after' ? 'After' : 'Before';
  const mealText = dose.meal_slot.charAt(0).toUpperCase() + dose.meal_slot.slice(1);

  return (
    <View style={styles.card}>
      {/* Top Header Badge */}
      <View style={styles.cardHeader}>
        <View style={styles.timingPill}>
          <Clock color="#ffffff" size={13} />
          <Text style={styles.timingPillText}>
            {relationText} {mealText} &bull; {dose.scheduled_time}
          </Text>
        </View>

        {/* Circular Progress Ring Indicator */}
        <View style={styles.progressRingBadge}>
          <Text style={styles.progressRingText}>NEXT</Text>
        </View>
      </View>

      {/* Main Medicine Name & Dose */}
      <View style={styles.contentSection}>
        <Text style={styles.medicineName}>{dose.medicine_name}</Text>
        <Text style={styles.doseQuantity}>
          Take {dose.dose} &bull; {relationText} {mealText}
        </Text>
      </View>

      {/* Three Big Buttons (Taken, Taken late, Not taken) */}
      {dose.status === 'scheduled' || dose.status === 'unconfirmed' ? (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.takenBtn]}
            onPress={handleTaken}
            activeOpacity={0.85}
          >
            <Check color="#0a0a0a" size={16} />
            <Text style={styles.takenBtnText}>Taken</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.lateBtn]}
            onPress={handleTakenLate}
            activeOpacity={0.85}
          >
            <Text style={styles.lateBtnText}>Taken Late</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.skipBtn]}
            onPress={handleNotTaken}
            activeOpacity={0.85}
          >
            <Text style={styles.skipBtnText}>Not Taken</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.statusRecordedBox}>
          <CheckCircle2 color="#4ade80" size={16} />
          <Text style={styles.statusRecordedText}>
            Status logged: {dose.status.replace('_', ' ').toUpperCase()} at {dose.confirmed_at || 'Just now'}
          </Text>
        </View>
      )}

      {/* Mandatory Missed-Dose Safety Advisory (NEVER tell student to double) */}
      {showMissedAdvisory && (
        <View style={styles.advisoryContainer}>
          <AlertCircle color="#fca5a5" size={18} style={styles.advisoryIcon} />
          <View style={styles.advisoryTextWrapper}>
            <Text style={styles.advisoryHeading}>Missed Dose Safety Notice</Text>
            <Text style={styles.advisoryBody}>
              {ReminderEngine.getMissedDoseAdvisory()}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0a0a0a', // Black rounded card
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 8,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySub: {
    color: '#a1a1aa',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  timingPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  progressRingBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#60a5fa',
  },
  contentSection: {
    marginBottom: 22,
  },
  medicineName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  doseQuantity: {
    fontSize: 14,
    color: '#d4d4d8',
    marginTop: 4,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  takenBtn: {
    backgroundColor: '#ffffff',
  },
  takenBtnText: {
    color: '#0a0a0a',
    fontSize: 13,
    fontWeight: '700',
  },
  lateBtn: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  lateBtnText: {
    color: '#fbbf24', // Amber
    fontSize: 13,
    fontWeight: '600',
  },
  skipBtn: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  skipBtnText: {
    color: '#f87171', // Soft Red
    fontSize: 13,
    fontWeight: '600',
  },
  statusRecordedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18181b',
    padding: 12,
    borderRadius: 14,
    gap: 8,
  },
  statusRecordedText: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '600',
  },
  advisoryContainer: {
    marginTop: 16,
    backgroundColor: '#271012',
    borderWidth: 1,
    borderColor: '#7f1d1d',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  advisoryIcon: {
    marginTop: 1,
  },
  advisoryTextWrapper: {
    flex: 1,
  },
  advisoryHeading: {
    color: '#fecaca',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  advisoryBody: {
    color: '#fca5a5',
    fontSize: 12,
    lineHeight: 16,
  },
});
