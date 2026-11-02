import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StudentApi } from '../src/services/student-api';
import { EMERGENCY_CONTACTS } from '../src/constants/shared';

export default function ReportProblemScreen() {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      alert('Please describe your symptoms or side effect.');
      return;
    }

    setIsSubmitting(true);
    try {
      await StudentApi.reportProblem(description);
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCallDoctor = () => {
    Linking.openURL(`tel:${EMERGENCY_CONTACTS.CAMPUS_HEALTH_CENTRE}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>&larr; Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.brandTitle}>CLINICAL FEEDBACK</Text>
          <Text style={styles.title}>Report a problem</Text>
          <Text style={styles.subtext}>
            Report an unexpected side effect, missed dosage question, or worsening symptoms.
          </Text>
        </View>

        {isSubmitted ? (
          <View style={styles.submittedBox}>
            <Text style={styles.submittedTitle}>Report Transmitted</Text>
            <Text style={styles.submittedSub}>
              Your report has been logged and sent to the campus health team. If you require urgent assistance, please call the clinic directly.
            </Text>
            <TouchableOpacity style={styles.callBtn} onPress={handleCallDoctor}>
              <Text style={styles.callBtnText}>Call Clinic: +91-120-2983555</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Describe the issue</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={5}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe what you are experiencing (e.g. rash, dizziness, nausea)..."
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Text style={styles.submitBtnText}>
                {isSubmitting ? 'Sending report...' : 'Submit Report'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.noteText}>
              Your report is sent directly to the campus health team.
            </Text>

            {/* Emergency Hotline Action */}
            <View style={styles.emergencyBox}>
              <Text style={styles.emergencyHeading}>Immediate Medical Urgency</Text>
              <Text style={styles.emergencySub}>
                If you have chest pain, breathlessness, or severe allergic reaction, do not wait for a text response.
              </Text>
              <TouchableOpacity
                style={styles.emergencyBtn}
                onPress={handleCallDoctor}
                activeOpacity={0.8}
              >
                <Text style={styles.emergencyBtnText}>Call Campus Health Center &rarr;</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topNav: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backBtn: {
    paddingVertical: 6,
  },
  backText: {
    fontSize: 14,
    color: '#121212',
    fontWeight: '600',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
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
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#121212',
  },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 8,
    padding: 14,
    fontSize: 14,
    color: '#121212',
    backgroundColor: '#FAFAFA',
  },
  submitBtn: {
    height: 56,
    borderRadius: 12,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  noteText: {
    fontSize: 12,
    color: '#555555',
    textAlign: 'center',
  },
  emergencyBox: {
    marginTop: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  emergencyHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 4,
  },
  emergencySub: {
    fontSize: 12,
    color: '#555555',
    lineHeight: 16,
    marginBottom: 12,
  },
  emergencyBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#991B1B',
    borderRadius: 6,
  },
  emergencyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  submittedBox: {
    padding: 24,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 8,
    gap: 12,
  },
  submittedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#121212',
  },
  submittedSub: {
    fontSize: 13,
    color: '#555555',
    lineHeight: 18,
  },
  callBtn: {
    marginTop: 8,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
