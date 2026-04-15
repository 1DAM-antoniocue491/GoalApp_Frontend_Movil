/**
 * CoachDashboard - Dashboard para usuarios con rol coach (entrenador)
 */

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CoachDashboardProps {
  leagueName: string;
  teamName?: string;
}

export function CoachDashboard({ leagueName, teamName }: CoachDashboardProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-[#8A9AA4] text-sm mt-1">
        Panel del Entrenador
      </Text>
    </View>
  );
}
