import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckCircle2, Clock, AlertCircle, HelpCircle } from 'lucide-react-native';
import { DoseScheduleRecord } from '../types/student';

interface TodayTimelineProps {
  doses: DoseScheduleRecord[];
}

export function TodayTimeline({ doses }: TodayTimelineProps) {
  const getStatusBadge = (status: DoseScheduleRecord['status'], confirmedAt?: string) => {
    switch (status) {
      case 'taken':
        return (
          <View style={[styles.badge, styles.takenBadge]}>
            <CheckCircle2 color="#166534" size={12} />
            <Text style={styles.takenBadgeText}>Taken {confirmedAt ? `(${confirmedAt})` : ''}</Text>
          </View>
        );
      case 'taken_late':
        return (
          <View style={[styles.badge, styles.lateBadge]}>
            <CheckCircle2 color="#854d0e" size={12} />
            <Text style={styles.lateBadgeText}>Taken Late</Text>
          </View>
        );
      case 'not_taken':
        return (
          <View style={[styles.badge, styles.missedBadge]}>
            <AlertCircle color="#991b1b" size={12} />
            <Text style={styles.missedBadgeText}>Not Taken</Text>
          </View>
        );
      case 'unconfirmed':
        return (
          <View style={[styles.badge, styles.unconfirmedBadge]}>
            <HelpCircle color="#4b5563" size={12} />
            <Text style={styles.unconfirmedBadgeText}>Unconfirmed</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.badge, styles.scheduledBadge]}>
            <Clock color="#1e40af" size={12} />
            <Text style={styles.scheduledBadgeText}>Upcoming</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Today&apos;s Medication Timeline</Text>

      <View style={styles.timelineList}>
        {doses.map((dose, index) => {
          const relationStr = dose.meal_relation === 'after' ? 'After' : 'Before';
          const mealStr = dose.meal_slot.charAt(0).toUpperCase() + dose.meal_slot.slice(1);
          const isLast = index === doses.length - 1;

          return (
            <View key={dose.id} style={styles.itemRow}>
              {/* Timeline indicator column */}
              <View style={styles.indicatorCol}>
                <View
                  style={[
                    styles.dot,
                    dose.status === 'taken' && styles.dotTaken,
                    dose.status === 'taken_late' && styles.dotLate,
                    dose.status === 'not_taken' && styles.dotMissed,
                  ]}
                />
                {!isLast && <View style={styles.verticalLine} />}
              </View>

              {/* Item Card */}
              <View style={styles.cardBox}>
                <View style={styles.itemHeader}>
                  <Text style={styles.medicineName}>{dose.medicine_name}</Text>
                  {getStatusBadge(dose.status, dose.confirmed_at)}
                </View>
                <Text style={styles.detailsText}>
                  {dose.dose} &bull; {relationStr} {mealStr} ({dose.scheduled_time})
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  heading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a0a0a',
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  timelineList: {
    gap: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  indicatorCol: {
    width: 28,
    alignItems: 'center',
    paddingTop: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6',
  },
  dotTaken: {
    backgroundColor: '#10b981',
  },
  dotLate: {
    backgroundColor: '#f59e0b',
  },
  dotMissed: {
    backgroundColor: '#ef4444',
  },
  verticalLine: {
    width: 2,
    flex: 1,
    minHeight: 44,
    backgroundColor: '#e4e4e7',
    marginTop: 4,
  },
  cardBox: {
    flex: 1,
    backgroundColor: '#f4f4f5', // soft gray secondary surface
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  medicineName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0a0a0a',
  },
  detailsText: {
    fontSize: 12,
    color: '#71717a',
    fontWeight: '500',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  takenBadge: {
    backgroundColor: '#dcfce7',
  },
  takenBadgeText: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '700',
  },
  lateBadge: {
    backgroundColor: '#fef3c7',
  },
  lateBadgeText: {
    color: '#854d0e',
    fontSize: 11,
    fontWeight: '700',
  },
  missedBadge: {
    backgroundColor: '#fee2e2',
  },
  missedBadgeText: {
    color: '#991b1b',
    fontSize: 11,
    fontWeight: '700',
  },
  unconfirmedBadge: {
    backgroundColor: '#f3f4f6',
  },
  unconfirmedBadgeText: {
    color: '#4b5563',
    fontSize: 11,
    fontWeight: '700',
  },
  scheduledBadge: {
    backgroundColor: '#dbeafe',
  },
  scheduledBadgeText: {
    color: '#1e40af',
    fontSize: 11,
    fontWeight: '700',
  },
});
