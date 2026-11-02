import React, { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { EMERGENCY_CONTACTS } from '../constants/shared';

interface EmergencyModalProps {
  visible: boolean;
  onClose: () => void;
}

export function EmergencyModal({ visible, onClose }: EmergencyModalProps) {
  const [contacts, setContacts] = useState({
    clinic: { label: 'College Campus Clinic', phone: EMERGENCY_CONTACTS.CAMPUS_CLINIC, subtitle: 'KIET Central Health Centre' },
    officer: { label: 'Campus Health Officer', phone: EMERGENCY_CONTACTS.HEALTH_OFFICER, subtitle: 'Adherence & Health Surveillance' },
    doctor: { label: 'Campus OPD Doctor', phone: EMERGENCY_CONTACTS.OPD_DOCTOR, subtitle: 'Medical Consultations & Urgent Care' },
  });

  useEffect(() => {
    let isMounted = true;
    fetch('/api/clinic/emergency-contacts')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.contacts) {
          setContacts(data.contacts);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [visible]);

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
            <View>
              <Text style={styles.sheetTitle}>Campus Emergency Helpline</Text>
              <Text style={styles.sheetSub}>KIET Group of Institutions &bull; Ghaziabad</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>&times;</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.emergencyNotice}>
            Direct on-campus health emergency responders. Tap below to call directly:
          </Text>

          {/* Quick Tap-To-Call Emergency Buttons */}
          <View style={styles.actionsList}>
            <TouchableOpacity
              style={styles.callRow}
              onPress={() => handleCall(contacts.clinic.phone)}
              activeOpacity={0.8}
            >
              <View>
                <Text style={styles.callLabel}>{contacts.clinic.label}</Text>
                <Text style={styles.callPhone}>{contacts.clinic.phone}</Text>
                <Text style={styles.contactSubtitle}>{contacts.clinic.subtitle}</Text>
              </View>
              <Text style={styles.callActionText}>Call Clinic &rarr;</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.callRow}
              onPress={() => handleCall(contacts.officer.phone)}
              activeOpacity={0.8}
            >
              <View>
                <Text style={styles.callLabel}>{contacts.officer.label}</Text>
                <Text style={styles.callPhone}>{contacts.officer.phone}</Text>
                <Text style={styles.contactSubtitle}>{contacts.officer.subtitle}</Text>
              </View>
              <Text style={styles.callActionText}>Call Officer &rarr;</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.callRow}
              onPress={() => handleCall(contacts.doctor.phone)}
              activeOpacity={0.8}
            >
              <View>
                <Text style={styles.callLabel}>{contacts.doctor.label}</Text>
                <Text style={styles.callPhone}>{contacts.doctor.phone}</Text>
                <Text style={styles.contactSubtitle}>{contacts.doctor.subtitle}</Text>
              </View>
              <Text style={styles.callActionText}>Call Doctor &rarr;</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.dismissBtn}>
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#121212',
  },
  sheetSub: {
    fontSize: 12,
    color: '#555555',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontSize: 24,
    color: '#555555',
    lineHeight: 24,
  },
  emergencyNotice: {
    fontSize: 13,
    color: '#555555',
    lineHeight: 18,
    marginBottom: 20,
  },
  actionsList: {
    gap: 12,
  },
  callRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    backgroundColor: '#FAFAFA',
  },
  callLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121212',
  },
  callPhone: {
    fontSize: 12,
    color: '#121212',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
    marginTop: 2,
  },
  contactSubtitle: {
    fontSize: 11,
    color: '#737373',
    marginTop: 1,
  },
  callActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
  },
  dismissBtn: {
    marginTop: 20,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555555',
  },
});
