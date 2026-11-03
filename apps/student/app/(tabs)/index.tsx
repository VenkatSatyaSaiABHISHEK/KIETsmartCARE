import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Volume2 } from 'lucide-react-native';
import { NextDoseCard } from '../../src/components/NextDoseCard';
import { RecoveryCard } from '../../src/components/RecoveryCard';
import { AlarmTakeoverModal } from '../../src/components/AlarmTakeoverModal';
import { StudentApi } from '../../src/services/student-api';
import { ReminderEngine } from '../../src/services/reminder-engine';
import {
  playAlarmChime,
  startContinuousAlarm,
  stopAlarm,
  enableAudioAndNotifications,
} from '../../src/services/sound-player';
import {
  DoseScheduleRecord,
  RecoveryInquiry,
  StudentProfileData,
} from '../../src/types/student';

export default function StudentHomeScreen() {
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [doses, setDoses] = useState<DoseScheduleRecord[]>([]);
  const [recoveryInquiry, setRecoveryInquiry] = useState<RecoveryInquiry | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeAlarmDose, setActiveAlarmDose] = useState<DoseScheduleRecord | null>(null);
  const [soundTested, setSoundTested] = useState(false);

  // Track already sounded doses to avoid repeat ringing
  const alarmedDoseIdsRef = useRef<Set<string>>(new Set());
  const dosesRef = useRef<DoseScheduleRecord[]>([]);

  // Keep ref up to date on each state change
  useEffect(() => {
    dosesRef.current = doses;
  }, [doses]);

  const loadStudentData = async () => {
    const [prof, dList, rec] = await Promise.all([
      StudentApi.getProfile(),
      StudentApi.getDoses(),
      StudentApi.getRecoveryInquiry(),
    ]);
    setProfile(prof);
    setDoses(dList);
    dosesRef.current = dList;
    setRecoveryInquiry(rec);
    return { prof, dList };
  };

  // Check upcoming doses against current time and trigger continuous alarm
  const checkDueAlarms = (doseList: DoseScheduleRecord[]) => {
    const now = new Date().getTime();

    for (const dose of doseList) {
      if (dose.status !== 'scheduled' && dose.status !== 'unconfirmed') continue;
      if (!dose.scheduled_at && !dose.time && !dose.scheduled_time) continue;

      let doseTimeMs = 0;
      if (dose.scheduled_at) {
        doseTimeMs = new Date(dose.scheduled_at).getTime();
      } else {
        const timeParts = (dose.time || dose.scheduled_time || '').split(':').map(Number);
        if (timeParts.length >= 2) {
          const d = new Date();
          d.setHours(timeParts[0], timeParts[1], 0, 0);
          doseTimeMs = d.getTime();
        }
      }

      // If scheduled time has arrived (within the last 30 minutes)
      const diffMs = now - doseTimeMs;
      const isDueNow = diffMs >= 0 && diffMs <= 30 * 60 * 1000;

      if (isDueNow && !alarmedDoseIdsRef.current.has(dose.id)) {
        alarmedDoseIdsRef.current.add(dose.id);
        setActiveAlarmDose(dose);
        startContinuousAlarm();
        break;
      }
    }
  };

  useEffect(() => {
    loadStudentData().then((res) => {
      if (res?.dList) checkDueAlarms(res.dList);
    });

    // 1. High-precision 1-second clock: checks current second against target alarm time with ZERO lag
    const clockInterval = setInterval(() => {
      checkDueAlarms(dosesRef.current);
    }, 1000);

    // 2. High-speed 2.5-second background sync: catches live doctor prescriptions immediately
    const pollInterval = setInterval(async () => {
      try {
        const freshDoses = await StudentApi.getDoses();
        setDoses(freshDoses);
        dosesRef.current = freshDoses;
        checkDueAlarms(freshDoses);
      } catch (err) {
        console.warn('Dose check error:', err);
      }
    }, 2500);

    return () => {
      clearInterval(clockInterval);
      clearInterval(pollInterval);
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await loadStudentData();
      if (res?.dList) checkDueAlarms(res.dList);
      if (profile) {
        await ReminderEngine.syncAndScheduleAll(doses, profile.meal_times);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTestSound = async () => {
    await enableAudioAndNotifications();
    await playAlarmChime();
    setSoundTested(true);
  };

  // Find next upcoming scheduled/unconfirmed dose
  const nextDose = doses.find((d) => d.status === 'scheduled' || d.status === 'unconfirmed') || null;

  const handleAnswerDose = async (
    doseId: string,
    status: 'taken' | 'taken_late' | 'not_taken'
  ) => {
    stopAlarm();
    setActiveAlarmDose(null);

    // Optimistically update UI
    setDoses((prev) =>
      prev.map((d) => (d.id === doseId ? { ...d, status } : d))
    );

    await StudentApi.submitDoseAnswer(doseId, status);
    await ReminderEngine.recordDoseResponse(doseId, status);
    await loadStudentData();
  };

  const handleSnooze = (doseId: string) => {
    stopAlarm();
    setActiveAlarmDose(null);

    // Remove from alarmed IDs so it re-triggers in 5 minutes
    setTimeout(() => {
      alarmedDoseIdsRef.current.delete(doseId);
    }, 5 * 60 * 1000);
  };

  const handleDismiss = () => {
    stopAlarm();
    setActiveAlarmDose(null);
  };

  const handleAnswerRecovery = async (response: 'better' | 'same' | 'worse') => {
    if (recoveryInquiry) {
      await StudentApi.submitRecoveryResponse(recoveryInquiry.id, response);
      await loadStudentData();
    }
  };

  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : 'Student';
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Full-Screen Alarm Takeover (Exact Match to Reference Image) */}
      <AlarmTakeoverModal
        visible={Boolean(activeAlarmDose)}
        dose={activeAlarmDose}
        allDueDoses={doses.filter(
          (d) =>
            (d.status === 'scheduled' || d.status === 'unconfirmed') &&
            (d.scheduled_at === activeAlarmDose?.scheduled_at ||
              d.time === activeAlarmDose?.time ||
              d.scheduled_time === activeAlarmDose?.scheduled_time)
        )}
        allTodayDoses={doses}
        profile={profile}
        onTakeDose={handleAnswerDose}
        onNotTaken={(doseId) => handleAnswerDose(doseId, 'not_taken')}
        onDismiss={handleDismiss}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header Section with Audio Test Pill */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.brandTitle}>KIET SMART CARE</Text>
            <TouchableOpacity
              style={[styles.soundPill, soundTested && styles.soundPillActive]}
              onPress={handleTestSound}
              activeOpacity={0.8}
            >
              <Volume2 size={14} color={soundTested ? '#059669' : '#0284C7'} />
              <Text style={[styles.soundPillText, soundTested && styles.soundPillTextActive]}>
                {soundTested ? 'Sound Verified \u2713' : 'Test Sound \uD83D\uDD0A'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.greetingTitle}>Hello, {firstName}</Text>
          <Text style={styles.dateSubtext}>{todayFormatted}</Text>
        </View>

        {/* 2. Main Action Cards */}
        <View style={styles.cardSection}>
          {recoveryInquiry && (
            <RecoveryCard
              inquiry={recoveryInquiry}
              onAnswer={handleAnswerRecovery}
            />
          )}

          <NextDoseCard
            dose={nextDose}
            allTodayDoses={doses}
            onAnswerDose={handleAnswerDose}
          />
        </View>

        {/* 3. Today's Schedule List */}
        <View style={styles.scheduleSection}>
          <Text style={styles.sectionHeading}>TODAY&apos;S SCHEDULE</Text>

          {doses.length === 0 ? (
            <View style={styles.emptySchedule}>
              <Text style={styles.emptyScheduleText}>
                No doses scheduled for today.
              </Text>
            </View>
          ) : (
            <View style={styles.scheduleList}>
              {doses.map((d, index) => {
                const statusColor =
                  d.status === 'taken' || d.status === 'taken_late'
                    ? '#166534'
                    : d.status === 'not_taken'
                    ? '#991B1B'
                    : '#555555';

                const statusLabel =
                  d.status === 'taken'
                    ? 'Taken'
                    : d.status === 'taken_late'
                    ? 'Taken Late'
                    : d.status === 'not_taken'
                    ? 'Missed'
                    : 'Upcoming';

                return (
                  <View key={d.id || index} style={styles.scheduleRow}>
                    <View style={styles.timeCol}>
                      <Text style={styles.timeText}>{d.time || d.scheduled_time}</Text>
                      <Text style={styles.slotSubtext}>
                        {d.meal_relation === 'after' ? 'After' : 'Before'} {d.slot || d.meal_slot}
                      </Text>
                    </View>

                    <View style={styles.medCol}>
                      <Text style={styles.medText}>{d.medicine_name}</Text>
                      <Text style={styles.doseSubtext}>
                        {d.tablets ? `${d.tablets} tablet${d.tablets > 1 ? 's' : ''}` : d.dose || '1 tablet'}
                      </Text>
                    </View>

                    <View style={styles.statusCol}>
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {statusLabel}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingBottom: 90,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  brandTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#0284C7',
  },
  soundPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  soundPillActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  soundPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  soundPillTextActive: {
    color: '#059669',
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#121212',
    letterSpacing: -0.3,
  },
  dateSubtext: {
    fontSize: 13,
    color: '#555555',
    marginTop: 2,
  },
  cardSection: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  scheduleSection: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#555555',
    marginBottom: 12,
  },
  emptySchedule: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyScheduleText: {
    fontSize: 13,
    color: '#555555',
  },
  scheduleList: {
    borderTopWidth: 1,
    borderTopColor: '#EBEBEB',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
    minHeight: 52,
  },
  timeCol: {
    width: 72,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121212',
  },
  slotSubtext: {
    fontSize: 11,
    color: '#555555',
    textTransform: 'capitalize',
  },
  medCol: {
    flex: 1,
    paddingHorizontal: 8,
  },
  medText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#121212',
  },
  doseSubtext: {
    fontSize: 12,
    color: '#555555',
  },
  statusCol: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
