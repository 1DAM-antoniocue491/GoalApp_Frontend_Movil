/**
 * FinishedMatchStatisticsScreen
 * Estadísticas de un partido finalizado (tarjetas, eventos, etc.).
 * TODO: conectar con datos reales cuando la API esté disponible.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';

/** Estadísticas del partido finalizado: tarjetas, eventos, etc. */
export function FinishedMatchStatisticsScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <Ionicons name="stats-chart-outline" size={36} color={Colors.text.disabled} />
      <Text style={{ color: Colors.text.disabled, fontSize: 14, marginTop: 12, textAlign: 'center' }}>
        Estadísticas del partido disponibles próximamente
      </Text>
    </View>
  );
}
