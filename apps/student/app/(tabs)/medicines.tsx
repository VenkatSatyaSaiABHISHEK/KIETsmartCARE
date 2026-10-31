import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Pill, UserCheck, Calendar, Clock, ShieldCheck } from 'lucide-react-native';
import { StudentApi } from '../../src/services/student-api';
import { PrescriptionRecord } from '../../src/types/student';

export default function MedicinesScreen() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);

  useEffect(() => {
    async function load() {
      const data = await StudentApi.getPrescriptions();
      setPrescriptions(data);
    }
    load();
  }, []);

  const activePrescriptions = prescriptions.filter((p) => p.is_active);
  const pastPrescriptions = prescriptions.filter((p) => !p.is_active);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Active Prescriptions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Prescription Courses</Text>
          <Text style={styles.sectionSub}>Currently synchronized with meal reminders</Text>
        </View>

        {activePrescriptions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No active medication courses on file.</Text>
          </View>
        ) : (
          activePrescriptions.map((rx) => (
            <View key={rx.id} style={styles.rxCard}>
              <View style={styles.rxCardTop}>
                <div>
                  <View style={styles.activePill}>
                    <Text style={styles.activePillText}>ACTIVE COURSE</Text>
                  </View>
                  <Text style={styles.problemName}>{rx.problem_category}</Text>
                </div>
                <View style={styles.dateBadge}>
                  <Calendar color="#666666" size={12} />
                  <Text style={styles.dateBadgeText}>{rx.start_date} - {rx.end_date}</Text>
                </View>
              </View>

              <View style={styles.doctorRow}>
                <UserCheck color="#2563eb" size={14} />
                <Text style={styles.doctorName}>Prescribed by {rx.doctor_name}</Text>
              </View>

              <View style={styles.medicinesList}>
                {rx.medicines.map((med, idx) => (
                  <View key={idx} style={styles.medicineItem}>
                    <View style={styles.medIconBox}>
                      <Pill color="#0a0a0a" size={16} />
                    </View>
                    <View style={styles.medInfo}>
                      <Text style={styles.medName}>{med.name}</Text>
                      <Text style={styles.medDetails}>
                        {med.dose} &bull; {med.meal_relation === 'after' ? 'After' : 'Before'} {med.meal_slot}
                      </Text>
                    </View>
                    <View style={styles.durationPill}>
                      <Text style={styles.durationPillText}>{med.duration_days} Days</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}

        {/* Past Prescriptions History */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Past Prescriptions History</Text>
          <Text style={styles.sectionSub}>Prior courses completed at Campus Health OPD</Text>
        </View>

        {pastPrescriptions.map((rx) => (
          <View key={rx.id} style={[styles.rxCard, styles.pastRxCard]}>
            <View style={styles.rxCardTop}>
              <Text style={[styles.problemName, styles.pastProblemName]}>
                {rx.problem_category}
              </Text>
              <Text style={styles.dateBadgeText}>{rx.start_date} - {rx.end_date}</Text>
            </View>
            <Text style={styles.doctorName}>Doctor: {rx.doctor_name}</Text>

            <View style={styles.medicinesList}>
              {rx.medicines.map((med, idx) => (
                <View key={idx} style={[styles.medicineItem, styles.pastMedicineItem]}>
                  <Text style={styles.pastMedName}>{med.name} ({med.dose})</Text>
                  <Text style={styles.pastMedDetails}>Completed {med.duration_days} days course</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
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
    paddingBottom: 40,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0a0a0a',
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 18,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#71717a',
  },
  rxCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  pastRxCard: {
    backgroundColor: '#fafafa',
    borderColor: '#f4f4f5',
  },
  rxCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  activePill: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  activePillText: {
    color: '#1e40af',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  problemName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0a0a0a',
  },
  pastProblemName: {
    color: '#52525b',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  dateBadgeText: {
    fontSize: 11,
    color: '#71717a',
    fontWeight: '600',
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  doctorName: {
    fontSize: 12,
    color: '#52525b',
    fontWeight: '600',
  },
  medicinesList: {
    gap: 8,
  },
  medicineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f4f5',
    padding: 12,
    borderRadius: 14,
    gap: 10,
  },
  pastMedicineItem: {
    backgroundColor: '#f4f4f5',
    justifyContent: 'space-between',
  },
  medIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0a0a0a',
  },
  medDetails: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
    fontWeight: '500',
  },
  pastMedName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3f3f46',
  },
  pastMedDetails: {
    fontSize: 11,
    color: '#71717a',
  },
  durationPill: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  durationPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0a0a0a',
  },
});
