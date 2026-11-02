import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ReminderEngine } from '../src/services/reminder-engine';
import { StudentApi } from '../src/services/student-api';
import { AuthService } from '../src/services/auth';

export default function SetupScreen() {
  const router = useRouter();
  const [breakfast, setBreakfast] = useState('08:00');
  const [lunch, setLunch] = useState('13:00');
  const [dinner, setDinner] = useState('20:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCompleteSetup = async () => {
    setIsSubmitting(true);
    try {
      await ReminderEngine.init();
      await StudentApi.updateMealTimes({ breakfast, lunch, dinner });
      const doses = await StudentApi.getDoses();
      await ReminderEngine.syncAndScheduleAll(doses, { breakfast, lunch, dinner });
      await AuthService.setSetupCompleted();
      router.replace('/(tabs)');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brandTitle}>INITIAL CONFIGURATION</Text>
          <Text style={styles.title}>Your meal schedule</Text>
          <Text style={styles.subtext}>
            We use your meal times to schedule medicine reminders automatically (&plusmn;30 minutes).
          </Text>
        </View>

        {/* Three Rows: Breakfast, Lunch, Dinner */}
        <View style={styles.scheduleBox}>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowLabel}>Breakfast</Text>
              <Text style={styles.rowSub}>Morning medication window</Text>
            </View>
            <TextInput
              style={styles.timeInput}
              value={breakfast}
              onChangeText={setBreakfast}
              placeholder="08:00"
            />
          </View>

          <View style={styles.row}>
            <View>
              <Text style={styles.rowLabel}>Lunch</Text>
              <Text style={styles.rowSub}>Afternoon medication window</Text>
            </View>
            <TextInput
              style={styles.timeInput}
              value={lunch}
              onChangeText={setLunch}
              placeholder="13:00"
            />
          </View>

          <View style={styles.row}>
            <View>
              <Text style={styles.rowLabel}>Dinner</Text>
              <Text style={styles.rowSub}>Night medication window</Text>
            </View>
            <TextInput
              style={styles.timeInput}
              value={dinner}
              onChangeText={setDinner}
              placeholder="20:00"
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleCompleteSetup}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          <Text style={styles.submitBtnText}>
            {isSubmitting ? 'Configuring alarms...' : 'Continue to Dashboard'}
          </Text>
        </TouchableOpacity>
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
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 28,
  },
  brandTitle: {
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '700',
    color: '#555555',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#121212',
  },
  subtext: {
    fontSize: 14,
    color: '#555555',
    marginTop: 6,
    lineHeight: 20,
  },
  scheduleBox: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EBEBEB',
    marginBottom: 32,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EBEBEB',
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#121212',
  },
  rowSub: {
    fontSize: 12,
    color: '#555555',
    marginTop: 2,
  },
  timeInput: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
    color: '#121212',
    textAlign: 'right',
    padding: 6,
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 6,
    backgroundColor: '#FAFAFA',
  },
  submitBtn: {
    height: 56,
    borderRadius: 12,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
