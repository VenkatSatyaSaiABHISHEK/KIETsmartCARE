import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { StudentApi } from '../../src/services/student-api';
import { PrescriptionRecord } from '../../src/types/student';

export default function MedicinesScreen() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadPrescriptions = async () => {
    try {
      const data = await StudentApi.getPrescriptions();
      setPrescriptions(data);
    } catch (e) {
      console.warn('Failed loading prescriptions:', e);
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
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Active Prescriptions Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Prescriptions</Text>
          <Text style={styles.sectionSub}>Synchronized with your meal reminder schedule.</Text>
        </View>

        {activePrescriptions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No active medication courses on file.</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {activePrescriptions.map((rx) => (
              <View key={rx.id} style={styles.rxBlock}>
                <View style={styles.rxHeader}>
                  <Text style={styles.problemTitle}>{rx.problem_category}</Text>
                  <Text style={styles.dateText}>
                    {rx.start_date} &mdash; {rx.end_date}
                  </Text>
                </View>

                <Text style={styles.doctorText}>Prescribed by {rx.doctor_name}</Text>

                <View style={styles.medicinesList}>
                  {rx.medicines.map((med, idx) => (
                    <View key={idx} style={styles.medicineRow}>
                      <View style={styles.medMain}>
                        <Text style={styles.medName}>{med.name}</Text>
                        <Text style={styles.medDetail}>
                          {med.dose} &bull; {med.meal_relation === 'after' ? 'After' : 'Before'}{' '}
                          {med.meal_slot}
                        </Text>
                      </View>
                      <View style={styles.durationPill}>
                        <Text style={styles.durationText}>{med.duration_days} days</Text>
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
          <>
            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <Text style={styles.sectionTitle}>Past Prescriptions</Text>
            </View>
            <View style={styles.listContainer}>
              {pastPrescriptions.map((rx) => (
                <View key={rx.id} style={[styles.rxBlock, styles.pastRxBlock]}>
                  <View style={styles.rxHeader}>
                    <Text style={styles.problemTitle}>{rx.problem_category}</Text>
                    <Text style={styles.dateText}>{rx.start_date}</Text>
                  </View>
                  <Text style={styles.doctorText}>Prescribed by {rx.doctor_name}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 90,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#121212',
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: 12,
    color: '#555555',
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#555555',
  },
  listContainer: {
    gap: 12,
  },
  rxBlock: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 12,
    padding: 16,
  },
  pastRxBlock: {
    opacity: 0.7,
  },
  rxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  problemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#121212',
    flex: 1,
  },
  dateText: {
    fontSize: 11,
    color: '#555555',
  },
  doctorText: {
    fontSize: 12,
    color: '#555555',
    marginBottom: 12,
  },
  medicinesList: {
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 10,
    gap: 8,
  },
  medicineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medMain: {
    flex: 1,
  },
  medName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#121212',
  },
  medDetail: {
    fontSize: 11,
    color: '#555555',
    marginTop: 1,
  },
  durationPill: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
});
