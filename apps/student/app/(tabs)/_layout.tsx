import React, { useState } from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { Home, Pill, History, User, PhoneCall } from 'lucide-react-native';
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
            borderBottomColor: '#e4e4e7',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '800',
            color: '#0a0a0a',
            letterSpacing: -0.4,
          },
          headerRight: () => (
            <TouchableOpacity
              style={styles.emergencyHeaderBtn}
              onPress={() => setEmergencyModalOpen(true)}
              activeOpacity={0.8}
            >
              <PhoneCall color="#ffffff" size={14} />
              <Text style={styles.emergencyHeaderBtnText}>SOS Emergency</Text>
            </TouchableOpacity>
          ),
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: '#e4e4e7',
            height: Platform.OS === 'ios' ? 84 : 64,
            paddingBottom: Platform.OS === 'ios' ? 24 : 10,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#0a0a0a',
          tabBarInactiveTintColor: '#a1a1aa',
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Smart Care',
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, size }) => <Home color={color} size={size - 2} />,
          }}
        />

        <Tabs.Screen
          name="medicines"
          options={{
            title: 'My Prescriptions',
            tabBarLabel: 'Medicines',
            tabBarIcon: ({ color, size }) => <Pill color={color} size={size - 2} />,
          }}
        />

        <Tabs.Screen
          name="history"
          options={{
            title: 'Clinical History',
            tabBarLabel: 'History',
            tabBarIcon: ({ color, size }) => <History color={color} size={size - 2} />,
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: 'My Health Profile',
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color, size }) => <User color={color} size={size - 2} />,
          }}
        />
      </Tabs>

      {/* Emergency Contact Modal Triggered from Header */}
      <EmergencyModal
        visible={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  emergencyHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 16,
    gap: 6,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  emergencyHeaderBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
