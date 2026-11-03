import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, Phone, LogOut, Clock, Bell, CheckCircle2, Volume2 } from 'lucide-react-native';
import { StudentApi } from '../../src/services/student-api';
import { AuthService } from '../../src/services/auth';
import { StudentProfileData } from '../../src/types/student';
import { ReminderEngine } from '../../src/services/reminder-engine';
import { playAlarmChime } from '../../src/services/sound-player';
import { formatTime12h } from '../../src/constants/shared';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [breakfast, setBreakfast] = useState('08:00');
  const [lunch, setLunch] = useState('13:00');
  const [dinner, setDinner] = useState('20:00');
  const [isSaved, setIsSaved] = useState(false);
  const [soundStatus, setSoundStatus] = useState<string | null>(null);
  const [contacts, setContacts] = useState({
    clinic: { label: 'Campus Health Clinic', phone: '+91-120-2983555' },
    officer: { label: 'Campus Health Officer', phone: '+91-9876543210' },
    doctor: { label: 'Campus OPD Doctor', phone: '+91-9876543211' },
  });

  useEffect(() => {
    async function load() {
      const data = await StudentApi.getProfile();
      setProfile(data);
      if (data?.meal_times) {
        setBreakfast(data.meal_times.breakfast || '08:00');
        setLunch(data.meal_times.lunch || '13:00');
        setDinner(data.meal_times.dinner || '20:00');
      }
    }
    load();
  }, []);

  const handleSaveMealTimes = async () => {
    await StudentApi.updateMealTimes({ breakfast, lunch, dinner });
    const doses = await StudentApi.getDoses();
    await ReminderEngine.syncAndScheduleAll(doses, { breakfast, lunch, dinner });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTestSound = async () => {
    setSoundStatus('Playing chime...');
    await playAlarmChime();
    setTimeout(() => setSoundStatus('Chime played successfully'), 1500);
    setTimeout(() => setSoundStatus(null), 3500);
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out from your student account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await AuthService.logout();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <User size={36} color="#0284C7" />
          </View>
          <Text style={styles.studentName}>{profile?.full_name || 'Student'}</Text>
          <Text style={styles.rollNumber}>{profile?.roll_number || 'KIET-STUDENT'}</Text>
          <Text style={styles.deptText}>
            {profile?.department || 'Engineering'} &bull; Year {profile?.year || 1}
          </Text>
        </View>

        {/* Meal Timings Configuration - Simple Student Words */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Clock size={18} color="#0284C7" />
            <Text style={styles.cardTitle}>My Meal Timings</Text>
          </View>
          <Text style={styles.cardDesc}>
            Medicine alarms automatically adjust around your daily meal times (30 minutes before or after food).
          </Text>

          <View style={styles.mealRow}>
            <View style={styles.mealCol}>
              <Text style={styles.mealLabel}>Breakfast</Text>
              <Text style={styles.mealPreview}>{formatTime12h(breakfast)}</Text>
            </View>
            <TextInput
              style={styles.timeInput}
              value={breakfast}
              onChangeText={setBreakfast}
              placeholder="08:00"
              keyboardType="numbers-and-punctuation"
            />
          </View>

          <View style={styles.mealRow}>
            <View style={styles.mealCol}>
              <Text style={styles.mealLabel}>Lunch</Text>
              <Text style={styles.mealPreview}>{formatTime12h(lunch)}</Text>
            </View>
            <TextInput
              style={styles.timeInput}
              value={lunch}
              onChangeText={setLunch}
              placeholder="13:00"
              keyboardType="numbers-and-punctuation"
            />
          </View>

          <View style={styles.mealRow}>
            <View style={styles.mealCol}>
              <Text style={styles.mealLabel}>Dinner</Text>
              <Text style={styles.mealPreview}>{formatTime12h(dinner)}</Text>
            </View>
            <TextInput
              style={styles.timeInput}
              value={dinner}
              onChangeText={setDinner}
              placeholder="20:00"
              keyboardType="numbers-and-punctuation"
            />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveMealTimes}>
            <Text style={styles.saveBtnText}>
              {isSaved ? 'Meal Times Saved!' : 'Save Meal Timings'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Medicine Alarm Chime */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Volume2 size={18} color="#059669" />
            <Text style={styles.cardTitle}>Reminder Chime</Text>
          </View>
          <Text style={styles.cardDesc}>
            Listen to the gentle chime sound that rings when it is time to take your prescribed medicine:
          </Text>

          <TouchableOpacity style={styles.soundTestBtn} onPress={handleTestSound}>
            <Volume2 size={16} color="#0284C7" />
            <Text style={styles.soundTestBtnText}>Play Chime Sample</Text>
          </TouchableOpacity>

          {soundStatus && (
            <View style={styles.statusToast}>
              <CheckCircle2 size={14} color="#059669" />
              <Text style={styles.statusToastText}>{soundStatus}</Text>
            </View>
          )}
        </View>

        {/* Campus Clinic Helpline */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Phone size={18} color="#DC2626" />
            <Text style={styles.cardTitle}>Campus Clinic Helpline</Text>
          </View>
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => Linking.openURL(`tel:${contacts.clinic.phone}`)}
          >
            <Text style={styles.contactLabel}>{contacts.clinic.label}</Text>
            <Text style={styles.contactNumber}>{contacts.clinic.phone}</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={18} color="#DC2626" />
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  studentName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  rollNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0284C7',
    marginTop: 2,
  },
  deptText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  mealRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  mealCol: {
    flex: 1,
  },
  mealLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  mealPreview: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '700',
    marginTop: 2,
  },
  timeInput: {
    width: 80,
    height: 38,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  saveBtn: {
    height: 44,
    backgroundColor: '#0284C7',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  soundTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginTop: 4,
  },
  soundTestBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  statusToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  statusToastText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  contactLabel: {
    fontSize: 14,
    color: '#334155',
  },
  contactNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 8,
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },
});
