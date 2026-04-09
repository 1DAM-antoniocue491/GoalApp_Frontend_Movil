/**
 * LeaguesSkeleton - Placeholder de carga para la sección de ligas
 *
 * Muestra skeletons elegantes mientras se cargan los datos
 * de las ligas desde la API.
 */

import React from 'react';
import { View, Animated } from 'react-native';

/**
 * Skeleton de una card de liga individual
 */
function LeagueCardSkeleton() {
  return (
    <View className="bg-[#1D1C22] rounded-3xl p-5 gap-4 border border-[#2A2A35]">
      {/* Parte superior: Badge + Favorito */}
      <View className="flex-row justify-between items-start">
        <View className="h-6 w-20 bg-[#2A2A35] rounded-full" />
        <View className="h-5 w-5 bg-[#2A2A35] rounded-full" />
      </View>

      {/* Bloque central: Escudo + Info */}
      <View className="flex-row gap-4">
        {/* Escudo */}
        <View className="h-16 w-16 rounded-full bg-[#2A2A35]" />

        {/* Textos */}
        <View className="flex-1 gap-2">
          <View className="h-5 w-3/4 bg-[#2A2A35] rounded" />
          <View className="h-4 w-1/2 bg-[#2A2A35] rounded" />
        </View>
      </View>

      {/* Información secundaria */}
      <View className="flex-row gap-4 border-t border-[#2A2A35] pt-4">
        <View className="flex-1 gap-2">
          <View className="h-3 w-16 bg-[#2A2A35] rounded" />
          <View className="h-4 w-24 bg-[#2A2A35] rounded" />
        </View>
        <View className="flex-1 gap-2">
          <View className="h-3 w-16 bg-[#2A2A35] rounded" />
          <View className="h-4 w-8 bg-[#2A2A35] rounded" />
        </View>
      </View>

      {/* Botón */}
      <View className="h-12 bg-[#2A2A35] rounded-2xl" />
    </View>
  );
}

interface LeaguesSkeletonProps {
  /** Número de skeletons a mostrar (default: 2) */
  count?: number;
}

export function LeaguesSkeleton({ count = 2 }: LeaguesSkeletonProps) {
  return (
    <View className="gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <LeagueCardSkeleton key={index} />
      ))}
    </View>
  );
}
