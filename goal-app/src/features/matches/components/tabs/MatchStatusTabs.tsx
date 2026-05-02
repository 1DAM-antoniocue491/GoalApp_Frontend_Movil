/**
 * MatchStatusTabs.tsx
 *
 * Tabs de navegación entre estados de partido: Directo / Programados / Finalizados.
 * Usada por MatchesHubScreen para cambiar la vista activa del hub.
 *
 * Renombrada desde MatchesTabs para reflejar su propósito real.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';

/** Tabs Directo / Programados / Finalizados del hub de partidos */
export function MatchStatusTabs() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <Ionicons name="construct-outline" size={36} color={Colors.text.disabled} />
      <Text style={{ color: Colors.text.disabled, fontSize: 14, marginTop: 12, textAlign: 'center' }}>
        Tabs de partidos disponibles próximamente
      </Text>
    </View>
  );
}
