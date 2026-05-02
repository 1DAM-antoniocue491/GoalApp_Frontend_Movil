/**
 * TeamCard.tsx
 *
 * Card premium para mostrar un equipo en la lista de equipos.
 * Muestra escudo (fallback letra), nombre, color de equipo y stats básicas.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/src/shared/constants/colors';
import type { EquipoResponse } from '../types/teams.types';

interface TeamCardProps {
  team: EquipoResponse;
  onPress: (teamId: number) => void;
}

export function TeamCard({ team, onPress }: TeamCardProps) {
  const initial = team.nombre.charAt(0).toUpperCase();
  // Color del equipo o fallback brand
  const teamColor = team.color_primario ?? Colors.brand.primary;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(team.id_equipo)}
      activeOpacity={0.75}
    >
      {/* Escudo / inicial */}
      <View style={[styles.shield, { borderColor: teamColor }]}>
        <Text style={[styles.shieldLetter, { color: teamColor }]}>{initial}</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{team.nombre}</Text>
        {/* Indicador de estado activo */}
        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: team.activo !== false ? Colors.semantic.success : Colors.text.disabled }]} />
          <Text style={styles.statusText}>{team.activo !== false ? 'Activo' : 'Inactivo'}</Text>
        </View>
      </View>

      {/* Acento lateral del color del equipo */}
      <View style={[styles.accent, { backgroundColor: teamColor }]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.surface1,
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    gap: 12,
    // Sombra sutil — se usa style porque NativeWind no cubre elevación en Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  shield: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg.surface2,
  },
  shieldLetter: {
    fontSize: 18,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: Colors.text.primary,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    color: Colors.text.secondary,
    fontSize: 12,
  },
  // Barra de color del equipo en el borde derecho
  accent: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },
});
