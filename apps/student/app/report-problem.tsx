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
import { AlertOctagon, PhoneCall, Send, ArrowLeft, ShieldAlert, Check } from 'lucide-react-native';
import { StudentApi } from '../src/services/student-api';
import { EMERGENCY_CONTACTS } from '@kiet-smart-care/shared';

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
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="#0a0a0a" size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report a Concern / Side Effect</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Prominent Emergency/Doctor Call Banner Always Available */}
        <View style={styles.doctorBanner}>
          <View style={styles.doctorBannerHeader}>
            <ShieldAlert color="#991b1b" size={20} />
            <Text style={styles.doctorBannerTitle}>Immediate Doctor Contact</Text>
          </View>
          <Text style={styles.doctorBannerSub}>
            If you have sudden severe allergic symptoms, chest tightness, or dizziness, call campus health staff right away.
          </Text>
          <TouchableOpacity
            style={styles.callDoctorBtn}
            onPress={handleCallDoctor}
            activeOpacity={0.85}
          >
            <PhoneCall color="#ffffff" size={16} />
            <Text style={styles.callDoctorBtnText}>Call Campus Clinic Doctor</Text>
          </TouchableOpacity>
        </View>

        {!isSubmitted ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Describe Your Symptom or Side Effect</Text>
            <Text style={styles.formSub}>
              Submitting this form immediately flags a RED PRIORITY ALERT to Dr. Verma and the Campus Health Officer.
            </Text>

            <TextInput
              style={styles.textArea}
              placeholder="e.g. Started experiencing nausea and a red skin rash 1 hour after taking the afternoon dose..."
              placeholderTextColor="#a1a1aa"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={styles.sendBtn}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              <Send color="#ffffff" size={16} />
              <Text style={styles.sendBtnText}>
                {isSubmitting ? 'Sending Alert...' : 'Send Urgent Alert to Doctor'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <Check color="#ffffff" size={24} />
            </View>
            <Text style={styles.successTitle}>Red Alert Broadcasted</Text>
            <Text style={styles.successBody}>
              Your report has been dispatched to your prescribing doctor and all Campus Health Officers. Someone from the clinic will contact you shortly.
            </Text>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => router.back()}
              activeOpacity={0.85}
            >
              <Text style={styles.doneBtnText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
    gap: 12,
  },
  backBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#f4f4f5',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a0a0a',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  doctorBanner: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 20,
    padding: 18,
  },
  doctorBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  doctorBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#991b1b',
  },
  doctorBannerSub: {
    fontSize: 12,
    color: '#7f1d1d',
    lineHeight: 17,
    marginBottom: 14,
  },
  callDoctorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    height: 46,
    borderRadius: 12,
    gap: 8,
  },
  callDoctorBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#f4f4f5',
    borderRadius: 20,
    padding: 20,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a0a0a',
  },
  formSub: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 4,
    lineHeight: 16,
    marginBottom: 16,
  },
  textArea: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    padding: 14,
    fontSize: 14,
    color: '#0a0a0a',
    minHeight: 120,
    marginBottom: 16,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0a',
    height: 50,
    borderRadius: 14,
    gap: 8,
  },
  sendBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  successCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    textAlign: 'center',
  },
  successIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 6,
  },
  successBody: {
    fontSize: 13,
    color: '#15803d',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  doneBtn: {
    backgroundColor: '#166534',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  doneBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
});
