import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Modal,
  Platform,
  useWindowDimensions,
  Linking,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Svg, Path } from 'react-native-svg';
import { DoseScheduleRecord, StudentProfileData } from '../types/student';
import { formatTime12h, EMERGENCY_CONTACTS } from '../constants/shared';

// DESIGN TOKENS (Strictly White, Ink Navy #0F1B33, Deep Blue #1D4ED8, Greys #6B7280 & #E5E7EB)
export const ALARM_THEME = {
  bg: '#FFFFFF',
  navy: '#0F1B33',
  blue: '#1D4ED8',
  greyDark: '#6B7280',
  greyBorder: '#E5E7EB',
  white: '#FFFFFF',
};

interface AlarmTakeoverModalProps {
  dose: DoseScheduleRecord | null;
  allDueDoses?: DoseScheduleRecord[];
  allTodayDoses?: DoseScheduleRecord[];
  profile?: StudentProfileData | null;
  visible: boolean;
  onTakeDose: (doseId: string, status: 'taken' | 'taken_late', lateMinutes?: number) => void;
  onNotTaken: (doseId: string) => void;
  onDismiss: () => void;
}

export function AlarmTakeoverModal({
  dose,
  allDueDoses = [],
  allTodayDoses = [],
  profile,
  visible,
  onTakeDose,
  onNotTaken,
  onDismiss,
}: AlarmTakeoverModalProps) {
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const isCompactHeight = windowHeight < 700;

  // Screen View States: 'ringing' | 'recorded' | 'late_sheet' | 'not_taken_screen'
  const [viewState, setViewState] = useState<'ringing' | 'recorded' | 'late_sheet' | 'not_taken_screen'>('ringing');
  const [chosenLateMinutes, setChosenLateMinutes] = useState<number>(0);

  // Reanimated / Native Driver Animation Values
  const fadeUpAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(10)).current;
  const recordedFadeAnim = useRef(new Animated.Value(0)).current;
  const checkDrawAnim = useRef(new Animated.Value(0)).current;
  const screenFadeOutAnim = useRef(new Animated.Value(1)).current;

  // Stagger entrance on open
  useEffect(() => {
    if (visible) {
      setViewState('ringing');
      fadeUpAnim.setValue(0);
      translateYAnim.setValue(10);
      recordedFadeAnim.setValue(0);
      checkDrawAnim.setValue(0);
      screenFadeOutAnim.setValue(1);

      Animated.parallel([
        Animated.timing(fadeUpAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Consolidate doses due together (Max 4 groups shown)
  const groupedDoses = useMemo(() => {
    if (allDueDoses && allDueDoses.length > 0) return allDueDoses.slice(0, 4);
    if (dose) return [dose];
    return [];
  }, [allDueDoses, dose]);

  if (!visible || !dose) return null;

  // Extract First Name from Student Profile
  const rawFullName = profile?.full_name || 'Student';
  const firstName = rawFullName.trim().split(' ')[0] || 'Student';
  const hasLongName = firstName.length > 14;

  // Scheduled Time Display (12h Asia/Kolkata format)
  const displayTime = formatTime12h(dose.scheduled_at || dose.time || dose.scheduled_time);
  const [timeDigits, timeMeridian] = displayTime.split(' ');

  // Meal Label formatting (Small-caps with letter spacing: e.g. "AFTER LUNCH", "BEFORE BREAKFAST")
  const mealRelation = dose.meal_relation === 'before' ? 'BEFORE' : 'AFTER';
  const mealSlotRaw = (dose.slot || dose.meal_slot || 'LUNCH').toUpperCase();
  const mealLabel = `${mealRelation} ${mealSlotRaw}`;

  // Next Dose calculation for the "Recorded" sequence
  const nextDoseObj = allTodayDoses.find(
    (d) => (d.status === 'scheduled' || d.status === 'unconfirmed') && d.id !== dose.id
  );
  const nextDoseLine = nextDoseObj
    ? `Next dose today, ${formatTime12h(nextDoseObj.scheduled_at || nextDoseObj.time || nextDoseObj.scheduled_time)}`
    : 'Course complete';

  // Haptic feedback trigger
  const triggerButtonHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
  };

  // Play Recorded Sequence (~1.4s total, auto-dismiss, no Done / Undo)
  const triggerRecordedSequence = (status: 'taken' | 'taken_late', lateMins = 0) => {
    triggerButtonHaptic();
    setViewState('recorded');

    // 1. Fade in recorded check & text over 400ms
    Animated.parallel([
      Animated.timing(recordedFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(checkDrawAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Hold for 600ms
      setTimeout(() => {
        // 3. Fade out whole screen over 250ms and complete
        Animated.timing(screenFadeOutAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          onTakeDose(dose.id, status, lateMins);
        });
      }, 600);
    });
  };

  // Handle Mark Taken
  const handleMarkTaken = () => {
    triggerRecordedSequence('taken', 0);
  };

  // Handle Late Selection
  const handleSelectLateOption = (minutes: number) => {
    setChosenLateMinutes(minutes);
    triggerRecordedSequence('taken_late', minutes);
  };

  // Handle Not Taken screen
  const handleOpenNotTaken = () => {
    triggerButtonHaptic();
    setViewState('not_taken_screen');
  };

  const handleConfirmNotTaken = () => {
    triggerButtonHaptic();
    onNotTaken(dose.id);
  };

  const handleCallDoctor = () => {
    Linking.openURL(`tel:${EMERGENCY_CONTACTS.OPD_DOCTOR}`);
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={false}
      statusBarTranslucent
    >
      <Animated.View style={[styles.rootContainer, { opacity: screenFadeOutAnim }]}>
        {/* ========================================================= */}
        {/* VIEW 1: RECORDED CONFIRMATION SCREEN (Right side of image) */}
        {/* ========================================================= */}
        {viewState === 'recorded' && (
          <Animated.View style={[styles.recordedContent, { opacity: recordedFadeAnim }]}>
            {/* Top Brand Marker */}
            <Text style={styles.topBrand}>KIET Smart Care</Text>

            {/* Checkmark drawing */}
            <View style={styles.checkWrapper}>
              <Svg width={72} height={72} viewBox="0 0 72 72" fill="none">
                <Path
                  d="M14 36 L28 50 L58 18"
                  stroke={ALARM_THEME.navy}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>

            {/* "Recorded" Serif Headline */}
            <Text style={styles.recordedHeadline}>Recorded</Text>

            {/* Next dose or Course Complete */}
            <Text style={styles.nextDoseSub}>{nextDoseLine}</Text>
          </Animated.View>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: CALM "NOT TAKEN" SCREEN (Clinical Prescription Guidance) */}
        {/* ========================================================= */}
        {viewState === 'not_taken_screen' && (
          <View style={styles.notTakenContainer}>
            <Text style={styles.topBrand}>KIET Smart Care</Text>

            <View style={styles.notTakenCenterBlock}>
              <Text style={styles.notTakenHeadline}>Please follow your prescription</Text>
              <Text style={styles.notTakenSub}>Or contact your doctor.</Text>
              <Text style={styles.notTakenPhone}>Campus Medical Center: {EMERGENCY_CONTACTS.CAMPUS_CLINIC}</Text>
            </View>

            <View style={styles.bottomBtnGroup}>
              <TouchableOpacity
                style={styles.primaryNavyBtn}
                activeOpacity={0.9}
                onPress={handleCallDoctor}
              >
                <Text style={styles.primaryNavyBtnText}>Contact doctor</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.outlineNavyBtn}
                activeOpacity={0.9}
                onPress={handleConfirmNotTaken}
              >
                <Text style={styles.outlineNavyBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: TAKEN LATE BOTTOM SHEET ("When did you take it?") */}
        {/* ========================================================= */}
        {viewState === 'late_sheet' && (
          <View style={styles.lateSheetContainer}>
            <Text style={styles.topBrand}>KIET Smart Care</Text>

            <View style={styles.lateSheetBox}>
              <Text style={styles.lateSheetTitle}>When did you take it?</Text>

              <TouchableOpacity
                style={styles.lateSheetRow}
                onPress={() => handleSelectLateOption(15)}
              >
                <Text style={styles.lateSheetOptionText}>15 minutes ago</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.lateSheetRow}
                onPress={() => handleSelectLateOption(30)}
              >
                <Text style={styles.lateSheetOptionText}>30 minutes ago</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.lateSheetRow}
                onPress={() => handleSelectLateOption(60)}
              >
                <Text style={styles.lateSheetOptionText}>1 hour ago</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.lateSheetRow, { borderBottomWidth: 0 }]}
                onPress={() => handleSelectLateOption(10)}
              >
                <Text style={styles.lateSheetOptionText}>Choose time</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancelTextBtn}
              onPress={() => setViewState('ringing')}
            >
              <Text style={styles.cancelTextBtnLabel}>Back</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ========================================================= */}
        {/* VIEW 4: OFFICIAL RINGING SCREEN (Exact Left Reference Image) */}
        {/* ========================================================= */}
        {viewState === 'ringing' && (
          <Animated.View
            style={[
              styles.ringingContainer,
              {
                opacity: fadeUpAnim,
                transform: [{ translateY: translateYAnim }],
              },
            ]}
          >
            {/* 1. Tiny Grey "KIET Smart Care" at the Top */}
            <Text style={styles.topBrand}>KIET Smart Care</Text>

            {/* 2. Vertically Balanced Center Content Block */}
            <View style={styles.centerBlock}>
              {/* Small-Caps Meal Label */}
              <Text style={styles.smallCapsMeal}>{mealLabel}</Text>

              {/* Massive Time Display on Single Row with Smaller Meridian */}
              <View style={styles.timeRow}>
                <Text
                  style={[
                    styles.hugeTimeDigits,
                    isCompactHeight && styles.hugeTimeDigitsCompact,
                  ]}
                >
                  {timeDigits || displayTime}
                </Text>
                {timeMeridian ? (
                  <Text
                    style={[
                      styles.smallTimeMeridian,
                      isCompactHeight && styles.smallTimeMeridianCompact,
                    ]}
                  >
                    {timeMeridian}
                  </Text>
                ) : null}
              </View>

              {/* Personal Message in Source Serif 4 (2 lines, never 3 lines) */}
              <Text
                style={[
                  styles.personalMessage,
                  hasLongName && styles.personalMessageSmall,
                ]}
              >
                {firstName ? `${firstName}, your time to take\nthe medicine has come` : 'Your time to take the\nmedicine has come'}
              </Text>

              {/* Quiet Grey Tablet Lines (Inter 15px, #6B7280) */}
              <View style={styles.tabletLinesBlock}>
                {groupedDoses.map((d, index) => {
                  const label = d.medicine_name || `Tablet ${index + 1}`;
                  const count = d.tablets ? `${d.tablets} tablet${d.tablets > 1 ? 's' : ''}` : d.dose || '1 tablet';
                  return (
                    <Text key={d.id} style={styles.tabletLine}>
                      {label} &middot; {count}
                    </Text>
                  );
                })}
                {/* Food Instruction Line */}
                <Text style={styles.foodInstructionLine}>
                  {dose.meal_relation === 'after' ? 'After food' : 'Before food'}
                </Text>
              </View>
            </View>

            {/* 3. Bottom Action Buttons (24px from screen edges) */}
            <View style={styles.bottomBtnGroup}>
              {/* "Mark taken" Full-Width Solid Ink Navy Button */}
              <TouchableOpacity
                style={styles.primaryNavyBtn}
                activeOpacity={0.92}
                onPress={handleMarkTaken}
                accessibilityRole="button"
                accessibilityLabel={`Mark taken. ${firstName}, your time to take the medicine has come.`}
              >
                <Text style={styles.primaryNavyBtnText}>Mark taken</Text>
              </TouchableOpacity>

              {/* "Taken late" Full-Width White Button with 1.5px Navy Border */}
              <TouchableOpacity
                style={styles.outlineNavyBtn}
                activeOpacity={0.92}
                onPress={() => {
                  triggerButtonHaptic();
                  setViewState('late_sheet');
                }}
                accessibilityRole="button"
                accessibilityLabel="Taken late"
              >
                <Text style={styles.outlineNavyBtnText}>Taken late</Text>
              </TouchableOpacity>

              {/* "Not taken" Small Grey Text Link */}
              <TouchableOpacity
                style={styles.notTakenLinkBtn}
                activeOpacity={0.7}
                onPress={handleOpenNotTaken}
                accessibilityRole="button"
                accessibilityLabel="Not taken"
              >
                <Text style={styles.notTakenLinkText}>Not taken</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: ALARM_THEME.bg, // PURE WHITE #FFFFFF
  },
  ringingContainer: {
    flex: 1,
    backgroundColor: ALARM_THEME.bg,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 54,
    paddingBottom: 28,
  },
  topBrand: {
    fontFamily: Platform.select({ ios: 'Inter', android: 'Roboto', default: 'sans-serif' }),
    fontSize: 13,
    color: ALARM_THEME.greyDark, // #6B7280
    fontWeight: '400',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  centerBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 8,
    marginTop: -10,
  },
  smallCapsMeal: {
    fontFamily: Platform.select({ ios: 'Inter', android: 'Roboto', default: 'sans-serif' }),
    fontSize: 14,
    color: ALARM_THEME.greyDark, // #6B7280
    fontWeight: '600',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 12,
  },
  hugeTimeDigits: {
    fontFamily: Platform.select({ ios: 'SourceSerif4-Regular', android: 'serif', default: 'serif' }),
    fontSize: 72,
    fontWeight: '400',
    color: ALARM_THEME.navy, // #0F1B33
    letterSpacing: -1.5,
    includeFontPadding: false,
  },
  hugeTimeDigitsCompact: {
    fontSize: 58,
  },
  smallTimeMeridian: {
    fontFamily: Platform.select({ ios: 'SourceSerif4-Regular', android: 'serif', default: 'serif' }),
    fontSize: 32,
    fontWeight: '400',
    color: ALARM_THEME.navy, // #0F1B33
    letterSpacing: 0.5,
    marginLeft: 6,
    includeFontPadding: false,
  },
  smallTimeMeridianCompact: {
    fontSize: 26,
    marginLeft: 4,
  },
  personalMessage: {
    fontFamily: Platform.select({ ios: 'SourceSerif4-Regular', android: 'serif', default: 'serif' }),
    fontSize: 24,
    fontWeight: '400',
    color: ALARM_THEME.navy, // #0F1B33
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  personalMessageSmall: {
    fontSize: 20,
    lineHeight: 28,
  },
  tabletLinesBlock: {
    alignItems: 'center',
    gap: 4,
  },
  tabletLine: {
    fontFamily: Platform.select({ ios: 'Inter', android: 'Roboto', default: 'sans-serif' }),
    fontSize: 15,
    color: ALARM_THEME.greyDark, // #6B7280
    fontWeight: '400',
    textAlign: 'center',
  },
  foodInstructionLine: {
    fontFamily: Platform.select({ ios: 'Inter', android: 'Roboto', default: 'sans-serif' }),
    fontSize: 15,
    color: ALARM_THEME.greyDark, // #6B7280
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 2,
  },
  bottomBtnGroup: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  primaryNavyBtn: {
    width: '100%',
    height: 60,
    backgroundColor: ALARM_THEME.navy, // #0F1B33
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryNavyBtnText: {
    fontFamily: Platform.select({ ios: 'Inter', android: 'Roboto', default: 'sans-serif' }),
    fontSize: 16,
    fontWeight: '600',
    color: ALARM_THEME.white,
    letterSpacing: 0.2,
  },
  outlineNavyBtn: {
    width: '100%',
    height: 60,
    backgroundColor: ALARM_THEME.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: ALARM_THEME.navy, // #0F1B33
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineNavyBtnText: {
    fontFamily: Platform.select({ ios: 'Inter', android: 'Roboto', default: 'sans-serif' }),
    fontSize: 16,
    fontWeight: '600',
    color: ALARM_THEME.navy,
    letterSpacing: 0.2,
  },
  notTakenLinkBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  notTakenLinkText: {
    fontFamily: Platform.select({ ios: 'Inter', android: 'Roboto', default: 'sans-serif' }),
    fontSize: 14,
    color: ALARM_THEME.greyDark, // #6B7280
    fontWeight: '400',
  },

  // Recorded View Styles (Exact right side of image)
  recordedContent: {
    flex: 1,
    backgroundColor: ALARM_THEME.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  checkWrapper: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  recordedHeadline: {
    fontFamily: Platform.select({ ios: 'SourceSerif4-Regular', android: 'serif', default: 'serif' }),
    fontSize: 40,
    fontWeight: '400',
    color: ALARM_THEME.navy,
    textAlign: 'center',
    marginBottom: 10,
  },
  nextDoseSub: {
    fontFamily: Platform.select({ ios: 'Inter', android: 'Roboto', default: 'sans-serif' }),
    fontSize: 16,
    color: ALARM_THEME.greyDark,
    textAlign: 'center',
    fontWeight: '400',
  },

  // Not Taken Screen Styles
  notTakenContainer: {
    flex: 1,
    backgroundColor: ALARM_THEME.bg,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 54,
    paddingBottom: 28,
  },
  notTakenCenterBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  notTakenHeadline: {
    fontFamily: Platform.select({ ios: 'SourceSerif4-Regular', android: 'serif', default: 'serif' }),
    fontSize: 28,
    color: ALARM_THEME.navy,
    textAlign: 'center',
    marginBottom: 12,
  },
  notTakenSub: {
    fontFamily: Platform.select({ ios: 'Inter', android: 'Roboto', default: 'sans-serif' }),
    fontSize: 16,
    color: ALARM_THEME.greyDark,
    textAlign: 'center',
    marginBottom: 24,
  },
  notTakenPhone: {
    fontFamily: Platform.select({ ios: 'Inter', android: 'Roboto', default: 'sans-serif' }),
    fontSize: 14,
    color: ALARM_THEME.greyDark,
    textAlign: 'center',
  },

  // Taken Late Sheet Styles
  lateSheetContainer: {
    flex: 1,
    backgroundColor: ALARM_THEME.bg,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 54,
    paddingBottom: 28,
  },
  lateSheetBox: {
    backgroundColor: ALARM_THEME.white,
    borderWidth: 1,
    borderColor: ALARM_THEME.greyBorder,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 40,
  },
  lateSheetTitle: {
    fontFamily: Platform.select({ ios: 'SourceSerif4-Regular', android: 'serif', default: 'serif' }),
    fontSize: 20,
    color: ALARM_THEME.navy,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: ALARM_THEME.greyBorder,
  },
  lateSheetRow: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: ALARM_THEME.greyBorder,
  },
  lateSheetOptionText: {
    fontFamily: Platform.select({ ios: 'Inter', android: 'Roboto', default: 'sans-serif' }),
    fontSize: 16,
    color: ALARM_THEME.navy,
  },
  cancelTextBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  cancelTextBtnLabel: {
    fontSize: 15,
    color: ALARM_THEME.greyDark,
  },
});
