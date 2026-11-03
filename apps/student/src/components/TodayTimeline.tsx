import React, { useMemo } from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import {
  Sun,
  Sunset,
  Moon,
  Coffee,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Pill,
} from 'lucide-react-native';
import { DoseScheduleRecord } from '../types/student';
import { formatTime12h } from '../constants/shared';

interface TodayTimelineProps {
  doses: DoseScheduleRecord[];
  onAnswerDose?: (doseId: string, status: 'taken' | 'taken_late' | 'not_taken') => void;
}

interface MealGroup {
  key: string;
  slotName: string;
  timeDisplay: string;
  mealRelation: string;
  doses: DoseScheduleRecord[];
  status: 'taken' | 'taken_late' | 'not_taken' | 'upcoming' | 'unconfirmed';
  isNextDue: boolean;
}

export function TodayTimeline({ doses }: TodayTimelineProps) {
  // Group doses by scheduled time & meal slot
  const mealGroups: MealGroup[] = useMemo(() => {
    if (!doses || doses.length === 0) return [];

    const map = new Map<string, DoseScheduleRecord[]>();

    doses.forEach((d) => {
      const timeStr = d.scheduled_at || d.time || d.scheduled_time || '08:00';
      const slot = (d.slot || d.meal_slot || 'morning').toLowerCase();
      const groupKey = `${slot}_${timeStr}`;

      if (!map.has(groupKey)) {
        map.set(groupKey, []);
      }
      map.get(groupKey)!.push(d);
    });

    let foundNextDue = false;

    return Array.from(map.entries()).map(([key, groupDoses]) => {
      const first = groupDoses[0];
      const rawSlot = (first.slot || first.meal_slot || 'morning').toLowerCase();

      let slotLabel = 'Morning';
      if (rawSlot.includes('lunch') || rawSlot.includes('afternoon')) slotLabel = 'Afternoon';
      else if (rawSlot.includes('evening')) slotLabel = 'Evening';
      else if (rawSlot.includes('night') || rawSlot.includes('dinner')) slotLabel = 'Night';
      else if (rawSlot.includes('breakfast')) slotLabel = 'Morning';
      else slotLabel = rawSlot.charAt(0).toUpperCase() + rawSlot.slice(1);

      const timeDisplay = formatTime12h(first.scheduled_at || first.time || first.scheduled_time);
      const mealRelation = first.meal_relation === 'before' ? 'Before food' : 'After food';

      // Determine collective status for this group
      const allTaken = groupDoses.every((d) => d.status === 'taken');
      const anyLate = groupDoses.some((d) => d.status === 'taken_late');
      const anyMissed = groupDoses.some((d) => d.status === 'not_taken');
      const anyUnconfirmed = groupDoses.some((d) => d.status === 'unconfirmed');

      let groupStatus: MealGroup['status'] = 'upcoming';
      if (allTaken) groupStatus = 'taken';
      else if (anyLate) groupStatus = 'taken_late';
      else if (anyMissed) groupStatus = 'not_taken';
      else if (anyUnconfirmed) groupStatus = 'unconfirmed';

      let isNextDue = false;
      if (!foundNextDue && (groupStatus === 'upcoming' || groupStatus === 'unconfirmed')) {
        isNextDue = true;
        foundNextDue = true;
      }

      return {
        key,
        slotName: slotLabel,
        timeDisplay,
        mealRelation,
        doses: groupDoses,
        status: groupStatus,
        isNextDue,
      };
    });
  }, [doses]);

  const getSlotIcon = (slotName: string, size = 18) => {
    const s = slotName.toLowerCase();
    if (s.includes('morning')) return <Sun size={size} color="#D97706" />;
    if (s.includes('afternoon')) return <Sunset size={size} color="#0284C7" />;
    if (s.includes('evening')) return <Coffee size={size} color="#7C3AED" />;
    return <Moon size={size} color="#3B82F6" />;
  };

  const getStatusBadge = (status: MealGroup['status'], isNextDue: boolean) => {
    if (status === 'taken') {
      return (
        <View style={[styles.badge, styles.badgeTaken]}>
          <CheckCircle2 size={12} color="#166534" />
          <Text style={styles.badgeTextTaken}>All Taken</Text>
        </View>
      );
    }
    if (status === 'taken_late') {
      return (
        <View style={[styles.badge, styles.badgeLate]}>
          <Clock size={12} color="#854D0E" />
          <Text style={styles.badgeTextLate}>Taken Late</Text>
        </View>
      );
    }
    if (status === 'not_taken') {
      return (
        <View style={[styles.badge, styles.badgeMissed]}>
          <AlertCircle size={12} color="#991B1B" />
          <Text style={styles.badgeTextMissed}>Missed</Text>
        </View>
      );
    }
    if (isNextDue) {
      return (
        <View style={[styles.badge, styles.badgeNextDue]}>
          <Clock size={12} color="#1D4ED8" />
          <Text style={styles.badgeTextNextDue}>Next Due</Text>
        </View>
      );
    }
    return (
      <View style={[styles.badge, styles.badgeUpcoming]}>
        <Clock size={12} color="#64748B" />
        <Text style={styles.badgeTextUpcoming}>Upcoming</Text>
      </View>
    );
  };

  if (mealGroups.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <CheckCircle2 size={28} color="#059669" />
        <Text style={styles.emptyTitle}>No Doses Scheduled for Today</Text>
        <Text style={styles.emptySubtitle}>
          You have no pending medication doses. Stay healthy and well hydrated!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>TODAY&apos;S SCHEDULE</Text>
        <Text style={styles.subheading}>{mealGroups.length} meal sessions</Text>
      </View>

      <View style={styles.groupList}>
        {mealGroups.map((group) => {
          return (
            <View
              key={group.key}
              style={[
                styles.mealCard,
                group.isNextDue && styles.mealCardActive,
                group.status === 'taken' && styles.mealCardTaken,
              ]}
            >
              {/* Highlight bar for next due */}
              {group.isNextDue && <View style={styles.activeBar} />}

              {/* Card Header: Slot Icon + Title + Time + Badge */}
              <View style={styles.cardHeader}>
                <View style={styles.slotInfoLeft}>
                  <View style={styles.iconCircle}>{getSlotIcon(group.slotName)}</View>
                  <View>
                    <Text style={styles.slotTitle}>{group.slotName} Session</Text>
                    <Text style={styles.slotTimeSubtext}>
                      {group.timeDisplay} • {group.mealRelation}
                    </Text>
                  </View>
                </View>
                {getStatusBadge(group.status, group.isNextDue)}
              </View>

              {/* Medicine items in this session */}
              <View style={styles.medsContainer}>
                {group.doses.map((d, dIdx) => (
                  <View
                    key={d.id || dIdx}
                    style={[
                      styles.medItemRow,
                      dIdx > 0 && styles.medItemBorder,
                    ]}
                  >
                    <View style={styles.medLeft}>
                      <Pill size={15} color="#0F1B33" />
                      <Text style={styles.medicineNameText}>{d.medicine_name}</Text>
                    </View>
                    <View style={styles.dosePill}>
                      <Text style={styles.dosePillText}>
                        {d.tablets ? `${d.tablets} tablet${d.tablets > 1 ? 's' : ''}` : d.dose || '1 tablet'}
                      </Text>
                    </View>
                  </View>
                ))}
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
    marginTop: 20,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heading: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  subheading: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  groupList: {
    gap: 12,
  },
  mealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0F1B33',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(15,27,51,0.04)',
      },
    }),
  },
  mealCardActive: {
    borderColor: '#1D4ED8',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
  },
  mealCardTaken: {
    backgroundColor: '#FAFDFB',
    borderColor: '#DCFCE7',
  },
  activeBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#1D4ED8',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  slotInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F1B33',
  },
  slotTimeSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeTaken: {
    backgroundColor: '#DCFCE7',
  },
  badgeTextTaken: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  badgeLate: {
    backgroundColor: '#FEF9C3',
  },
  badgeTextLate: {
    fontSize: 11,
    fontWeight: '700',
    color: '#854D0E',
  },
  badgeMissed: {
    backgroundColor: '#FEE2E2',
  },
  badgeTextMissed: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991B1B',
  },
  badgeNextDue: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  badgeTextNextDue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  badgeUpcoming: {
    backgroundColor: '#F1F5F9',
  },
  badgeTextUpcoming: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  medsContainer: {
    paddingTop: 10,
  },
  medItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  medItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  medLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  medicineNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  dosePill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dosePillText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F1B33',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
