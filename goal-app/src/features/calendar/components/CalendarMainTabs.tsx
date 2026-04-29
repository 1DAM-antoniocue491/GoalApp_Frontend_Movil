/**
 * CalendarMainTabs.tsx
 *
 * Tabs principales de la pantalla de calendario:
 * Jornada | Equipos | Clasificación
 *
 * En Fase 1 solo Jornada tiene contenido funcional.
 * Equipos y Clasificación muestran un placeholder.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';

import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import type { CalendarMainTab } from '../types/calendar.types';

interface CalendarMainTabsProps {
  activeTab: CalendarMainTab;
  onTabChange: (tab: CalendarMainTab) => void;
}

const TABS: { key: CalendarMainTab; label: string }[] = [
  { key: 'journey', label: 'Jornada' },
  { key: 'teams', label: 'Equipos' },
  { key: 'classification', label: 'Clasificación' },
];

export function CalendarMainTabs({ activeTab, onTabChange }: CalendarMainTabsProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: Colors.bg.base,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.bg.surface2,
      }}
    >
      {TABS.map(({ key, label }) => {
        const isActive = activeTab === key;
        return (
          <Pressable
            key={key}
            onPress={() => onTabChange(key)}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: theme.spacing.sm,
              // Indicador inferior activo con el brand color
              borderBottomWidth: 2,
              borderBottomColor: isActive ? Colors.brand.primary : 'transparent',
            }}
            android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={{
                fontSize: theme.fontSize.sm,
                fontWeight: isActive ? '700' : '400',
                color: isActive ? Colors.brand.primary : Colors.text.secondary,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
