import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Pill, Clock, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react-native';
import { DoseScheduleRecord } from '../types/student';
import { MISSED_DOSE_ADVISORY, formatTime12h } from '../constants/shared';

interface NextDoseCardProps {
  dose: DoseScheduleRecord | null;
  allTodayDoses?: DoseScheduleRecord[];
  onAnswerDose: (doseId: string, status: 'taken' | 'taken_late' | 'not_taken') => void;
}

export function NextDoseCard({ dose, allTodayDoses = [], onAnswerDose }: NextDoseCardProps) {
  const [showMissedAdvisory, setShowMissedAdvisory] = useState(false);

  // Doses due at this exact same time
  const siblingDoses = dose
    ? allTodayDoses.filter(
        (d) =>
          (d.status === 'scheduled' || d.status === 'unconfirmed') &&
          (d.id === dose.id ||
            (d.scheduled_at && d.scheduled_at === dose.scheduled_at) ||
            ((d.time || d.scheduled_time) && (d.time || d.scheduled_time) === (dose.time || dose.scheduled_time)))
      )
    : [];

  const activeDoses = siblingDoses.length > 0 ? siblingDoses : dose ? [dose] : [];

  if (!dose || activeDoses.length === 0) {
    return (
      <View style={styles.cardContainer}>
        <View style={styles.emptyIconCircle}>
          <CheckCircle2 size={24} color="#059669" />
        </View>
        <Text style={styles.emptyTitle}>All caught up for now</Text>
        <Text style={styles.emptySubtext}>
          No doses are currently pending. When your doctor prescribes medication, your schedule and dose reminders will appear here.
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
      } catch {}
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

  return (
    <View style={styles.cardContainer}>
      {/* Header: Label + Progress Badge */}
      <View style={styles.topRow}>
        <View style={styles.labelRow}>
          <Clock size={14} color="#1D4ED8" />
          <Text style={styles.label}>NEXT SCHEDULED DOSE</Text>
        </View>
        <View style={styles.progressPill}>
          <Text style={styles.progressText}>
            {takenToday}/{totalToday} COMPLETED
          </Text>
        </View>
      </View>

      {/* Big Hero Time Heading */}
      <View style={styles.heroTimeRow}>
        <Text style={styles.slotNameText}>{mealText} {slotName}</Text>
        <Text style={styles.timeDotText}>•</Text>
        <Text style={styles.timeDigitsText}>{formattedTime}</Text>
      </View>

      {/* Medicines Box: renders all sibling tablets clearly */}
      <View style={styles.medsBox}>
        {activeDoses.map((item, idx) => (
          <View key={item.id || idx} style={[styles.medRow, idx > 0 && styles.medRowBorder]}>
            <View style={styles.medIconBox}>
              <Pill size={16} color="#0F1B33" />
            </View>
            <View style={styles.medInfoCol}>
              <Text style={styles.medName}>{item.medicine_name}</Text>
              <Text style={styles.medDose}>
                {item.tablets ? `${item.tablets} tablet${item.tablets > 1 ? 's' : ''}` : item.dose || '1 tablet'} • {mealText} Food
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Three Response Action Buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.btnTaken]}
          onPress={() => handleResponse('taken')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnTakenText}>Mark Taken</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.btnLate]}
          onPress={() => handleResponse('taken_late')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnLateText}>Taken Late</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.btnMissed]}
          onPress={() => handleResponse('not_taken')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnMissedText}>Missed</Text>
        </TouchableOpacity>
      </View>

      {/* Missed Dose Advisory */}
      {showMissedAdvisory && (
        <View style={styles.advisoryBox}>
          <ShieldAlert size={16} color="#991B1B" />
          <Text style={styles.advisoryText}>{MISSED_DOSE_ADVISORY}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#0F1B33',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 14px rgba(15,27,51,0.06)',
      },
    }),
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
    letterSpacing: 1.1,
    color: '#1D4ED8',
    textTransform: 'uppercase',
  },
  progressPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.5,
  },
  heroTimeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 14,
  },
  slotNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F1B33',
  },
  timeDotText: {
    fontSize: 18,
    color: '#94A3B8',
  },
  timeDigitsText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0284C7',
  },
  medsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  medRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  medIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  medInfoCol: {
    flex: 1,
  },
  medName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F1B33',
  },
  medDose: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTaken: {
    backgroundColor: '#0F1B33',
  },
  btnTakenText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  btnLate: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#0F1B33',
  },
  btnLateText: {
    color: '#0F1B33',
    fontSize: 13,
    fontWeight: '700',
  },
  btnMissed: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  btnMissedText: {
    color: '#BE123C',
    fontSize: 13,
    fontWeight: '700',
  },
  advisoryBox: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 10,
    alignItems: 'flex-start',
  },
  advisoryText: {
    flex: 1,
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 16,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DCFCE7',
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
