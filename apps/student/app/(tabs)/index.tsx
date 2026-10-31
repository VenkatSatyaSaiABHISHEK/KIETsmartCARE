import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';
import { NextDoseCard } from '../../src/components/NextDoseCard';
import { RecoveryCard } from '../../src/components/RecoveryCard';
import { TodayTimeline } from '../../src/components/TodayTimeline';
import { StudentApi } from '../../src/services/student-api';
import { ReminderEngine } from '../../src/services/reminder-engine';
import {
  DoseScheduleRecord,
  RecoveryInquiry,
  StudentProfileData,
} from '../../src/types/student';

export default function StudentHomeScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [doses, setDoses] = useState<DoseScheduleRecord[]>([]);
  const [recoveryInquiry, setRecoveryInquiry] = useState<RecoveryInquiry | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadStudentData = async () => {
    const [prof, dList, rec] = await Promise.all([
      StudentApi.getProfile(),
      StudentApi.getDoses(),
      StudentApi.getRecoveryInquiry(),
    ]);
    setProfile(prof);
    setDoses(dList);
    setRecoveryInquiry(rec);
  };

  useEffect(() => {
    loadStudentData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadStudentData();
      if (profile) {
        await ReminderEngine.syncAndScheduleAll(doses, profile.meal_times);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Find next upcoming scheduled/unconfirmed dose
  const nextDose = doses.find((d) => d.status === 'scheduled' || d.status === 'unconfirmed') || null;

  const handleAnswerDose = async (
    doseId: string,
    status: 'taken' | 'taken_late' | 'not_taken'
  ) => {
    await StudentApi.submitDoseAnswer(doseId, status);
    await ReminderEngine.recordDoseResponse(doseId, status);
    await loadStudentData();
  };

  const handleAnswerRecovery = async (response: 'better' | 'same' | 'worse') => {
    if (recoveryInquiry) {
      await StudentApi.submitRecoveryResponse(recoveryInquiry.id, response);
      await loadStudentData();
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Welcome Greeting Banner */}
        <View style={styles.greetingSection}>
          <View>
            <Text style={styles.greetingSub}>CAMPUS HEALTHCARE STATUS</Text>
            <Text style={styles.greetingTitle}>
              Hello, {profile?.full_name ? profile.full_name.split(' ')[0] : 'Student'}
            </Text>
          </View>
          <View style={styles.offlineAlarmPill}>
            <ShieldCheck color="#166534" size={13} />
            <Text style={styles.offlineAlarmPillText}>Alarms Active Offline</Text>
          </View>
        </View>

        {/* 1. Large "Next Dose" Black Card with Three Big Buttons */}
        <NextDoseCard dose={nextDose} onAnswerDose={handleAnswerDose} />

        {/* 2. End-of-Course Recovery Card (Prominent inquiry: Better, Same, Worse) */}
        {recoveryInquiry && (
          <RecoveryCard
            inquiry={recoveryInquiry}
            onAnswer={handleAnswerRecovery}
          />
        )}

        {/* 3. Report a Problem / Side Effect Action Card */}
        <TouchableOpacity
          style={styles.problemCard}
          onPress={() => router.push('/report-problem')}
          activeOpacity={0.8}
        >
          <View style={styles.problemLeft}>
            <View style={styles.problemIconBadge}>
              <AlertTriangle color="#ea580c" size={18} />
            </View>
            <View>
              <Text style={styles.problemTitle}>Experiencing a Side Effect?</Text>
              <Text style={styles.problemSub}>
                Flag any dizziness, allergy, or discomfort to your doctor.
              </Text>
            </View>
          </View>
          <ArrowRight color="#a1a1aa" size={16} />
        </TouchableOpacity>

        {/* 4. Today's Chronological Medication Timeline */}
        <TodayTimeline doses={doses} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 18,
  },
  greetingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  greetingSub: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#71717a',
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0a0a0a',
    letterSpacing: -0.4,
  },
  offlineAlarmPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  offlineAlarmPillText: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '700',
  },
  problemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 20,
    padding: 16,
  },
  problemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  problemIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#ffedd5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  problemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9a3412',
  },
  problemSub: {
    fontSize: 11,
    color: '#c2410c',
    marginTop: 2,
  },
});
