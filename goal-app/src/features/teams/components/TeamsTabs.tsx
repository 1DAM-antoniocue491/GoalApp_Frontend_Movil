/**
 * TeamsTabs.tsx
 *
 * Tabs de navegación en el detalle de un equipo:
 * Información / Plantilla.
 *
 * Movida desde features/matches/components a su feature correcta.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';

/** Tabs Información / Plantilla del detalle de equipo — pendiente de implementar */
export function TeamsTabs() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <Ionicons name="construct-outline" size={36} color={Colors.text.disabled} />
      <Text style={{ color: Colors.text.disabled, fontSize: 14, marginTop: 12, textAlign: 'center' }}>
        Tabs de equipo disponibles próximamente
      </Text>
    </View>
  );
}
