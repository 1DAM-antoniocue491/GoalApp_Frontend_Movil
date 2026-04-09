/**
 * LeagueFilterTabs - Chips horizontales para filtrar ligas
 *
 * Permite filtrar por: Todas, Activas, Finalizadas, Favoritas
 * con diseño de pills que se pueden desplazar horizontalmente.
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { LeagueFilter } from '@/src/types/league';

interface LeagueFilterTabsProps {
  /** Filtro actualmente seleccionado */
  selectedFilter: LeagueFilter;
  /** Callback cuando se selecciona un filtro */
  onSelectFilter: (filter: LeagueFilter) => void;
}

/**
 * Configuración de cada filtro
 */
const FILTERS: { key: LeagueFilter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'active', label: 'Activas' },
  { key: 'finished', label: 'Finalizadas' },
  { key: 'favorites', label: 'Favoritas' },
];

export function LeagueFilterTabs({ selectedFilter, onSelectFilter }: LeagueFilterTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mb-4"
      contentContainerStyle={{ gap: 8 }}
    >
      {FILTERS.map(({ key, label }) => {
        const isActive = selectedFilter === key;

        return (
          <TouchableOpacity
            key={key}
            onPress={() => onSelectFilter(key)}
            className={`
              px-4 py-2 rounded-full border
              ${isActive ? 'bg-[#C4F135] border-[#C4F135]' : 'bg-[#1D1C22] border-[#2A2A35]'}
            `}
          >
            <Text
              className={`text-sm font-medium ${isActive ? 'text-black font-semibold' : 'text-[#8A9AA4]'}`}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
