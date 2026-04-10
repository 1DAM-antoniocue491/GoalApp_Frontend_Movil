/**
 * FieldDelegateDashboard - Dashboard para usuarios con rol field_delegate
 */

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FieldDelegateDashboardProps {
  leagueName: string;
}

export function FieldDelegateDashboard({ leagueName }: FieldDelegateDashboardProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-[#8A9AA4] text-sm mt-1">
        Panel delegado de campo
      </Text>
    </View>
  );
}
