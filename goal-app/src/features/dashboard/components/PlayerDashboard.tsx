/**
 * PlayerDashboard - Dashboard para usuarios con rol player (jugador)
 */

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PlayerDashboardProps {
  leagueName: string;
  teamName?: string;
  playerName?: string;
}

export function PlayerDashboard({ leagueName, teamName, playerName }: PlayerDashboardProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-[#8A9AA4] text-sm mt-1">
        Panel del Jugador
      </Text>
    </View>
  );
}
