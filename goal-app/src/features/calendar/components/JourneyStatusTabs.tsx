/**
 * JourneyStatusTabs.tsx
 *
 * Filtros tipo píldora dentro de una jornada:
 * En vivo | Programados | Finalizados
 *
 * Cada píldora muestra el badge de conteo si tiene partidos.
 * Si el estado tiene 0 partidos, la píldora aparece atenuada (no se oculta
 * porque el usuario debe poder ver que ese estado existe pero está vacío).
 */

import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';

import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import type { JourneyStatusFilter } from '../types/calendar.types';

interface JourneyStatusTabsProps {
  activeFilter: JourneyStatusFilter;
  counts: Record<JourneyStatusFilter, number>;
  onFilterChange: (filter: JourneyStatusFilter) => void;
}

const FILTERS: { key: JourneyStatusFilter; label: string }[] = [
  { key: 'live', label: 'En vivo' },
  { key: 'programmed', label: 'Programados' },
  { key: 'finished', label: 'Finalizados' },
];

export function JourneyStatusTabs({ activeFilter, counts, onFilterChange }: JourneyStatusTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
      }}
    >
      {FILTERS.map(({ key, label }) => {
        const isActive = activeFilter === key;
        const count = counts[key];
        const isEmpty = count === 0;

        return (
          <Pressable
            key={key}
            onPress={() => onFilterChange(key)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: theme.borderRadius.full,
              backgroundColor: isActive ? Colors.brand.primary : Colors.bg.surface1,
              borderWidth: 1,
              borderColor: isActive ? 'transparent' : Colors.bg.surface2,
              // Atenuar si no hay partidos en este estado (no ocultar)
              opacity: isEmpty && !isActive ? 0.45 : 1,
            }}
          >
            {/* Punto pulsante para "En vivo" cuando hay partidos activos */}
            {key === 'live' && count > 0 && (
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  // En activo: oscuro para contrastar con el brand color amarillo
                  backgroundColor: isActive ? Colors.bg.base : Colors.semantic.success,
                }}
              />
            )}

            <Text
              style={{
                fontSize: theme.fontSize.xs,
                fontWeight: isActive ? '700' : '500',
                color: isActive ? Colors.bg.base : Colors.text.secondary,
              }}
            >
              {label}
            </Text>

            {/* Badge de conteo — solo si hay partidos */}
            {count > -1 && (
              <View
                style={{
                  backgroundColor: isActive
                    ? 'rgba(15,15,19,0.2)' // oscuro semitransparente sobre brand
                    : Colors.bg.surface2,
                  borderRadius: theme.borderRadius.full,
                  minWidth: 18,
                  height: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '700',
                    color: isActive ? Colors.bg.base : Colors.text.secondary,
                  }}
                >
                  {count}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
