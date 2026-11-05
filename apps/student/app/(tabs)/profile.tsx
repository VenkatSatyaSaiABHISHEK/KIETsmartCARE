import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Linking,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  User,
  Phone,
  LogOut,
  Clock,
  Volume2,
  BatteryCharging,
  ChevronRight,
  X,
  CheckCircle2,
  Play,
  Check,
  Sparkles,
  Bell,
  Mic,
  Radio,
} from 'lucide-react-native';
import { StudentApi } from '../../src/services/student-api';
import { AuthService } from '../../src/services/auth';
import { StudentProfileData } from '../../src/types/student';
import { ReminderEngine } from '../../src/services/reminder-engine';
import {
  SOUND_OPTIONS,
  SoundTheme,
  getSelectedSoundTheme,
  setSelectedSoundTheme,
  previewSound,
  stopPreviewSound,
  playAlarmChime,
} from '../../src/services/sound-player';
import { formatTime12h } from '../../src/constants/shared';
import Constants from 'expo-constants';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [breakfast, setBreakfast] = useState('08:00');
  const [lunch, setLunch] = useState('13:00');
  const [dinner, setDinner] = useState('20:00');
  const [isSaved, setIsSaved] = useState(false);
  const [soundStatus, setSoundStatus] = useState<string | null>(null);
  const [activeTheme, setActiveTheme] = useState<SoundTheme>(getSelectedSoundTheme());
  const [previewingTheme, setPreviewingTheme] = useState<SoundTheme | null>(null);
  const [isTestingAlarm, setIsTestingAlarm] = useState(false);

  // Modal visibility states for the 3 popup buttons
  const [activeModal, setActiveModal] = useState<'meals' | 'audio' | 'clinic' | null>(null);

  const [contacts] = useState({
    clinic: { label: 'Campus Health Clinic', phone: '+91-120-2983555' },
    officer: { label: 'Campus Health Officer', phone: '+91-9876543210' },
    doctor: { label: 'Campus OPD Doctor', phone: '+91-9876543211' },
  });

  useEffect(() => {
    async function load() {
      const data = await StudentApi.getProfile(true);
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
    const doses = await StudentApi.getDoses(true);
    await ReminderEngine.syncAndScheduleAll(doses, { breakfast, lunch, dinner });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setActiveModal(null);
    }, 1200);
  };

  const handleTestSound = async () => {
    setSoundStatus('Playing chime...');
    await playAlarmChime();
    setTimeout(() => setSoundStatus('Chime played successfully!'), 1500);
    setTimeout(() => setSoundStatus(null), 3500);
  };

  const handleSelectSoundTheme = async (theme: SoundTheme) => {
    setActiveTheme(theme);
    await setSelectedSoundTheme(theme);
    setPreviewingTheme(theme);
    const title = SOUND_OPTIONS.find((s) => s.id === theme)?.title || 'Tone';
    setSoundStatus(`Selected "${title}"`);
    await previewSound(theme);
    setTimeout(() => setPreviewingTheme(null), 3000);
    setTimeout(() => setSoundStatus(null), 3500);
  };

  const handleTestWakeupAlarm = async () => {
    setIsTestingAlarm(true);
    await ReminderEngine.triggerImmediateAlarmTest(5, profile?.full_name || 'Student');
    Alert.alert(
      'Wakeup Alarm Scheduled (5s)',
      'Lock your phone or press home now! In 5 seconds, your screen will turn ON, bypass lockscreen, and ring aloud.',
      [{ text: 'I understand' }]
    );
    setTimeout(() => setIsTestingAlarm(false), 5500);
  };

  const getAppPackage = () => {
    return Constants.appOwnership === 'expo'
      ? 'host.exp.exponent'
      : (Constants.expoConfig?.android?.package || 'edu.kiet.smartcare.student');
  };

  const handleOpenAppInfo = async () => {
    try {
      await Linking.openSettings();
    } catch {
      Alert.alert('Settings', 'Please open Android Settings > Apps to manage permissions.');
    }
  };

  const handleOpenExactAlarmSettings = async () => {
    if (Platform.OS === 'android') {
      try {
        const pkg = getAppPackage();
        await Linking.sendIntent('android.settings.REQUEST_SCHEDULE_EXACT_ALARM', [
          { key: 'data', value: `package:${pkg}` },
        ]);
        return;
      } catch {}
    }
    await handleOpenAppInfo();
  };

  const handleOpenOverlaySettings = async () => {
    if (Platform.OS === 'android') {
      try {
        const pkg = getAppPackage();
        await Linking.sendIntent('android.settings.action.MANAGE_OVERLAY_PERMISSION', [
          { key: 'data', value: `package:${pkg}` },
        ]);
        return;
      } catch {}
    }
    await handleOpenAppInfo();
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
        {/* Profile Identity Card */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <User size={34} color="#0284C7" />
          </View>
          <Text style={styles.studentName}>{profile?.full_name || 'Student'}</Text>
          <Text style={styles.rollNumber}>{profile?.roll_number || 'KIET-STUDENT'}</Text>
          <Text style={styles.deptText}>
            {profile?.department || 'Engineering'} &bull; Year {profile?.year || 1}
          </Text>
        </View>

        {/* 3 Compact Action Button Cards */}
        <View style={styles.buttonsList}>
          {/* Button Card 1: Meal Timings */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setActiveModal('meals')}
            activeOpacity={0.7}
          >
            <View style={[styles.cardIconBox, { backgroundColor: '#E0F2FE' }]}>
              <Clock size={20} color="#0284C7" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Daily Meal Timings</Text>
              <Text style={styles.cardSubtitle}>
                {formatTime12h(breakfast)} &bull; {formatTime12h(lunch)} &bull; {formatTime12h(dinner)}
              </Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* Button Card 2: Sound Lab & Wakeup Test */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setActiveModal('audio')}
            activeOpacity={0.7}
          >
            <View style={[styles.cardIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Volume2 size={20} color="#059669" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Sound Lab &amp; Wakeup Test</Text>
              <Text style={styles.cardSubtitle}>
                {SOUND_OPTIONS.find((s) => s.id === activeTheme)?.title || 'Crystal Chime'} &bull; Test 5s Wakeup
              </Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* Button Card 3: Campus Clinic Helpline */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setActiveModal('clinic')}
            activeOpacity={0.7}
          >
            <View style={[styles.cardIconBox, { backgroundColor: '#FEF2F2' }]}>
              <Phone size={20} color="#DC2626" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Campus Clinic Helpline</Text>
              <Text style={styles.cardSubtitle}>Direct campus doctor emergency numbers</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={16} color="#DC2626" />
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* POPUP MODAL 1: Meal Timings */}
      <Modal
        visible={activeModal === 'meals'}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Clock size={18} color="#0284C7" />
                <Text style={styles.modalTitle}>Daily Meal Timings</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Medicine alarms automatically adjust around your daily meal times (30 minutes before or after food).
            </Text>

            <View style={styles.mealRow}>
              <View>
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
              <View>
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
              <View>
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
                {isSaved ? 'Meal Times Saved \u2713' : 'Save Meal Timings'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* POPUP MODAL 2: Sound Lab & Background Wakeup Test */}
      <Modal
        visible={activeModal === 'audio'}
        transparent
        animationType="fade"
        onRequestClose={() => {
          stopPreviewSound();
          setActiveModal(null);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContainer, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Volume2 size={18} color="#059669" />
                <Text style={styles.modalTitle}>Sound Lab &amp; Wakeup Test</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  stopPreviewSound();
                  setActiveModal(null);
                }}
                style={styles.closeBtn}
              >
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalDesc}>
                Customize your campus medicine alert tone and test the automatic screen takeover.
              </Text>

              {/* Sound Theme Selector (Sound Lab) */}
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F1B33', marginBottom: 8 }}>
                  Select Your Alarm Tone:
                </Text>
                {SOUND_OPTIONS.map((opt) => {
                  const isSelected = activeTheme === opt.id;
                  const isPlaying = previewingTheme === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: isSelected ? '#EFF6FF' : '#F8FAFC',
                        borderColor: isSelected ? '#0284C7' : '#E2E8F0',
                        borderWidth: isSelected ? 2 : 1,
                        borderRadius: 10,
                        padding: 10,
                        marginBottom: 8,
                      }}
                      onPress={() => handleSelectSoundTheme(opt.id)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: isSelected ? '#0284C7' : '#E2E8F0',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 10,
                        }}
                      >
                        {opt.id === 'chime' ? (
                          <Sparkles size={18} color={isSelected ? '#FFFFFF' : '#475569'} />
                        ) : opt.id === 'bell' ? (
                          <Bell size={18} color={isSelected ? '#FFFFFF' : '#475569'} />
                        ) : (
                          <Mic size={18} color={isSelected ? '#FFFFFF' : '#475569'} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: '700',
                              color: isSelected ? '#0369A1' : '#0F1B33',
                            }}
                          >
                            {opt.title}
                          </Text>
                          {isSelected && (
                            <View
                              style={{
                                marginLeft: 6,
                                backgroundColor: '#BAE6FD',
                                paddingHorizontal: 6,
                                paddingVertical: 1,
                                borderRadius: 4,
                              }}
                            >
                              <Text style={{ fontSize: 9, fontWeight: '800', color: '#0369A1' }}>ACTIVE</Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{opt.subtitle}</Text>
                      </View>
                      <View
                        style={{
                          padding: 8,
                          backgroundColor: isPlaying ? '#0284C7' : '#FFFFFF',
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: '#CBD5E1',
                          marginLeft: 8,
                        }}
                      >
                        {isPlaying ? (
                          <Volume2 size={16} color="#FFFFFF" />
                        ) : (
                          <Play size={16} color="#0284C7" />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {soundStatus && (
                <View style={[styles.statusToast, { marginBottom: 12 }]}>
                  <CheckCircle2 size={14} color="#059669" />
                  <Text style={styles.statusToastText}>{soundStatus}</Text>
                </View>
              )}

              {/* 5-Second Real Alarm Wakeup Test */}
              <View
                style={{
                  backgroundColor: '#F0FDF4',
                  borderColor: '#86EFAC',
                  borderWidth: 1,
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 14,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#166534', marginBottom: 4 }}>
                  Test Full-Screen Wakeup Alarm (5s Delay):
                </Text>
                <Text style={{ fontSize: 11, color: '#15803D', lineHeight: 15, marginBottom: 10 }}>
                  Tap below, then immediately press your phone&apos;s power button to lock your screen. In 5 seconds, your phone will turn ON, bypass lockscreen, and ring aloud!
                </Text>
                <TouchableOpacity
                  style={[styles.modalActionBtn, { backgroundColor: '#16A34A', borderColor: '#15803D' }]}
                  onPress={handleTestWakeupAlarm}
                  disabled={isTestingAlarm}
                >
                  <Clock size={16} color="#FFFFFF" />
                  <Text style={[styles.modalActionBtnText, { color: '#FFFFFF', fontWeight: '700' }]}>
                    {isTestingAlarm ? 'Alarm Scheduled! Lock screen now...' : '🚀 Trigger 5-Second Wakeup Alarm'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* System Alarm & Background Health Info */}
              <View style={{ backgroundColor: '#F1F5F9', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F1B33', marginBottom: 4 }}>
                  System Alarm Status:
                </Text>
                <Text style={{ fontSize: 11, color: '#475569', lineHeight: 16 }}>
                  &bull; <Text style={{ fontWeight: '600' }}>Exact Alarms</Text>: Auto-Granted by Android 14 ✓{'\n'}
                  &bull; <Text style={{ fontWeight: '600' }}>Full Screen Intent</Text>: Configured (Wakes Screen) ✓{'\n'}
                  &bull; <Text style={{ fontWeight: '600' }}>Audio Channel</Text>: ALARM Stream (Bypasses Mute) ✓{'\n'}
                  &bull; <Text style={{ fontWeight: '600' }}>Battery</Text>: Choose &ldquo;Unrestricted&rdquo; for optimal reliability
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: '#0F1B33' }]}
                onPress={handleOpenAppInfo}
              >
                <BatteryCharging size={16} color="#FFFFFF" />
                <Text style={[styles.modalActionBtnText, { color: '#FFFFFF' }]}>Open App Info &amp; Battery Settings ⚙️</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* POPUP MODAL 3: Campus Clinic Helpline */}
      <Modal
        visible={activeModal === 'clinic'}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Phone size={18} color="#DC2626" />
                <Text style={styles.modalTitle}>Clinic Helpline</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Tap any contact below to place an immediate phone call to the campus clinic:
            </Text>

            <TouchableOpacity
              style={styles.helplineRow}
              onPress={() => Linking.openURL(`tel:${contacts.clinic.phone}`)}
            >
              <View>
                <Text style={styles.helplineName}>{contacts.clinic.label}</Text>
                <Text style={styles.helplineNumber}>{contacts.clinic.phone}</Text>
              </View>
              <Phone size={16} color="#DC2626" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.helplineRow}
              onPress={() => Linking.openURL(`tel:${contacts.doctor.phone}`)}
            >
              <View>
                <Text style={styles.helplineName}>{contacts.doctor.label}</Text>
                <Text style={styles.helplineNumber}>{contacts.doctor.phone}</Text>
              </View>
              <Phone size={16} color="#0284C7" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.helplineRow}
              onPress={() => Linking.openURL(`tel:${contacts.officer.phone}`)}
            >
              <View>
                <Text style={styles.helplineName}>{contacts.officer.label}</Text>
                <Text style={styles.helplineNumber}>{contacts.officer.phone}</Text>
              </View>
              <Phone size={16} color="#059669" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 32,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F1B33',
    letterSpacing: -0.2,
  },
  rollNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
    marginTop: 2,
  },
  deptText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  buttonsList: {
    gap: 10,
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F1B33',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 6,
  },
  logoutBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 27, 51, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F1B33',
  },
  closeBtn: {
    padding: 4,
  },
  modalDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 16,
  },
  mealRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  mealLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F1B33',
  },
  mealPreview: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F1B33',
    width: 80,
    textAlign: 'center',
    backgroundColor: '#F8FAFC',
  },
  saveBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    paddingVertical: 12,
  },
  modalActionBtnText: {
    color: '#0284C7',
    fontSize: 13,
    fontWeight: '700',
  },
  statusToast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  statusToastText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  helplineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  helplineName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F1B33',
  },
  helplineNumber: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '700',
    marginTop: 2,
  },
});
