/**
 * AdminDashboard - Dashboard para usuarios con rol admin
 */

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface AdminDashboardProps {
  leagueName: string;
}

export function AdminDashboard({ leagueName }: AdminDashboardProps) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView className='flex-1'>
      <View className="flex-1 items-center justify-center">
        <Text className="text-[#8A9AA4] text-sm mt-1">
          Panel del administración
        </Text>
      </View>
    </SafeAreaView>
  );
}
