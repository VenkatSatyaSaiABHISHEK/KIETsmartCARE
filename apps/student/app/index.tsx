import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import {
  PhoneCall,
  Clock,
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  HeartPulse,
} from 'lucide-react-native';
import { EMERGENCY_CONTACTS, MISSED_DOSE_ADVISORY } from '@kiet-smart-care/shared';

export default function StudentHomeScreen() {
  const [doseState, setDoseState] = useState<'pending' | 'taken' | 'late' | 'skipped'>('pending');

  const handleCallEmergency = () => {
    Alert.alert(
      'KIET Emergency Healthcare',
      `Direct Campus Emergency: ${EMERGENCY_CONTACTS.CAMPUS_HEALTH_CENTRE}\nNational Ambulance: ${EMERGENCY_CONTACTS.AMBULANCE}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Campus Clinic', onPress: () => console.log('Dialing campus clinic') },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>KIET GROUP OF INSTITUTIONS</Text>
          <Text style={styles.headerTitle}>Smart Care</Text>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>Offline Alarms Active</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Next Dose Card (Luxurious Black Card) */}
        <View style={styles.blackCard}>
          <View style={styles.cardHeader}>
            <View style={styles.timingBadge}>
              <Clock color="#ffffff" size={14} />
              <Text style={styles.timingBadgeText}>Lunch + 30 min (01:30 PM)</Text>
            </View>
            <Text style={styles.dayCounter}>Day 2 of 3</Text>
          </View>

          <Text style={styles.medicineName}>Amoxicillin 500mg</Text>
          <Text style={styles.medicineInstruction}>Take 1 capsule with water after lunch</Text>

          {doseState === 'pending' ? (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.takenButton]}
                onPress={() => setDoseState('taken')}
              >
                <CheckCircle color="#000000" size={16} />
                <Text style={styles.takenButtonText}>Taken</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.lateButton]}
                onPress={() => setDoseState('late')}
              >
                <Text style={styles.lateButtonText}>Taken Late</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.skipButton]}
                onPress={() => setDoseState('skipped')}
              >
                <Text style={styles.skipButtonText}>Not Taken</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.confirmedBox}>
              <Text style={styles.confirmedText}>
                Status recorded: {doseState.toUpperCase()}
              </Text>
            </View>
          )}

          {doseState === 'skipped' && (
            <View style={styles.advisoryBox}>
              <AlertCircle color="#ff8080" size={16} />
              <Text style={styles.advisoryText}>{MISSED_DOSE_ADVISORY}</Text>
            </View>
          )}
        </View>

        {/* Post-Course Recovery Check Preview Card */}
        <View style={styles.blackCard}>
          <View style={styles.cardHeader}>
            <View style={styles.timingBadge}>
              <HeartPulse color="#ffffff" size={14} />
              <Text style={styles.timingBadgeText}>End-of-Course Health Check</Text>
            </View>
          </View>
          <Text style={styles.medicineName}>Post-Course Recovery Inquiry</Text>
          <Text style={styles.medicineInstruction}>
            On the day after your course finishes, you will be asked: Better, Same, or Worse. Same, Worse, or side effects immediately alert your doctor and the Campus Health Officer.
          </Text>
        </View>
      </ScrollView>

      {/* Persistent Emergency Contact Button (Always Visible) */}
      <View style={styles.persistentBottomBar}>
        <TouchableOpacity style={styles.emergencyButton} onPress={handleCallEmergency}>
          <PhoneCall color="#ffffff" size={18} />
          <Text style={styles.emergencyButtonText}>Emergency Campus Medical Contact</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5e5',
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#666666',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#121212',
    letterSpacing: -0.5,
  },
  statusPill: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  statusPillText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
    gap: 18,
  },
  blackCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  timingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#222222',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  timingBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  dayCounter: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '500',
  },
  medicineName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  medicineInstruction: {
    fontSize: 14,
    color: '#a3a3a3',
    marginTop: 4,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  takenButton: {
    backgroundColor: '#ffffff',
  },
  takenButtonText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 13,
  },
  lateButton: {
    backgroundColor: '#1f1f1f',
    borderWidth: 1,
    borderColor: '#333333',
  },
  lateButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
  skipButton: {
    backgroundColor: '#1f1f1f',
    borderWidth: 1,
    borderColor: '#333333',
  },
  skipButtonText: {
    color: '#ff6b6b',
    fontWeight: '600',
    fontSize: 12,
  },
  confirmedBox: {
    marginTop: 18,
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmedText: {
    color: '#4ade80',
    fontSize: 13,
    fontWeight: '600',
  },
  advisoryBox: {
    marginTop: 14,
    padding: 12,
    backgroundColor: '#261214',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#5c1d24',
  },
  advisoryText: {
    color: '#fca5a5',
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  persistentBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e5e5',
  },
  emergencyButton: {
    backgroundColor: '#dc2626',
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emergencyButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.2,
  },
});
