/**
 * LeagueCard - Tarjeta de liga para onboarding
 *
 * Muestra información de una liga con:
 * - Escudo/logo de la liga (o fallback con MaterialIcons)
 * - Nombre de la liga
 * - Temporada actual
 * - Rol del usuario (badge de color)
 * - Equipo asociado
 * - Estrella de favoritos interactiva
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { LeagueItem } from '@/src/types/league';
import { FavoriteStar } from './FavoriteStar';
import { ROLE_LABELS, ROLE_COLORS } from '@/src/types/league';

interface LeagueCardProps {
  /** Datos de la liga */
  league: LeagueItem;
  /** Estado de favorito */
  isFavorite: boolean;
  /** Callback al toggle de favorito */
  onToggleFavorite: () => void;
  /** Callback al presionar la tarjeta (navegación) */
  onPress?: () => void;
}

export function LeagueCard({
  league,
  isFavorite,
  onToggleFavorite,
  onPress,
}: LeagueCardProps) {
  const hasCrest = !!league.crestUrl;
  const roleColor = ROLE_COLORS[league.role];
  const roleLabel = ROLE_LABELS[league.role];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="bg-[#1D1C22] rounded-2xl p-4 flex-row items-center gap-4"
    >
      {/* Escudo de la liga (o fallback) */}
      <View
        className="w-16 h-16 rounded-xl items-center justify-center overflow-hidden"
        style={{ backgroundColor: hasCrest ? '#2A2A35' : roleColor }}
      >
        {hasCrest ? (
          <View className="w-full h-full bg-[#2A2A35] items-center justify-center">
            <Text className="text-white text-xs">Logo</Text>
          </View>
        ) : (
          <Ionicons name="shield" size={32} color="#FFFFFF" />
        )}
      </View>

      {/* Información de la liga */}
      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-white font-bold text-lg flex-1" numberOfLines={1}>
            {league.name}
          </Text>
          <FavoriteStar
            isFavorite={isFavorite}
            onPress={onToggleFavorite}
            size={20}
          />
        </View>

        {/* Badge de rol */}
        <View
          className="px-2 py-1 rounded-md self-start mb-1"
          style={{ backgroundColor: `${roleColor}20` }}
        >
          <Text
            className="text-xs font-semibold"
            style={{ color: roleColor }}
          >
            {roleLabel}
          </Text>
        </View>

        {/* Temporada y equipo */}
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <Ionicons name="calendar-outline" size={12} color="#8A9AA4" />
            <Text className="text-[#8A9AA4] text-xs">{league.season}</Text>
          </View>
          {league.teamName && (
            <>
              <View className="w-1 h-1 rounded-full bg-[#2A2A35]" />
              <View className="flex-row items-center gap-1">
                <Ionicons name="shirt-outline" size={12} color="#8A9AA4" />
                <Text className="text-[#8A9AA4] text-xs">{league.teamName}</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Flecha de navegación */}
      <Ionicons name="chevron-forward" size={20} color="#525258" />
    </TouchableOpacity>
  );
}
