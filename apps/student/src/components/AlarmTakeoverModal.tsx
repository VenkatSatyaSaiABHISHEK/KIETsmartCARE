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
  // Ultra-smooth physics animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim1 = useRef(new Animated.Value(1)).current;
  const rippleAnim2 = useRef(new Animated.Value(1)).current;
  const rippleOpacity1 = useRef(new Animated.Value(0.7)).current;
  const rippleOpacity2 = useRef(new Animated.Value(0.5)).current;
  const bellShake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // 1. Central Heartbeat Pulse
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.95,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
        ])
      );

      // 2. Bell energetic ring shake
      const shakeLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(bellShake, { toValue: 8, duration: 60, useNativeDriver: true }),
          Animated.timing(bellShake, { toValue: -8, duration: 60, useNativeDriver: true }),
          Animated.timing(bellShake, { toValue: 6, duration: 60, useNativeDriver: true }),
          Animated.timing(bellShake, { toValue: -6, duration: 60, useNativeDriver: true }),
          Animated.timing(bellShake, { toValue: 0, duration: 60, useNativeDriver: true }),
          Animated.delay(600),
        ])
      );

      // 3. Double Sonic Waves
      const waveLoop1 = Animated.loop(
        Animated.parallel([
          Animated.timing(rippleAnim1, {
            toValue: 2.4,
            duration: 1400,
            useNativeDriver: true,
          }),
          Animated.timing(rippleOpacity1, {
            toValue: 0,
            duration: 1400,
            useNativeDriver: true,
          }),
        ])
      );

      const waveLoop2 = Animated.loop(
        Animated.sequence([
          Animated.delay(400),
          Animated.parallel([
            Animated.timing(rippleAnim2, {
              toValue: 2.2,
              duration: 1400,
              useNativeDriver: true,
            }),
            Animated.timing(rippleOpacity2, {
              toValue: 0,
              duration: 1400,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      pulseLoop.start();
      shakeLoop.start();
      waveLoop1.start();
      waveLoop2.start();

      return () => {
        pulseLoop.stop();
        shakeLoop.stop();
        waveLoop1.stop();
        waveLoop2.stop();
      };
    }
  }, [visible]);

  if (!visible || !dose) return null;

  const displayTime = formatTime12h(dose.scheduled_at || dose.time || dose.scheduled_time);
  const medName = dose.medicine_name || 'Prescribed Medicine';
  const doseText = dose.tablets ? `${dose.tablets} tablet${dose.tablets > 1 ? 's' : ''}` : dose.dose || '1 tablet';
  const mealRelation = dose.meal_relation === 'after' ? 'After food' : 'Before food';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
    >
      <View style={styles.fullscreenContainer}>
        {/* Top Header Dismiss */}
        <TouchableOpacity
          style={styles.closeCornerBtn}
          onPress={onDismiss}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          activeOpacity={0.7}
        >
          <X size={22} color="#94A3B8" />
        </TouchableOpacity>

        {/* Dynamic Medical Brand Tag */}
        <View style={styles.topStage}>
          <View style={styles.alarmBadge}>
            <Volume2 size={15} color="#38BDF8" />
            <Text style={styles.alarmBadgeText}>CAMPUS CLINIC • MEDICINE ALARM</Text>
          </View>

          {/* Time with Glow Typography */}
          <Text style={styles.bigTimeText}>{displayTime}</Text>
          <Text style={styles.reminderNoticeText}>SCHEDULED DOSE TIME HAS ARRIVED</Text>
        </View>

        {/* Hero Animated Sound Bell Stage */}
        <View style={styles.bellCenterStage}>
          <Animated.View
            style={[
              styles.radarRipple,
              {
                transform: [{ scale: rippleAnim1 }],
                opacity: rippleOpacity1,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.radarRippleSecondary,
              {
                transform: [{ scale: rippleAnim2 }],
                opacity: rippleOpacity2,
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
            <Animated.View style={{ transform: [{ rotate: bellShake.interpolate({ inputRange: [-10, 10], outputRange: ['-10deg', '10deg'] }) }] }}>
              <BellRing size={56} color="#FFFFFF" strokeWidth={2.4} />
            </Animated.View>
          </Animated.View>
        </View>

        {/* Medicine Dose Details Card */}
        <View style={styles.medCard}>
          <View style={styles.medCardTop}>
            <View style={styles.pillIconBox}>
              <Pill size={24} color="#0284C7" />
            </View>
            <View style={styles.medCardText}>
              <Text style={styles.medCardName}>{medName}</Text>
              <Text style={styles.medCardMeta}>
                {doseText} • {mealRelation}
              </Text>
            </View>
          </View>
          <Text style={styles.medAdvisory}>
            Take this prescribed dose with a glass of water.
          </Text>
        </View>

        {/* Action Controls */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.btnTakenPrimary}
            activeOpacity={0.85}
            onPress={() => onTakeDose(dose.id, 'taken')}
          >
            <Check size={22} color="#FFFFFF" strokeWidth={2.8} />
            <Text style={styles.btnTakenPrimaryText}>Mark Taken</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnLateSecondary}
            activeOpacity={0.85}
            onPress={() => onTakeDose(dose.id, 'taken_late')}
          >
            <Clock size={18} color="#F59E0B" />
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
    backgroundColor: '#0A0F1D', // Premium Deep Obsidian Navy
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 56,
    paddingHorizontal: 24,
  },
  closeCornerBtn: {
    position: 'absolute',
    top: 50,
    right: 24,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  topStage: {
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  alarmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(2, 132, 199, 0.16)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    marginBottom: 14,
  },
  alarmBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 1.2,
  },
  bigTimeText: {
    fontSize: 58,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  reminderNoticeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 1.4,
    marginTop: 4,
  },
  bellCenterStage: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  radarRipple: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  radarRippleSecondary: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1.5,
    borderColor: '#F87171',
  },
  bellGlowCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.65,
    shadowRadius: 24,
    elevation: 16,
  },
  medCard: {
    width: '100%',
    backgroundColor: '#151E32',
    borderRadius: 20,
    padding: 20,
    borderColor: '#24324F',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  medCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  pillIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(2, 132, 199, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
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
    fontWeight: '500',
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
    marginBottom: 6,
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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  btnTakenPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  btnLateSecondary: {
    width: '100%',
    height: 50,
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
    fontSize: 15,
    fontWeight: '600',
    color: '#F59E0B',
  },
  btnSnooze: {
    width: '100%',
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSnoozeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#38BDF8',
  },
});
