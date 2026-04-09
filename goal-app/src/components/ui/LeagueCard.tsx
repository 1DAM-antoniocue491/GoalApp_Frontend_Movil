/**
 * LeagueCard - Card principal para mostrar una liga en el listado
 *
 * Incluye:
 * - Badge de rol (Admin, Entrenador, etc.)
 * - Icono de favorito
 * - Escudo con fallback por defecto
 * - Nombre, temporada y estado
 * - Información de equipos
 * - Botón dinámico según estado/permisos
 */

import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LeagueItem, ROLE_LABELS, ROLE_COLORS } from '@/src/types/league';

interface LeagueCardProps {
  league: LeagueItem;
  onPress?: () => void;
  onToggleFavorite?: () => void;
}

/**
 * Escudo por defecto cuando la liga no tiene imagen
 */
const DEFAULT_SHIELD = require('../../../assets/images/logo.png');

export function LeagueCard({ league, onPress, onToggleFavorite }: LeagueCardProps) {
  const isFinished = league.status === 'finished';
  const isDisabled = isFinished && !league.canReactivate;

  // Determinar texto y acción del botón
  const getButtonConfig = () => {
    if (league.status === 'active') {
      return { text: 'Entrar', disabled: false };
    }
    if (league.canReactivate) {
      return { text: 'Reactivar liga', disabled: false };
    }
    return { text: 'Finalizada', disabled: true };
  };

  const buttonConfig = getButtonConfig();

  return (
    <View className="bg-[#1D1C22] rounded-3xl p-5 gap-4 border border-[#2A2A35]">
      {/* Parte superior: Badge de rol + Favorito */}
      <View className="flex-row justify-between items-start">
        {/* Badge del rol */}
        <View
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: `${ROLE_COLORS[league.role]}20` }}
        >
          <Text
            className="text-xs font-semibold"
            style={{ color: ROLE_COLORS[league.role] }}
          >
            {ROLE_LABELS[league.role]}
          </Text>
        </View>

        {/* Icono de favorito */}
        <TouchableOpacity onPress={onToggleFavorite} className="p-1">
          <Ionicons
            name={league.isFavorite ? 'star' : 'star-outline'}
            size={20}
            color={league.isFavorite ? '#FFD60A' : '#525258'}
          />
        </TouchableOpacity>
      </View>

      {/* Bloque central: Escudo + Info liga */}
      <View className="flex-row gap-4">
        {/* Escudo circular con fallback */}
        <View className="h-16 w-16 rounded-full bg-[#2A2A35] items-center justify-center border-2 border-white overflow-hidden">
          <Image
            source={
              league.crestUrl
                ? { uri: league.crestUrl }
                : DEFAULT_SHIELD
            }
            className="h-full w-full"
            resizeMode="cover"
          />
        </View>

        {/* Información de la liga */}
        <View className="flex-1 gap-1">
          <Text className="text-white font-semibold text-lg">{league.name}</Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-[#8A9AA4] text-sm">{league.season}</Text>
            <View className="flex-row items-center gap-1">
              <View
                className={`h-2 w-2 rounded-full ${
                  league.status === 'active' ? 'bg-[#32D74B]' : 'bg-[#FF4534]'
                }`}
              />
              <Text
                className={`text-xs ${
                  league.status === 'active' ? 'text-[#32D74B]' : 'text-[#FF4534]'
                }`}
              >
                {league.status === 'active' ? 'Activa' : 'Finalizada'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Información secundaria: Mi equipo + Equipos en la liga */}
      <View className="flex-row gap-4 border-t border-[#2A2A35] pt-4">
        {league.teamName && (
          <View className="flex-1 gap-1">
            <View className="flex-row items-center gap-1">
              <Ionicons name="shirt" size={14} color="#8A9AA4" />
              <Text className="text-[#8A9AA4] text-xs">Mi equipo</Text>
            </View>
            <Text className="text-white text-sm font-medium">{league.teamName}</Text>
          </View>
        )}
        <View className={`${league.teamName ? 'flex-1' : 'flex-1'} gap-1`}>
          <View className="flex-row items-center gap-1">
            <Ionicons name="people" size={14} color="#8A9AA4" />
            <Text className="text-[#8A9AA4] text-xs">Equipos</Text>
          </View>
          <Text className="text-white text-sm font-medium">{league.teamsCount}</Text>
        </View>
      </View>

      {/* Botón inferior principal */}
      <TouchableOpacity
        onPress={!buttonConfig.disabled ? onPress : undefined}
        disabled={buttonConfig.disabled}
        className={`
          flex-row items-center justify-between rounded-2xl py-3 px-4 mt-1
          ${buttonConfig.disabled ? 'bg-[#2A2A35]' : 'bg-[#C4F135]'}
        `}
      >
        <Text
          className={`text-base font-bold ${
            buttonConfig.disabled ? 'text-[#525258]' : 'text-black'
          }`}
        >
          {buttonConfig.text}
        </Text>
        {!buttonConfig.disabled && (
          <Ionicons name="arrow-forward" size={20} color="#000" />
        )}
      </TouchableOpacity>
    </View>
  );
}
