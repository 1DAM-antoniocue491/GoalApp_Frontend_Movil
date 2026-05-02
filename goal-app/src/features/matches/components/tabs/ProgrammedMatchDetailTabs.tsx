/**
 * ProgrammedMatchDetailTabs.tsx
 *
 * Tabs internas del detalle de un partido programado:
 * Encuentros anteriores / Convocatoria.
 * Usada por ProgrammedMatchDetailScreen.
 *
 * Renombrada desde MatchesProgrammed para reflejar su propósito real.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';

/** Tabs Encuentros anteriores / Convocatoria del detalle de partido programado */
export function ProgrammedMatchDetailTabs() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <Ionicons name="construct-outline" size={36} color={Colors.text.disabled} />
      <Text style={{ color: Colors.text.disabled, fontSize: 14, marginTop: 12, textAlign: 'center' }}>
        Tabs del partido disponibles próximamente
      </Text>
    </View>
  );
}
