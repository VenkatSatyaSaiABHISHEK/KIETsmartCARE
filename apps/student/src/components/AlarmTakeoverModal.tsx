import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Modal,
} from 'react-native';
import { BellRing, Check, Clock, Pill, Volume2, X } from 'lucide-react-native';
import { DoseScheduleRecord } from '../types/student';
import { formatTime12h } from '../constants/shared';

interface AlarmTakeoverModalProps {
  dose: DoseScheduleRecord | null;
  visible: boolean;
  onTakeDose: (doseId: string, status: 'taken' | 'taken_late') => void;
  onSnooze: (doseId: string) => void;
  onDismiss: () => void;
}

export function AlarmTakeoverModal({
  dose,
  visible,
  onTakeDose,
  onSnooze,
  onDismiss,
}: AlarmTakeoverModalProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(1)).current;
  const rippleOpacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      // Continuous pulse animation for the ringing bell
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.18,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.95,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );

      // Expanding radar ripple ring
      const rippleLoop = Animated.loop(
        Animated.parallel([
          Animated.timing(rippleAnim, {
            toValue: 2.2,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(rippleOpacity, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );

      pulseLoop.start();
      rippleLoop.start();

      return () => {
        pulseLoop.stop();
        rippleLoop.stop();
      };
    }
  }, [visible]);

  if (!visible || !dose) return null;

  // Format 12-hour AM/PM string accurately from scheduled_at ISO timestamp or time string
  const displayTime = formatTime12h(dose.scheduled_at || dose.time || dose.scheduled_time);
  const medName = dose.medicine_name || 'Prescribed Tablet';
  const doseText = dose.tablets ? `${dose.tablets} tablet` : dose.dose || '1 tablet';
  const mealRelation = dose.meal_relation === 'after' ? 'After food' : 'Before food';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
    >
      <View style={styles.fullscreenContainer}>
        {/* Subtle dismiss in top corner */}
        <TouchableOpacity
          style={styles.closeCornerBtn}
          onPress={onDismiss}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <X size={22} color="#94A3B8" />
        </TouchableOpacity>

        {/* Top Header Tag - Notice clean bullet symbol • without literal \\u2022 */}
        <View style={styles.tagWrap}>
          <Volume2 size={14} color="#38BDF8" />
          <Text style={styles.tagText}>CAMPUS CLINIC • MEDICINE ALARM</Text>
        </View>

        {/* Big Time Display */}
        <Text style={styles.bigTimeText}>{displayTime}</Text>
        <Text style={styles.reminderNoticeText}>SCHEDULED TIME HAS ARRIVED</Text>

        {/* Central Animated Ringing Bell */}
        <View style={styles.bellCenterStage}>
          <Animated.View
            style={[
              styles.radarRipple,
              {
                transform: [{ scale: rippleAnim }],
                opacity: rippleOpacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.bellGlowCircle,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <BellRing size={52} color="#FFFFFF" strokeWidth={2.4} />
          </Animated.View>
        </View>

        {/* Medication Details Card */}
        <View style={styles.medCard}>
          <View style={styles.medCardTop}>
            <View style={styles.pillIconBox}>
              <Pill size={22} color="#0284C7" />
            </View>
            <View style={styles.medCardText}>
              <Text style={styles.medCardName}>{medName}</Text>
              <Text style={styles.medCardMeta}>
                {doseText} • {mealRelation}
              </Text>
            </View>
          </View>
          <Text style={styles.medAdvisory}>
            Please take this dose with a full glass of water.
          </Text>
        </View>

        {/* Large Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.btnTakenPrimary}
            activeOpacity={0.85}
            onPress={() => onTakeDose(dose.id, 'taken')}
          >
            <Check size={24} color="#FFFFFF" strokeWidth={2.8} />
            <Text style={styles.btnTakenPrimaryText}>Mark Taken</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnLateSecondary}
            activeOpacity={0.85}
            onPress={() => onTakeDose(dose.id, 'taken_late')}
          >
            <Clock size={20} color="#F59E0B" />
            <Text style={styles.btnLateSecondaryText}>Taken Late</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSnooze}
            activeOpacity={0.7}
            onPress={() => onSnooze(dose.id)}
          >
            <Text style={styles.btnSnoozeText}>Snooze for 5 minutes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#0F172A', // Deep Clinical Navy
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  closeCornerBtn: {
    position: 'absolute',
    top: 54,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  tagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(2, 132, 199, 0.16)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 20,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 1.2,
  },
  bigTimeText: {
    fontSize: 56,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginTop: 10,
  },
  reminderNoticeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 1.4,
    marginTop: -8,
  },
  bellCenterStage: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  radarRipple: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  bellGlowCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  medCard: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    borderColor: '#334155',
    borderWidth: 1,
  },
  medCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  pillIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medCardText: {
    flex: 1,
  },
  medCardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  medCardMeta: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
  },
  medAdvisory: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 12,
    lineHeight: 18,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 10,
  },
  btnTakenPrimary: {
    width: '100%',
    height: 56,
    backgroundColor: '#059669',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  btnTakenPrimaryText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnLateSecondary: {
    width: '100%',
    height: 52,
    backgroundColor: '#1E293B',
    borderColor: '#F59E0B',
    borderWidth: 1.5,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnLateSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
  },
  btnSnooze: {
    width: '100%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSnoozeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#38BDF8',
  },
});
