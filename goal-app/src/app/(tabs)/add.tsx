import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '@/src/shared/styles';

/**
 * Pantalla de acción rápida (+)
 * Debería abrir un bottom sheet, no ser una tab real.
 * Placeholder hasta implementar el bottom sheet contextual.
 */
export default function AddScreen() {
  return (
    <View className={`flex-1 items-center justify-center ${styles.screenBase}`}>
      <View className="items-center gap-4">
        <View className="w-16 h-16 rounded-full bg-[#C4F135] items-center justify-center">
          <Ionicons name="add" size={32} color="#0F0F13" />
        </View>
        <Text className="text-white text-xl font-bold">Acción rápida</Text>
        <Text className="text-[#8A9AA4] text-center px-8">
          Crear liga, unirse a una liga, invitar usuario...
        </Text>
      </View>
    </View>
  );
}