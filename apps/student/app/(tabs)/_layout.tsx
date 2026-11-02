import React, { useState } from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { Home, Pill, Clock, User } from 'lucide-react-native';
import { EmergencyModal } from '../../src/components/EmergencyModal';

export default function TabsLayout() {
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#ffffff',
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: '#EBEBEB',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTitleStyle: {
            fontSize: 16,
            fontWeight: '600',
            color: '#121212',
          },
          headerRight: () => (
            <TouchableOpacity
              style={styles.emergencyBtn}
              onPress={() => setEmergencyModalOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.emergencyBtnText}>Emergency</Text>
            </TouchableOpacity>
          ),
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            height: Platform.OS === 'ios' ? 84 : 64,
            paddingBottom: Platform.OS === 'ios' ? 24 : 10,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#0F1B33',
          tabBarInactiveTintColor: '#64748B',
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'KIET Smart Care',
            tabBarLabel: 'Home',
            tabBarIcon: ({ color }) => <Home size={22} color={color} strokeWidth={2} />,
          }}
        />

        <Tabs.Screen
          name="medicines"
          options={{
            title: 'Prescriptions',
            tabBarLabel: 'Medicines',
            tabBarIcon: ({ color }) => <Pill size={22} color={color} strokeWidth={2} />,
          }}
        />

        <Tabs.Screen
          name="history"
          options={{
            title: 'Visit History',
            tabBarLabel: 'History',
            tabBarIcon: ({ color }) => <Clock size={22} color={color} strokeWidth={2} />,
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: 'Student Profile',
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color }) => <User size={22} color={color} strokeWidth={2} />,
          }}
        />
      </Tabs>

      <EmergencyModal
        visible={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  emergencyBtn: {
    marginRight: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#991B1B',
  },
  emergencyBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});
