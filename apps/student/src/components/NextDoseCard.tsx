import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Pill, Clock, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { DoseScheduleRecord } from '../types/student';
import { MISSED_DOSE_ADVISORY } from '../constants/shared';

interface NextDoseCardProps {
  dose: DoseScheduleRecord | null;
  allTodayDoses?: DoseScheduleRecord[];
  onAnswerDose: (doseId: string, status: 'taken' | 'taken_late' | 'not_taken') => void;
}

export function NextDoseCard({ dose, allTodayDoses = [], onAnswerDose }: NextDoseCardProps) {
  const [showMissedAdvisory, setShowMissedAdvisory] = useState(false);

  if (!dose) {
    return (
      <View style={styles.cardContainer}>
        <View style={styles.emptyIconCircle}>
          <CheckCircle2 size={24} color="#059669" />
        </View>
        <Text style={styles.emptyTitle}>All caught up for now</Text>
        <Text style={styles.emptySubtext}>
          No doses are currently scheduled. When your doctor prescribes medication, your schedule and dose reminders will appear here.
        </Text>
      </View>
    );
  }

  // Calculate doses taken today
  const totalToday = allTodayDoses.length || 1;
  const takenToday = allTodayDoses.filter((d) => d.status === 'taken' || d.status === 'taken_late').length;

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {
        // web fallback
      }
    }
  };

  const handleResponse = (status: 'taken' | 'taken_late' | 'not_taken') => {
    triggerHaptic();
    if (status === 'not_taken') {
      setShowMissedAdvisory(true);
    } else {
      setShowMissedAdvisory(false);
    }
    onAnswerDose(dose.id, status);
  };

  const mealText = dose.meal_relation === 'after' ? 'After' : 'Before';
  const rawSlot = dose.slot || dose.meal_slot || 'Meal';
  const slotName = rawSlot.charAt(0).toUpperCase() + rawSlot.slice(1);
  const timeHeading = `${mealText} ${slotName} \u00B7 ${dose.time || dose.scheduled_time}`;

  return (
    <View style={styles.cardContainer}>
      {/* Header: Label + Progress */}
      <View style={styles.topRow}>
        <View style={styles.labelRow}>
          <Clock size={14} color="#0284C7" />
          <Text style={styles.label}>NEXT SCHEDULED DOSE</Text>
        </View>
        <View style={styles.progressPill}>
          <Text style={styles.progressText}>
            {takenToday}/{totalToday} COMPLETED
          </Text>
        </View>
      </View>

      {/* Time Heading */}
      <Text style={styles.timeHeading}>{timeHeading}</Text>

      {/* Medicines Box */}
      <View style={styles.medsBox}>
        <View style={styles.medIconBox}>
          <Pill size={18} color="#0F1B33" />
        </View>
        <View style={styles.medRow}>
          <Text style={styles.medName}>{dose.medicine_name}</Text>
          <Text style={styles.medDose}>
            {dose.tablets ? `${dose.tablets} tablet${dose.tablets > 1 ? 's' : ''}` : dose.dose || '1 tablet'}
          </Text>
        </View>
      </View>

      {/* Three Response Buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[styles.btn, styles.btnTaken]}
          onPress={() => handleResponse('taken')}
          activeOpacity={0.8}
        >
          <Text style={styles.btnTakenText}>Taken</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnLate]}
          onPress={() => handleResponse('taken_late')}
          activeOpacity={0.8}
        >
          <Text style={styles.btnLateText}>Taken Late</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnMissed]}
          onPress={() => handleResponse('not_taken')}
          activeOpacity={0.8}
        >
          <Text style={styles.btnMissedText}>Missed</Text>
        </TouchableOpacity>
      </View>

      {/* Missed Advisory Box */}
      {showMissedAdvisory && (
        <View style={styles.advisoryBox}>
          <View style={styles.advisoryHeader}>
            <AlertCircle size={14} color="#B91C1C" />
            <Text style={styles.advisoryHeading}>Missed Dose Safety Advisory</Text>
          </View>
          <Text style={styles.advisoryText}>{MISSED_DOSE_ADVISORY}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    letterSpacing: 0.8,
  },
  progressPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  progressText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timeHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F1B33',
    marginBottom: 16,
  },
  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F1B33',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  medsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  medIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  medRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medName: {
    color: '#0F1B33',
    fontSize: 15,
    fontWeight: '700',
  },
  medDose: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  btnRow: {
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
  btnTaken: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  btnTakenText: {
    color: '#065F46',
    fontSize: 13,
    fontWeight: '700',
  },
  btnLate: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  btnLateText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '700',
  },
  btnMissed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  btnMissedText: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '700',
  },
  advisoryBox: {
    marginTop: 14,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  advisoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  advisoryHeading: {
    color: '#991B1B',
    fontSize: 12,
    fontWeight: '700',
  },
  advisoryText: {
    color: '#7F1D1D',
    fontSize: 11,
    lineHeight: 16,
  },
});
