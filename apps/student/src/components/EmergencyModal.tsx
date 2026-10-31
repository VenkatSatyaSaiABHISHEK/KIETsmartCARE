import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { PhoneCall, AlertTriangle, X, ShieldAlert, HeartPulse } from 'lucide-react-native';
import { EMERGENCY_CONTACTS } from '@kiet-smart-care/shared';

interface EmergencyModalProps {
  visible: boolean;
  onClose: () => void;
}

export function EmergencyModal({ visible, onClose }: EmergencyModalProps) {
  const handleCall = (phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/[\s-]/g, '');
    const url = Platform.OS === 'ios' ? `telprompt:${cleanNumber}` : `tel:${cleanNumber}`;
    Linking.openURL(url).catch((err) => console.warn('Call linking error:', err));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerTitleRow}>
              <View style={styles.alertIconBadge}>
                <ShieldAlert color="#ffffff" size={20} />
              </View>
              <div>
                <Text style={styles.sheetTitle}>Campus Emergency Helpline</Text>
                <Text style={styles.sheetSub}>KIET Group of Institutions, Korangi</Text>
              </div>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color="#666666" size={20} />
            </TouchableOpacity>
          </View>

          <Text style={styles.emergencyNotice}>
            For urgent acute symptoms, chest pain, breathlessness, or immediate assistance, tap below to contact campus medical staff immediately.
          </Text>

          {/* Quick Tap-To-Call Emergency Buttons */}
          <View style={styles.actionsList}>
            <TouchableOpacity
              style={[styles.callCard, styles.campusClinicCard]}
              onPress={() => handleCall(EMERGENCY_CONTACTS.CAMPUS_HEALTH_CENTRE)}
              activeOpacity={0.85}
            >
              <View style={styles.callIconBox}>
                <HeartPulse color="#ffffff" size={22} />
              </View>
              <View style={styles.callCardContent}>
                <Text style={styles.callCardTitle}>Campus Health Centre OPD</Text>
                <Text style={styles.callCardNumber}>{EMERGENCY_CONTACTS.CAMPUS_HEALTH_CENTRE}</Text>
                <Text style={styles.callCardTag}>24/7 Campus Medical Room</Text>
              </View>
              <PhoneCall color="#ffffff" size={18} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.callCard, styles.ambulanceCard]}
              onPress={() => handleCall(EMERGENCY_CONTACTS.AMBULANCE)}
              activeOpacity={0.85}
            >
              <View style={[styles.callIconBox, { backgroundColor: '#b91c1c' }]}>
                <AlertTriangle color="#ffffff" size={20} />
              </View>
              <View style={styles.callCardContent}>
                <Text style={styles.callCardTitle}>Emergency Ambulance</Text>
                <Text style={styles.callCardNumber}>Dial {EMERGENCY_CONTACTS.AMBULANCE}</Text>
                <Text style={styles.callCardTag}>Government Emergency Medical Service</Text>
              </View>
              <PhoneCall color="#ffffff" size={18} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alertIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0a0a0a',
    letterSpacing: -0.3,
  },
  sheetSub: {
    fontSize: 12,
    color: '#666666',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#f4f4f5',
  },
  emergencyNotice: {
    fontSize: 13,
    color: '#52525b',
    lineHeight: 18,
    marginBottom: 20,
  },
  actionsList: {
    gap: 12,
    marginBottom: 20,
  },
  callCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  campusClinicCard: {
    backgroundColor: '#1d4ed8',
  },
  ambulanceCard: {
    backgroundColor: '#dc2626',
  },
  callIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  callCardContent: {
    flex: 1,
  },
  callCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  callCardNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 2,
  },
  callCardTag: {
    fontSize: 10,
    color: '#ffffff',
    opacity: 0.75,
    marginTop: 2,
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a0a0a',
  },
});
