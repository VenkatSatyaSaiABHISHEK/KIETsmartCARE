import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Sun, Sunset, Moon } from 'lucide-react-native';
import { DoseScheduleRecord } from '../types/student';
import { formatTime12h } from '../constants/shared';

interface TodayTimelineProps {
  doses: DoseScheduleRecord[];
  onAnswerDose?: (doseId: string, status: 'taken' | 'taken_late' | 'not_taken') => void;
}

export function TodayTimeline({ doses }: TodayTimelineProps) {
  if (!doses || doses.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No doses scheduled for today.</Text>
      </View>
    );
  }

  // Current time in Asia/Kolkata (HH:MM)
  const now = new Date();
  const istMinutes = (now.getUTCHours() * 60 + now.getUTCMinutes() + 330) % 1440; // IST offset +5:30

  return (
    <View style={styles.container}>
      {doses.map((d, index) => {
        // 1. Map to strictly 3 slots: Morning, Afternoon, Night (no Evening)
        const rawSlot = (d.slot || d.meal_slot || 'morning').toLowerCase();
        let slotName: 'Morning' | 'Afternoon' | 'Night' = 'Morning';
        if (rawSlot.includes('lunch') || rawSlot.includes('afternoon') || rawSlot.includes('evening') || rawSlot.includes('tea')) {
          // If raw slot is late evening (e.g. 7pm+), map to Night, otherwise Afternoon
          const timeStr = d.scheduled_at || d.time || d.scheduled_time || '13:00';
          const hourMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
          const hour = hourMatch ? parseInt(hourMatch[1], 10) : 13;
          slotName = hour >= 19 ? 'Night' : 'Afternoon';
        } else if (rawSlot.includes('night') || rawSlot.includes('dinner')) {
          slotName = 'Night';
        } else {
          slotName = 'Morning';
        }

        // 2. Scheduled time display (12-hour AM/PM)
        const rawTime = d.scheduled_at || d.time || d.scheduled_time || '08:00';
        const displayTime = formatTime12h(rawTime);

        // 3. Check if scheduled time has passed
        let isPastTime = false;
        const timeMatch = rawTime.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          const doseMinutes = parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2], 10);
          // If past scheduled time by 15+ minutes
          if (istMinutes > doseMinutes + 15) {
            isPastTime = true;
          }
        }

        // 4. Status determination (Auto-missed if elapsed without confirmation)
        let effectiveStatus = d.status;
        if (effectiveStatus !== 'taken' && effectiveStatus !== 'taken_late') {
          if (isPastTime || effectiveStatus === 'not_taken') {
            effectiveStatus = 'not_taken';
          }
        }

        const isTaken = effectiveStatus === 'taken';
        const isLate = effectiveStatus === 'taken_late';
        const isMissed = effectiveStatus === 'not_taken';

        const statusLabel = isTaken
          ? 'Taken'
          : isLate
          ? 'Taken Late'
          : isMissed
          ? 'Missed'
          : 'Upcoming';

        const statusColor = isTaken
          ? '#166534' // Forest green
          : isLate
          ? '#854D0E' // Amber
          : isMissed
          ? '#991B1B' // Red
          : '#6B7280'; // Neutral grey

        const mealRelation = d.meal_relation === 'before' ? 'Before food' : 'After food';
        const doseText = d.tablets
          ? `${d.tablets} tablet${d.tablets > 1 ? 's' : ''}`
          : d.dose || '1 tablet';

        return (
          <View key={d.id || `dose-${index}`} style={styles.row}>
            {/* Left: Icon + Time + Slot */}
            <View style={styles.timeCol}>
              <View style={styles.iconCircle}>
                {slotName === 'Morning' && <Sun size={15} color="#D97706" />}
                {slotName === 'Afternoon' && <Sunset size={15} color="#0284C7" />}
                {slotName === 'Night' && <Moon size={15} color="#4F46E5" />}
              </View>
              <View>
                <Text style={styles.timeText}>{displayTime}</Text>
                <Text style={styles.slotText}>
                  {slotName} &bull; {mealRelation}
                </Text>
              </View>
            </View>

            {/* Middle: Medicine Name & Tablets */}
            <View style={styles.medCol}>
              <Text style={styles.medName} numberOfLines={1}>
                {d.medicine_name || 'Prescribed Medicine'}
              </Text>
              <Text style={styles.doseSubtext}>{doseText}</Text>
            </View>

            {/* Right: Status text */}
            <View style={styles.statusCol}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusLabel}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    minHeight: 48,
  },
  timeCol: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
    gap: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F1B33',
    fontVariant: ['tabular-nums'],
  },
  slotText: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 1,
  },
  medCol: {
    flex: 1,
    paddingHorizontal: 8,
  },
  medName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F1B33',
  },
  doseSubtext: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  statusCol: {
    alignItems: 'flex-end',
    minWidth: 64,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#6B7280',
  },
});
