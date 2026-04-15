/**
 * TeamBadge - Badge de equipo con fallback a MaterialIcons
 *
 * Muestra el escudo del equipo si existe, o un ícono de escudo
 * de MaterialIcons como fallback cuando no hay logo disponible.
 *
 * @example
 * <TeamBadge team={realMadrid} size={40} />
 * <TeamBadge team={alaves} size={40} /> { mostrará ícono shield }
 */

import React from 'react';
import { View, Image, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Team } from '@/src/shared/types/team';

interface TeamBadgeProps {
  /** Datos del equipo */
  team: Team;
  /** Tamaño del badge (default: 40) */
  size?: number;
  /** Estilos adicionales */
  style?: ViewStyle;
}

export function TeamBadge({ team, size = 40, style }: TeamBadgeProps) {
  const hasLogo = !!team.logo;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: team.primaryColor || '#2A2A35',
        },
        style,
      ]}
      className="items-center justify-center overflow-hidden border-2 border-[#2A2A35]"
    >
      {hasLogo ? (
        <Image
          source={{ uri: team.logo }}
          style={{ width: size * 0.8, height: size * 0.8 }}
          resizeMode="contain"
        />
      ) : (
        // Fallback: MaterialIcons shield cuando no hay escudo
        <Ionicons
          name="shield"
          size={size * 0.6}
          color={team.secondaryColor || '#FFFFFF'}
        />
      )}
    </View>
  );
}
