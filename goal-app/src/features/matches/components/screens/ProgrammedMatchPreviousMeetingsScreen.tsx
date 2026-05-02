/**
 * ProgrammedMatchPreviousMeetingsScreen
 * Historial de enfrentamientos previos entre los equipos de un partido programado.
 * TODO: conectar con datos reales cuando la API esté disponible.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';

/** Historial de enfrentamientos previos entre los dos equipos */
export function ProgrammedMatchPreviousMeetingsScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <Ionicons name="time-outline" size={36} color={Colors.text.disabled} />
      <Text style={{ color: Colors.text.disabled, fontSize: 14, marginTop: 12, textAlign: 'center' }}>
        Encuentros anteriores disponibles próximamente
      </Text>
    </View>
  );
}
