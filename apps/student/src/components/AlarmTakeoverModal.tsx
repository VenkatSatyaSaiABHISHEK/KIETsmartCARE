import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Modal,
  Platform,
} from 'react-native';
import { BellRing, Check, Clock, Pill, Volume2, X } from 'lucide-react-native';
import { DoseScheduleRecord } from '../types/student';

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

  const scheduledTimeStr = dose.time || dose.scheduled_time || 'Now';
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

        {/* Top Header Tag */}
        <View style={styles.tagWrap}>
          <Volume2 size={14} color="#38BDF8" />
          <Text style={styles.tagText}>CAMPUS CLINIC \u2022 MEDICINE ALARM</Text>
        </View>

        {/* Big Time Display */}
        <Text style={styles.bigTimeText}>{scheduledTimeStr}</Text>
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
                {doseText} \u2022 {mealRelation}
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
    top: 48,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  tagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1.2,
  },
  bigTimeText: {
    fontSize: 54,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -1,
    marginTop: 12,
  },
  reminderNoticeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginTop: -4,
  },
  bellCenterStage: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 10,
  },
  radarRipple: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(239, 68, 68, 0.35)',
  },
  bellGlowCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  medCard: {
    width: '100%',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
    padding: 18,
    marginVertical: 14,
  },
  medCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
  },
  pillIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
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
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  medAdvisory: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 16,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  btnTakenPrimary: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  btnTakenPrimaryText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  btnLateSecondary: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  btnLateSecondaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FBBF24',
  },
  btnSnooze: {
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 2,
  },
  btnSnoozeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    textDecorationLine: 'underline',
  },
});

