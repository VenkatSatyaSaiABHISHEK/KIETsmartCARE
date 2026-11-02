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
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StudentApi } from '../../src/services/student-api';
import { AuthService } from '../../src/services/auth';
import { StudentProfileData } from '../../src/types/student';
import { ReminderEngine } from '../../src/services/reminder-engine';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [breakfast, setBreakfast] = useState('08:00');
  const [lunch, setLunch] = useState('13:00');
  const [dinner, setDinner] = useState('20:00');
  const [isSaved, setIsSaved] = useState(false);
  const [testAlarmStatus, setTestAlarmStatus] = useState<string | null>(null);
  const [contacts, setContacts] = useState({
    clinic: { label: 'College Campus Clinic', phone: '+91-120-2983555' },
    officer: { label: 'Campus Health Officer', phone: '+91-9876543210' },
    doctor: { label: 'Campus OPD Doctor', phone: '+91-9876543211' },
  });

  useEffect(() => {
    async function load() {
      const data = await StudentApi.getProfile();
      setProfile(data);
      if (data.meal_times) {
        setBreakfast(data.meal_times.breakfast);
        setLunch(data.meal_times.lunch);
        setDinner(data.meal_times.dinner);
      }
      try {
        const res = await fetch('/api/clinic/emergency-contacts');
        const contactData = await res.json();
        if (contactData?.contacts) {
          setContacts(contactData.contacts);
        }
      } catch {}
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

  const handleLogout = async () => {
    await AuthService.logout();
    router.replace('/login');
  };

  const handleTestAlarm = async () => {
    setTestAlarmStatus('Scheduling alarm for 5 seconds from now...');
    try {
      await ReminderEngine.triggerImmediateAlarmTest(5, 'Paracetamol 650mg');
      setTestAlarmStatus('Alarm scheduled! In 5s, the clinical chime sound will ring. You can lock or minimize your phone now to test background execution.');
      setTimeout(() => setTestAlarmStatus(null), 8000);
    } catch {
      setTestAlarmStatus('Failed to schedule test alarm. Please ensure notification permissions are granted.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Student Identity */}
        <View style={styles.identitySection}>
          <Text style={styles.name}>{profile?.full_name || 'Student Profile'}</Text>
          <Text style={styles.rollNumber}>{profile?.roll_number || 'Roll Number'}</Text>
          <Text style={styles.meta}>
            {profile?.department || profile?.branch || 'Student'} &bull; Year {profile?.year || 1} &bull; {profile?.hostel_status}
          </Text>
        </View>

        {/* Meal Schedule Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>PERSONAL MEAL SCHEDULE</Text>
          <Text style={styles.sectionSub}>
            Medicine alarms automatically sync to your breakfast, lunch, and dinner times (&plusmn;30 mins).
          </Text>

          <View style={styles.scheduleBox}>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Breakfast</Text>
              <TextInput
                style={styles.timeInput}
                value={breakfast}
                onChangeText={setBreakfast}
                placeholder="08:00"
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Lunch</Text>
              <TextInput
                style={styles.timeInput}
                value={lunch}
                onChangeText={setLunch}
                placeholder="13:00"
              />
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Dinner</Text>
              <TextInput
                style={styles.timeInput}
                value={dinner}
                onChangeText={setDinner}
                placeholder="20:00"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSaveMealTimes}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnText}>
              {isSaved ? 'Schedule Updated' : 'Save Meal Timings'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Automated Alarm & Audio Diagnostics (Judges & Testers) */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>AUTOMATED ALARM & SOUND DIAGNOSTICS</Text>
          <Text style={styles.sectionSub}>
            Verify automatic background alarm dispatch with open-source chime audio (chime_reminder.wav).
          </Text>

          <TouchableOpacity
            style={styles.alarmTestBtn}
            onPress={handleTestAlarm}
            activeOpacity={0.8}
          >
            <Text style={styles.alarmTestBtnText}>Ring Test Alarm Now (5s delay)</Text>
          </TouchableOpacity>

          {testAlarmStatus && (
            <View style={styles.testStatusBox}>
              <Text style={styles.testStatusText}>{testAlarmStatus}</Text>
            </View>
          )}
        </View>

        {/* Data Governance & Privacy Disclosure */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>PRIVACY & AUTO-ALARM POLICY</Text>
          <View style={styles.policyCard}>
            <Text style={styles.policyTitle}>Automatic Alarm Scheduling</Text>
            <Text style={styles.policyText}>
              • Zero Manual Setup: Doses prescribed by campus OPD doctors automatically convert into scheduled device alarms.
            </Text>
            <Text style={styles.policyText}>
              • Background & Lock-Screen Audio: Notifications play a gentle chime tone even if the app is closed or the screen is locked.
            </Text>
            <Text style={styles.policyText}>
              • No Clinical Data Sharing: Institutional admins have zero access to your medical conditions or prescriptions.
            </Text>
          </View>
        </View>

        {/* Emergency Contacts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>EMERGENCY CONTACTS</Text>
          <Text style={styles.sectionSub}>
            Direct telephonic emergency actions available 24/7 on campus.
          </Text>

          <View style={styles.contactsList}>
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => Linking.openURL(`tel:${contacts.clinic.phone.replace(/[\s-]/g, '')}`)}
              activeOpacity={0.7}
            >
              <Text style={styles.contactName}>{contacts.clinic.label}</Text>
              <Text style={styles.contactPhone}>{contacts.clinic.phone} &rarr;</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => Linking.openURL(`tel:${contacts.officer.phone.replace(/[\s-]/g, '')}`)}
              activeOpacity={0.7}
            >
              <Text style={styles.contactName}>{contacts.officer.label}</Text>
              <Text style={styles.contactPhone}>{contacts.officer.phone} &rarr;</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => Linking.openURL(`tel:${contacts.doctor.phone.replace(/[\s-]/g, '')}`)}
              activeOpacity={0.7}
            >
              <Text style={styles.contactName}>{contacts.doctor.label}</Text>
              <Text style={styles.contactPhone}>{contacts.doctor.phone} &rarr;</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>ACCOUNT</Text>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutText}>Sign out of KIET Smart Care</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  identitySection: {
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#121212',
  },
  rollNumber: {
    fontSize: 14,
    color: '#555555',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  meta: {
    fontSize: 13,
    color: '#555555',
    marginTop: 4,
  },
  section: {
    marginTop: 28,
  },
  sectionHeading: {
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '700',
    color: '#555555',
  },
  sectionSub: {
    fontSize: 13,
    color: '#555555',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  scheduleBox: {
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 8,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#121212',
  },
  timeInput: {
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
    color: '#121212',
    textAlign: 'right',
    padding: 4,
    minWidth: 80,
  },
  saveBtn: {
    marginTop: 12,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  contactsList: {
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 8,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  contactName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#121212',
  },
  contactPhone: {
    fontSize: 13,
    fontWeight: '600',
    color: '#991B1B',
  },
  logoutBtn: {
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#991B1B',
  },
  alarmTestBtn: {
    height: 48,
    borderRadius: 8,
    backgroundColor: '#059669', // Emerald
    justifyContent: 'center',
    alignItems: 'center',
  },
  alarmTestBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  testStatusBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  testStatusText: {
    fontSize: 12,
    color: '#065F46',
    lineHeight: 17,
  },
  policyCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    backgroundColor: '#FAFAFA',
    gap: 8,
  },
  policyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#121212',
    marginBottom: 2,
  },
  policyText: {
    fontSize: 12,
    color: '#444444',
    lineHeight: 18,
  },
});
