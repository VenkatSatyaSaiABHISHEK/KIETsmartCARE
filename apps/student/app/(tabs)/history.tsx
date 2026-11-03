import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { StudentApi } from '../../src/services/student-api';

interface VisitTimelineItem {
  id: string;
  date: string;
  doctor: string;
  problem: string;
  medicines: string;
  outcome: 'Recovered' | 'Active Course' | 'Under Review';
}

export default function HistoryScreen() {
  const [history, setHistory] = useState<VisitTimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVisits = async (showLoading = true) => {
    try {
      if (showLoading && history.length === 0) {
        setLoading(true);
      }
      const items = await StudentApi.getHistory();
      setHistory(items);
    } catch (e) {
      console.warn('Error fetching history:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchVisits(false);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchVisits();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Medical History</Text>
          <Text style={styles.subtext}>Your complete campus clinic consultation timeline</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#0284C7" />
            <Text style={styles.loadingText}>Loading clinical records...</Text>
          </View>
        ) : history.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No medical consultation history on record.</Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {history.map((item, index) => {
              const isLast = index === history.length - 1;
              const isCurrent = item.outcome === 'Active Course';

              return (
                <View key={item.id} style={styles.timelineRow}>
                  {/* Left Column: Spine & Bullet */}
                  <View style={styles.spineCol}>
                    <View
                      style={[
                        styles.bullet,
                        isCurrent ? styles.bulletActive : styles.bulletPast,
                      ]}
                    />
                    {!isLast && <View style={styles.spineLine} />}
                  </View>

                  {/* Right Column: Content Card */}
                  <View style={styles.cardCol}>
                    <View style={styles.visitCard}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.date}>{item.date}</Text>
                        <View
                          style={[
                            styles.badge,
                            item.outcome === 'Recovered'
                              ? styles.badgeRecovered
                              : item.outcome === 'Active Course'
                              ? styles.badgeActive
                              : styles.badgeReview,
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              item.outcome === 'Recovered'
                                ? styles.badgeTextRecovered
                                : item.outcome === 'Active Course'
                                ? styles.badgeTextActive
                                : styles.badgeTextReview,
                            ]}
                          >
                            {item.outcome}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.problem}>{item.problem}</Text>
                      <Text style={styles.doctor}>Attended by {item.doctor}</Text>

                      <View style={styles.medicineBox}>
                        <Text style={styles.medLabel}>PRESCRIBED REGIMEN</Text>
                        <Text style={styles.medValue}>{item.medicines}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
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
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#121212',
    letterSpacing: -0.3,
  },
  subtext: {
    fontSize: 12,
    color: '#555555',
    marginTop: 2,
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#555555',
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
  timeline: {
    marginTop: 4,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  spineCol: {
    width: 24,
    alignItems: 'center',
  },
  bullet: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  bulletActive: {
    backgroundColor: '#0284C7',
    borderWidth: 2,
    borderColor: '#BAE6FD',
  },
  bulletPast: {
    backgroundColor: '#059669',
  },
  spineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  cardCol: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 20,
  },
  visitCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  date: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555555',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeRecovered: {
    backgroundColor: '#ECFDF5',
  },
  badgeActive: {
    backgroundColor: '#EFF6FF',
  },
  badgeReview: {
    backgroundColor: '#FFFBEB',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeTextRecovered: {
    color: '#059669',
  },
  badgeTextActive: {
    color: '#0284C7',
  },
  badgeTextReview: {
    color: '#B45309',
  },
  problem: {
    fontSize: 15,
    fontWeight: '700',
    color: '#121212',
    marginBottom: 2,
  },
  doctor: {
    fontSize: 12,
    color: '#555555',
    marginBottom: 10,
  },
  medicineBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  medLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#6B7280',
    marginBottom: 4,
  },
  medValue: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '500',
  },
});
