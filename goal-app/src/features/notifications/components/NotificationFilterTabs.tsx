/**
 * NotificationFilterTabs
 *
 * Scroll horizontal de chips de categoría.
 * El chip "Todas" siempre aparece primero.
 * Solo se muestran las categorías accesibles para el rol actual.
 */

import React, { memo } from 'react';
import { ScrollView, TouchableOpacity, Text } from 'react-native';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import type { NotificationCategory, NotificationFilter } from '../types/notifications.types';

const FILTER_LABELS: Record<NotificationFilter, string> = {
  all:      'Todas',
  matches:  'Partidos',
  results:  'Resultados',
  teams:    'Equipos',
  players:  'Jugadores',
  stats:    'Estadísticas',
  league:   'Liga',
  roles:    'Roles',
  events:   'Eventos',
  system:   'Sistema',
};

interface NotificationFilterTabsProps {
  available: NotificationCategory[];
  active: NotificationFilter;
  onChange: (filter: NotificationFilter) => void;
}

function NotificationFilterTabsComponent({
  available,
  active,
  onChange,
}: NotificationFilterTabsProps) {
  const filters: NotificationFilter[] = ['all', ...available];

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
      {filters.map(filter => {
        const isActive = filter === active;
        return (
          <TouchableOpacity
            key={filter}
            onPress={() => onChange(filter)}
            activeOpacity={0.8}
            style={{
              backgroundColor: isActive ? Colors.brand.primary : Colors.bg.surface1,
              borderRadius: theme.borderRadius.full,
              borderWidth: 1,
              borderColor: isActive ? Colors.brand.primary : Colors.bg.surface2,
              paddingHorizontal: theme.spacing.md,
              height: 34,
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: isActive ? '#000' : Colors.text.secondary,
                fontSize: theme.fontSize.sm,
                fontWeight: isActive ? '700' : '400',
              }}
            >
              {FILTER_LABELS[filter] ?? filter}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export const NotificationFilterTabs = memo(NotificationFilterTabsComponent);
