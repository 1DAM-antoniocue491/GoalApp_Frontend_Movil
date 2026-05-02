import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';

/** Pantalla de estadísticas de la liga — pendiente de conectar con API */
export default function StatisticsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg.base, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <Ionicons name="bar-chart-outline" size={36} color={Colors.text.disabled} />
      <Text style={{ color: Colors.text.disabled, fontSize: 14, marginTop: 12, textAlign: 'center' }}>
        Estadísticas disponibles próximamente
      </Text>
    </View>
  );
}