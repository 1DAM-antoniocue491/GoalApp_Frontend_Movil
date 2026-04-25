import React, { useMemo, memo } from 'react';
import { Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LeagueFilter } from '@/src/shared/types/league';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';

interface LeagueFilterTabsProps {
  selectedFilter: LeagueFilter;
  onSelectFilter: (filter: LeagueFilter) => void;
}

const FILTERS: {
  key: LeagueFilter;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
    { key: 'all', label: 'Todas', icon: 'grid-outline' },
    { key: 'active', label: 'Activas', icon: 'time-outline' },
    { key: 'finished', label: 'Finalizadas', icon: 'flag-outline' },
    { key: 'favorites', label: 'Favoritas', icon: 'star-outline' },
  ];

function LeagueFilterTabsComponent({
  selectedFilter,
  onSelectFilter,
}: LeagueFilterTabsProps) {
  const filters = useMemo(() => FILTERS, []);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
    >
      {filters.map(({ key, label, icon }) => {
        const isActive = selectedFilter === key;

        return (
          <TouchableOpacity
            key={key}
            onPress={() => onSelectFilter(key)}
            activeOpacity={0.9}
            className="px-3 h-12 rounded-full border flex-row items-center"
            style={{
              backgroundColor: isActive ? Colors.brand.primary : Colors.bg.surface1,
              borderColor: isActive ? Colors.brand.primary : Colors.bg.surface2,
              shadowColor: isActive ? Colors.brand.primary : 'transparent',
              shadowOpacity: isActive ? 0.16 : 0,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 5 },
              elevation: isActive ? 2 : 0,
            }}
          >
            <Ionicons
              name={icon}
              size={14}
              color={isActive ? Colors.bg.base : Colors.text.secondary}
              style={{ marginRight: theme.spacing.sm }}
            />

            <Text
              style={{
                color: isActive ? Colors.bg.base : Colors.text.secondary,
                fontSize: theme.fontSize.sm - 1,
                lineHeight: 12,
                fontWeight: isActive ? '600' : '500',
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

export const LeagueFilterTabs = memo(LeagueFilterTabsComponent);