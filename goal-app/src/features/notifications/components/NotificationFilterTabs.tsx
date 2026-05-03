/**
 * NotificationFilterTabs
 *
 * Scroll horizontal de chips de categoría.
 * Muestra siempre los 5 filtros definidos: Todas, En vivo, Resultados, Equipos, Estadísticas.
 */

import React, { memo } from 'react';
import { ScrollView, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import type { NotificationFilter } from '../types/notifications.types';

const FILTERS: { value: NotificationFilter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'all',     label: 'Todas',         icon: 'grid-outline' },
  { value: 'live',    label: 'En vivo',        icon: 'radio-outline' },
  { value: 'results', label: 'Resultados',     icon: 'trophy-outline' },
  { value: 'teams',   label: 'Equipos',        icon: 'people-outline' },
  { value: 'stats',   label: 'Estadísticas',   icon: 'stats-chart-outline' },
];

interface NotificationFilterTabsProps {
  active: NotificationFilter;
  onChange: (filter: NotificationFilter) => void;
}

function NotificationFilterTabsComponent({ active, onChange }: NotificationFilterTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: theme.spacing.xl,
        gap: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
      }}
    >
      {FILTERS.map(({ value, label, icon }) => {
        const isActive = value === active;
        return (
          <TouchableOpacity
            key={value}
            onPress={() => onChange(value)}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: isActive ? Colors.brand.primary : Colors.bg.surface1,
              borderRadius: theme.borderRadius.full,
              borderWidth: 1,
              borderColor: isActive ? Colors.brand.primary : Colors.bg.surface2,
              paddingHorizontal: theme.spacing.md,
              height: 34,
            }}
          >
            <Ionicons
              name={icon}
              size={13}
              color={isActive ? '#000' : Colors.text.secondary}
            />
            <Text
              style={{
                color: isActive ? '#000' : Colors.text.secondary,
                fontSize: theme.fontSize.sm,
                fontWeight: isActive ? '700' : '400',
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export const NotificationFilterTabs = memo(NotificationFilterTabsComponent);
