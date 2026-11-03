import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Platform } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

export function SkeletonItem({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 750,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor: '#E2E8F0',
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
}

export function HomeSkeletonLoader() {
  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <SkeletonItem width={160} height={26} borderRadius={6} />
        <SkeletonItem width={120} height={14} borderRadius={4} style={{ marginTop: 6 }} />
      </View>

      {/* Hero Card Skeleton */}
      <View style={styles.heroCard}>
        <View style={styles.rowBetween}>
          <SkeletonItem width={140} height={14} borderRadius={4} />
          <SkeletonItem width={90} height={18} borderRadius={8} />
        </View>
        <SkeletonItem width={200} height={24} borderRadius={6} style={{ marginTop: 12 }} />
        <View style={styles.innerBox}>
          <SkeletonItem width="100%" height={36} borderRadius={8} />
        </View>
        <View style={styles.buttonRow}>
          <SkeletonItem width="32%" height={44} borderRadius={12} />
          <SkeletonItem width="32%" height={44} borderRadius={12} />
          <SkeletonItem width="32%" height={44} borderRadius={12} />
        </View>
      </View>

      {/* Schedule Group Skeletons */}
      <View style={styles.scheduleSection}>
        <SkeletonItem width={130} height={14} borderRadius={4} style={{ marginBottom: 14 }} />
        <View style={styles.groupCard}>
          <SkeletonItem width={120} height={18} borderRadius={6} />
          <SkeletonItem width="100%" height={28} borderRadius={8} style={{ marginTop: 10 }} />
        </View>
        <View style={[styles.groupCard, { marginTop: 10 }]}>
          <SkeletonItem width={120} height={18} borderRadius={6} />
          <SkeletonItem width="100%" height={28} borderRadius={8} style={{ marginTop: 10 }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    marginBottom: 20,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  innerBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginVertical: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scheduleSection: {
    marginTop: 8,
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});

