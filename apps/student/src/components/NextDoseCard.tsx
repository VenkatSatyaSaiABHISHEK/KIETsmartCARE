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
import { MISSED_DOSE_ADVISORY, formatTime12h } from '../constants/shared';

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
  const formattedTime = formatTime12h(dose.scheduled_at || dose.time || dose.scheduled_time);
  const timeHeading = `${mealText} ${slotName} • ${formattedTime}`;

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
          activeOpacity={0.8}
          onPress={() => handleResponse('taken')}
        >
          <Text style={styles.btnTakenText}>Taken</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnTakenLate]}
          activeOpacity={0.8}
          onPress={() => handleResponse('taken_late')}
        >
          <Text style={styles.btnTakenLateText}>Taken Late</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnMissed]}
          activeOpacity={0.8}
          onPress={() => handleResponse('not_taken')}
        >
          <Text style={styles.btnMissedText}>Missed</Text>
        </TouchableOpacity>
      </View>

      {/* Missed dose clinical guidance banner */}
      {showMissedAdvisory && (
        <View style={styles.advisoryBanner}>
          <AlertCircle size={16} color="#DC2626" style={styles.advisoryIcon} />
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
    padding: 18,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#0F1B33',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  timeHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F1B33',
    marginBottom: 14,
  },
  medsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  medIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
    fontSize: 15,
    fontWeight: '600',
    color: '#0F1B33',
  },
  medDose: {
    fontSize: 13,
    color: '#64748B',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  btnTaken: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  btnTakenText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  btnTakenLate: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  btnTakenLateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
  },
  btnMissed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  btnMissedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  advisoryBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    alignItems: 'flex-start',
  },
  advisoryIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  advisoryText: {
    flex: 1,
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 16,
  },
  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F1B33',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
});
