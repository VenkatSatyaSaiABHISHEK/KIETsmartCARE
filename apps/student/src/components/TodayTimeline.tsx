import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckCircle2, Clock, AlertCircle, HelpCircle } from 'lucide-react-native';
import { DoseScheduleRecord } from '../types/student';
import { formatTime12h } from '../constants/shared';

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
            <Text style={styles.takenBadgeText}>Taken {confirmedAt ? `(${formatTime12h(confirmedAt)})` : ''}</Text>
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
      <Text style={styles.heading}>TODAY&apos;S SCHEDULE</Text>

      <View style={styles.timelineList}>
        {doses.map((dose, index) => {
          const relationStr = dose.meal_relation === 'after' ? 'After' : 'Before';
          const mealStr = (dose.slot || dose.meal_slot || 'Meal').charAt(0).toUpperCase() + (dose.slot || dose.meal_slot || 'Meal').slice(1);
          const isLast = index === doses.length - 1;
          const displayTime = formatTime12h(dose.scheduled_at || dose.time || dose.scheduled_time);

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
                  {dose.dose || (dose.tablets ? `${dose.tablets} tablet` : '1 tablet')} • {relationStr} {mealStr} ({displayTime})
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
    marginTop: 18,
    marginHorizontal: 16,
  },
  heading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  timelineList: {
    gap: 0,
  },
  itemRow: {
    flexDirection: 'row',
  },
  indicatorCol: {
    width: 24,
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#94A3B8',
    marginTop: 6,
  },
  dotTaken: {
    backgroundColor: '#059669',
  },
  dotLate: {
    backgroundColor: '#D97706',
  },
  dotMissed: {
    backgroundColor: '#DC2626',
  },
  verticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  cardBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  medicineName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F1B33',
  },
  detailsText: {
    fontSize: 13,
    color: '#64748B',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  takenBadge: {
    backgroundColor: '#ECFDF5',
  },
  takenBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  lateBadge: {
    backgroundColor: '#FFFBEB',
  },
  lateBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  missedBadge: {
    backgroundColor: '#FEF2F2',
  },
  missedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
  unconfirmedBadge: {
    backgroundColor: '#F3F4F6',
  },
  unconfirmedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  scheduledBadge: {
    backgroundColor: '#EFF6FF',
  },
  scheduledBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
});
