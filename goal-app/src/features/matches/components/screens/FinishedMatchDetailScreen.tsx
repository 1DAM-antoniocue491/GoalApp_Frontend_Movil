/**
 * FinishedMatchDetailScreen.tsx
 *
 * Vista detallada de un partido finalizado (o en vivo con mismo layout).
 * Muestra marcador, eventos y tabs de estadísticas/alineación.
 *
 * Renombrada desde FinishedMatchLiveScreen para eliminar la ambigüedad
 * del término "Live" en una pantalla que sirve tanto a finished como a live.
 *
 * TODO: conectar con datos reales cuando la API esté disponible.
 * TODO: diferenciar layout live vs finished si divergen en el futuro.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';

/** Detalle de partido finalizado: marcador, eventos y tabs estadísticas/alineación */
export function FinishedMatchDetailScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <Ionicons name="trophy-outline" size={36} color={Colors.text.disabled} />
      <Text style={{ color: Colors.text.disabled, fontSize: 14, marginTop: 12, textAlign: 'center' }}>
        Detalle del partido disponible próximamente
      </Text>
    </View>
  );
}
