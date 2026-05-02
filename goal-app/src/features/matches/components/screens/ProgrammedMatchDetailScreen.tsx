/**
 * ProgrammedMatchDetailScreen
 * Vista detallada de un partido programado.
 * Muestra datos del encuentro y tabs de enfrentamientos previos/plantilla.
 * TODO: conectar con datos reales cuando la API esté disponible.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';

/** Detalle de partido programado: datos del encuentro y tabs previos/plantilla */
export function ProgrammedMatchDetailScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <Ionicons name="calendar-outline" size={36} color={Colors.text.disabled} />
      <Text style={{ color: Colors.text.disabled, fontSize: 14, marginTop: 12, textAlign: 'center' }}>
        Detalle del partido disponible próximamente
      </Text>
    </View>
  );
}
