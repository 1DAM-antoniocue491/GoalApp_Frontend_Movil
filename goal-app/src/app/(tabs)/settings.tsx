import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '@/src/shared/styles';

/**
 * Pantalla de configuración
 * Placeholder - se implementará en features/profile/
 */
export default function SettingsScreen() {
  return (
    <View className={`flex-1 items-center justify-center ${styles.screenBase}`}>
      <Text className="text-white text-2xl font-bold">Configuración</Text>
      <Text className="text-[#8A9AA4] mt-2">Próximamente</Text>
    </View>
  );
}