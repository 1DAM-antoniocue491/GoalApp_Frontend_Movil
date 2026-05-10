/**
 * UpcomingMatchesSection.tsx
 * Lista de próximos partidos del dashboard usando la misma ProgrammedMatchCard
 * que calendario/partidos programados.
 */

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { routes } from '@/src/shared/config/routes';
import type { UpcomingMatchData } from '@/src/shared/types/dashboard.types';
import type { DashboardPermissions } from '../services/dashboardService';
import { ProgrammedMatchCard } from '@/src/features/matches/components/cards/ProgrammedMatchCard';
import { Colors } from '@/src/shared/constants/colors';

interface UpcomingMatchesSectionProps {
  matches: UpcomingMatchData[];
  permissions: DashboardPermissions;
  onStartMatch?: (matchId: string) => void;
  onEditMatch?: (matchId: string) => void;
  actionsDisabled?: boolean;
}

const MONTH_MAP: Record<string, number> = { ENE: 0, FEB: 1, MAR: 2, ABR: 3, MAY: 4, JUN: 5, JUL: 6, AGO: 7, SEP: 8, OCT: 9, NOV: 10, DIC: 11 };
function getMatchSortValue(match: UpcomingMatchData): number {
  const month = MONTH_MAP[String(match.month ?? '').toUpperCase()];
  const day = Number(match.day);
  const [hour, minute] = String(match.time ?? '').split(':').map(Number);
  if (month == null || !Number.isFinite(day) || !Number.isFinite(hour) || !Number.isFinite(minute)) return Number.POSITIVE_INFINITY;
  const now = new Date();
  const date = new Date(now.getFullYear(), month, day, hour, minute, 0, 0);
  if (date.getTime() < now.getTime() - 24 * 60 * 60 * 1000) date.setFullYear(now.getFullYear() + 1);
  return date.getTime();
}

export function UpcomingMatchesSection({
  matches,
  permissions,
  onStartMatch,
  onEditMatch,
  actionsDisabled = false,
}: UpcomingMatchesSectionProps) {
  const router = useRouter();
  const sortedMatches = useMemo(() => [...matches].sort((a, b) => getMatchSortValue(a) - getMatchSortValue(b)), [matches]);

  if (sortedMatches.length === 0) {
    return (
      <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
        <Text style={{ color: Colors.text.primary, fontSize: 18, fontWeight: '600', marginBottom: 12 }}>Próximos partidos</Text>
        <View style={{ backgroundColor: Colors.bg.surface1, borderRadius: 12, padding: 24, alignItems: 'center' }}>
          <Ionicons name="calendar-outline" size={32} color={Colors.text.disabled} />
          <Text style={{ color: Colors.text.disabled, fontSize: 14, marginTop: 8 }}>No hay partidos programados</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ color: Colors.text.primary, fontSize: 18, fontWeight: '600' }}>Próximos partidos</Text>
        <TouchableOpacity
          onPress={() => router.push({ pathname: routes.private.tabs.calendar as never, params: { filter: 'programmed' } } as never)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}
        >
          <Text style={{ color: Colors.brand.primary, fontSize: 13, fontWeight: '500' }}>Ver calendario</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.brand.primary} />
        </TouchableOpacity>
      </View>

      {sortedMatches.map((match) => (
        <ProgrammedMatchCard
          key={match.id}
          match={match}
          permissions={permissions}
          actionsDisabled={actionsDisabled}
          onPress={() => router.push(routes.private.matchRoutes.programmed.detail(match.id) as never)}
          onStartMatch={() => onStartMatch?.(match.id)}
          onEditMatch={onEditMatch ? () => onEditMatch(match.id) : undefined}
        />
      ))}
    </View>
  );
}
