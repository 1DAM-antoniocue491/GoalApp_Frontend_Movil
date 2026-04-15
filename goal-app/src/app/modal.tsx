import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '@/src/shared/styles';

/**
 * Pantalla modal genérica
 * Los modales específicos se implementarán en features/
 */
export default function ModalScreen() {
  return (
    <View className={`flex-1 items-center justify-center ${styles.screenBase}`}>
      <Text className="text-white text-lg">Modal</Text>
    </View>
  );
}