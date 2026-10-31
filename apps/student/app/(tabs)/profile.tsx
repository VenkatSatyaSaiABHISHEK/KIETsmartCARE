import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  User,
  Clock,
  Globe,
  LogOut,
  ShieldAlert,
  Save,
  Check,
} from 'lucide-react-native';
import { StudentApi } from '../../src/services/student-api';
import { AuthService } from '../../src/services/auth';
import { StudentProfileData } from '../../src/types/student';
import { ReminderEngine } from '../../src/services/reminder-engine';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [breakfast, setBreakfast] = useState('08:15');
  const [lunch, setLunch] = useState('13:30');
  const [dinner, setDinner] = useState('20:30');
  const [language, setLanguage] = useState<'en' | 'te'>('en');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await StudentApi.getProfile();
      setProfile(data);
      if (data.meal_times) {
        setBreakfast(data.meal_times.breakfast);
        setLunch(data.meal_times.lunch);
        setDinner(data.meal_times.dinner);
      }
      setLanguage(data.language || 'en');
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

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of KIET Smart Care?', [
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

  if (!profile) return null;

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Student Identity Card */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{profile.full_name.charAt(0)}</Text>
          </View>
          <Text style={styles.studentName}>{profile.full_name}</Text>
          <Text style={styles.rollBadge}>Roll: {profile.roll_number}</Text>
          <Text style={styles.academicInfo}>
            {profile.department} &bull; Year {profile.year}
          </Text>
          <Text style={styles.hostelInfo}>
            {profile.hostel_status} {profile.room_number ? `(${profile.room_number})` : ''}
          </Text>
        </View>

        {/* Documented Allergies Box */}
        <View style={styles.allergiesCard}>
          <View style={styles.cardTitleRow}>
            <ShieldAlert color="#b91c1c" size={16} />
            <Text style={styles.allergiesTitle}>Documented Drug Allergies</Text>
          </View>
          {profile.allergies.length > 0 ? (
            <View style={styles.allergyPillsRow}>
              {profile.allergies.map((allergy, i) => (
                <View key={i} style={styles.allergyPill}>
                  <Text style={styles.allergyPillText}>&times; {allergy}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noAllergiesText}>No drug allergies reported on campus medical file.</Text>
          )}
        </View>

        {/* Meal Timings Configuration */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Clock color="#0a0a0a" size={16} />
            <Text style={styles.cardTitle}>Custom Meal Schedule</Text>
          </View>
          <Text style={styles.cardSub}>
            Medicine alarm triggers automatically offset 30 minutes before or after these meal times.
          </Text>

          <View style={styles.timeInputsRow}>
            <View style={styles.timeField}>
              <Text style={styles.timeLabel}>Breakfast (24h)</Text>
              <TextInput
                style={styles.timeInput}
                value={breakfast}
                onChangeText={setBreakfast}
                placeholder="08:00"
              />
            </View>
            <View style={styles.timeField}>
              <Text style={styles.timeLabel}>Lunch (24h)</Text>
              <TextInput
                style={styles.timeInput}
                value={lunch}
                onChangeText={setLunch}
                placeholder="13:00"
              />
            </View>
            <View style={styles.timeField}>
              <Text style={styles.timeLabel}>Dinner (24h)</Text>
              <TextInput
                style={styles.timeInput}
                value={dinner}
                onChangeText={setDinner}
                placeholder="20:00"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.saveMealBtn}
            onPress={handleSaveMealTimes}
            activeOpacity={0.8}
          >
            {isSaved ? (
              <>
                <Check color="#ffffff" size={16} />
                <Text style={styles.saveMealBtnText}>Alarms Resynchronized!</Text>
              </>
            ) : (
              <>
                <Save color="#ffffff" size={16} />
                <Text style={styles.saveMealBtnText}>Save & Reschedule Alarms</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Language Placeholder */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Globe color="#0a0a0a" size={16} />
            <Text style={styles.cardTitle}>Language Selection</Text>
          </View>
          <View style={styles.langRow}>
            <TouchableOpacity
              style={[styles.langOption, language === 'en' && styles.langOptionActive]}
              onPress={() => setLanguage('en')}
            >
              <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>
                English (Active)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.langOption, language === 'te' && styles.langOptionActive]}
              onPress={() => {
                Alert.alert('Telugu Language Pack', 'Telugu localization will be available in the upcoming campus update.');
              }}
            >
              <Text style={[styles.langText, language === 'te' && styles.langTextActive]}>
                తెలుగు (Telugu - Coming Soon)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut color="#dc2626" size={18} />
          <Text style={styles.logoutBtnText}>Sign Out of My Account</Text>
        </TouchableOpacity>
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
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  profileHeaderCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarInitial: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
  },
  studentName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.4,
  },
  rollBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#60a5fa',
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 6,
  },
  academicInfo: {
    fontSize: 13,
    color: '#a1a1aa',
    marginTop: 8,
  },
  hostelInfo: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
  },
  allergiesCard: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 20,
    padding: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  allergiesTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991b1b',
  },
  allergyPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  allergyPill: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f87171',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  allergyPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b91c1c',
  },
  noAllergiesText: {
    fontSize: 12,
    color: '#7f1d1d',
  },
  card: {
    backgroundColor: '#f4f4f5',
    borderRadius: 20,
    padding: 18,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0a0a0a',
  },
  cardSub: {
    fontSize: 12,
    color: '#71717a',
    lineHeight: 16,
    marginBottom: 14,
  },
  timeInputsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  timeField: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  timeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#71717a',
    marginBottom: 4,
  },
  timeInput: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0a0a0a',
  },
  saveMealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0a',
    height: 44,
    borderRadius: 12,
    gap: 8,
  },
  saveMealBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  langRow: {
    gap: 8,
    marginTop: 4,
  },
  langOption: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  langOptionActive: {
    borderColor: '#0a0a0a',
    backgroundColor: '#fafafa',
  },
  langText: {
    fontSize: 13,
    color: '#71717a',
    fontWeight: '500',
  },
  langTextActive: {
    color: '#0a0a0a',
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    height: 50,
    borderRadius: 14,
    gap: 8,
    marginTop: 10,
  },
  logoutBtnText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '700',
  },
});
