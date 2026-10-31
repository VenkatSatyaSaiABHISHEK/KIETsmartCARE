import React from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView } from 'react-native';
import { Calendar, Stethoscope, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react-native';

interface VisitTimelineItem {
  id: string;
  date: string;
  doctor: string;
  problem: string;
  medicines: string;
  outcome: 'Recovered' | 'Active Course' | 'Under Review';
}

const HISTORY_TIMELINE: VisitTimelineItem[] = [
  {
    id: 'vh-1',
    date: '29 Oct 2026',
    doctor: 'Dr. Alok Verma, MBBS, MD',
    problem: 'Fever & Head Cold',
    medicines: 'Paracetamol 650mg, Pantoprazole 40mg, Cetirizine 10mg',
    outcome: 'Active Course',
  },
  {
    id: 'vh-2',
    date: '14 Sep 2026',
    doctor: 'Dr. R. K. Singhal',
    problem: 'Tension Headache',
    medicines: 'Paracetamol 500mg (2 days)',
    outcome: 'Recovered',
  },
  {
    id: 'vh-3',
    date: '02 Aug 2026',
    doctor: 'Dr. Alok Verma',
    problem: 'Acute Acidity',
    medicines: 'Pantoprazole 40mg, Domperidone 10mg (3 days)',
    outcome: 'Recovered',
  },
];

export default function HistoryScreen() {
  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>OPD Visit Timeline</Text>
          <Text style={styles.subtitle}>
            Immutable historical record of campus consultations and clinical outcomes.
          </Text>
        </View>

        <View style={styles.timelineContainer}>
          {HISTORY_TIMELINE.map((item, index) => {
            const isLast = index === HISTORY_TIMELINE.length - 1;
            return (
              <View key={item.id} style={styles.timelineRow}>
                <View style={styles.lineCol}>
                  <View style={[styles.dot, item.outcome === 'Active Course' && styles.dotActive]} />
                  {!isLast && <View style={styles.verticalLine} />}
                </View>

                <View style={styles.eventCard}>
                  <View style={styles.eventCardHeader}>
                    <View style={styles.dateBadge}>
                      <Calendar color="#2563eb" size={12} />
                      <Text style={styles.dateText}>{item.date}</Text>
                    </View>
                    <View
                      style={[
                        styles.outcomeBadge,
                        item.outcome === 'Recovered'
                          ? styles.outcomeRecovered
                          : styles.outcomeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.outcomeText,
                          item.outcome === 'Recovered'
                            ? styles.outcomeTextRecovered
                            : styles.outcomeTextActive,
                        ]}
                      >
                        {item.outcome}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.problemName}>{item.problem}</Text>
                  <Text style={styles.doctorName}>Doctor: {item.doctor}</Text>

                  <View style={styles.medsBox}>
                    <Text style={styles.medsLabel}>Prescribed Meds:</Text>
                    <Text style={styles.medsText}>{item.medicines}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.auditNotice}>
          <ShieldCheck color="#71717a" size={16} />
          <Text style={styles.auditNoticeText}>
            Medical records cannot be modified or deleted. Past visit data is preserved as permanent medical history.
          </Text>
        </View>
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
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0a0a0a',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 4,
    lineHeight: 16,
  },
  timelineContainer: {
    marginTop: 8,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  lineCol: {
    width: 24,
    alignItems: 'center',
    paddingTop: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#a1a1aa',
  },
  dotActive: {
    backgroundColor: '#2563eb',
  },
  verticalLine: {
    width: 2,
    flex: 1,
    minHeight: 50,
    backgroundColor: '#f4f4f5',
    marginTop: 4,
  },
  eventCard: {
    flex: 1,
    backgroundColor: '#f4f4f5',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  outcomeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  outcomeRecovered: {
    backgroundColor: '#dcfce7',
  },
  outcomeActive: {
    backgroundColor: '#dbeafe',
  },
  outcomeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  outcomeTextRecovered: {
    color: '#166534',
  },
  outcomeTextActive: {
    color: '#1e40af',
  },
  problemName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a0a0a',
  },
  doctorName: {
    fontSize: 12,
    color: '#52525b',
    marginTop: 2,
  },
  medsBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 10,
  },
  medsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#71717a',
    textTransform: 'uppercase',
  },
  medsText: {
    fontSize: 12,
    color: '#0a0a0a',
    marginTop: 2,
    fontWeight: '500',
  },
  auditNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#f4f4f5',
    padding: 14,
    borderRadius: 14,
    marginTop: 12,
  },
  auditNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#71717a',
    lineHeight: 15,
  },
});
