import React from 'react';
import { View, Text } from 'react-native';
import { Link } from 'expo-router';
import { styles } from '@/src/shared/styles';

/**
 * Pantalla 404 - Ruta no encontrada
 */
export default function NotFoundScreen() {
  return (
    <View className={`flex-1 items-center justify-center ${styles.screenBase}`}>
      <Text className="text-white text-2xl font-bold mb-4">
        Pantalla no encontrada
      </Text>
      <Link href="/" className="text-[#C4F135] text-lg">
        Volver al inicio
      </Link>
    </View>
  );
}