import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Pill, Calendar, Clock, Stethoscope } from 'lucide-react-native';
import { StudentApi } from '../../src/services/student-api';
import { PrescriptionRecord } from '../../src/types/student';

export default function MedicinesScreen() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadPrescriptions = async () => {
    try {
      const data = await StudentApi.getPrescriptions();
      setPrescriptions(data || []);
    } catch (e) {
      console.warn('Failed loading prescriptions:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPrescriptions();
    }, [])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadPrescriptions();
    } finally {
      setIsRefreshing(false);
    }
  };

  const activePrescriptions = prescriptions.filter((p) => p.is_active);
  const pastPrescriptions = prescriptions.filter((p) => !p.is_active);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#0284C7" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerSubtitle}>CAMPUS CLINIC</Text>
          <Text style={styles.headerTitle}>My Prescriptions</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#0284C7" />
            <Text style={styles.loadingText}>Loading prescribed medications...</Text>
          </View>
        ) : prescriptions.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Pill size={24} color="#0284C7" />
            </View>
            <Text style={styles.emptyTitle}>No Active Prescriptions</Text>
            <Text style={styles.emptySubtext}>
              When you visit the campus OPD clinic, your prescribed medicines, dosage schedules, and course duration will appear here.
            </Text>
          </View>
        ) : (
          <>
            {/* Active Prescriptions */}
            {activePrescriptions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>ACTIVE COURSES</Text>
                {activePrescriptions.map((p) => (
                  <View key={p.id} style={styles.prescriptionCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.doctorBadge}>
                        <Stethoscope size={14} color="#0284C7" />
                        <Text style={styles.doctorName}>{p.doctor_name || 'Campus OPD Doctor'}</Text>
                      </View>
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>ACTIVE</Text>
                      </View>
                    </View>

                    <Text style={styles.diagnosisText}>{p.problem_category || 'Clinical Consultation'}</Text>

                    <View style={styles.dateRow}>
                      <Calendar size={13} color="#64748B" />
                      <Text style={styles.dateText}>
                        {p.start_date} &bull; Valid until {p.end_date}
                      </Text>
                    </View>

                    <View style={styles.medsDivider} />

                    <View style={styles.medsList}>
                      {(p.medicines || []).map((m, idx) => (
                        <View key={idx} style={styles.medItem}>
                          <View style={styles.medBullet}>
                            <Pill size={14} color="#0F172A" />
                          </View>
                          <View style={styles.medMeta}>
                            <Text style={styles.medItemName}>{m.name}</Text>
                            <Text style={styles.medItemDosage}>
                              {m.dose} &bull; {m.meal_relation === 'after' ? 'After food' : 'Before food'} &bull; {m.duration_days} days
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Past Prescriptions */}
            {pastPrescriptions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>PREVIOUS COURSES</Text>
                {pastPrescriptions.map((p) => (
                  <View key={p.id} style={[styles.prescriptionCard, styles.pastCard]}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.pastDoctorName}>{p.doctor_name}</Text>
                      <Text style={styles.completedBadge}>COMPLETED</Text>
                    </View>
                    <Text style={styles.pastDiagnosis}>{p.problem_category}</Text>
                    <Text style={styles.pastDate}>{p.start_date}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
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
  header: {
    marginBottom: 16,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  prescriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  doctorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  doctorName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },
  activeBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  diagnosisText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
  },
  medsDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  medsList: {
    gap: 10,
  },
  medItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  medBullet: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medMeta: {
    flex: 1,
  },
  medItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  medItemDosage: {
    fontSize: 12,
    color: '#64748B',
  },
  pastCard: {
    opacity: 0.75,
  },
  pastDoctorName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  completedBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  pastDiagnosis: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 4,
  },
  pastDate: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
});
