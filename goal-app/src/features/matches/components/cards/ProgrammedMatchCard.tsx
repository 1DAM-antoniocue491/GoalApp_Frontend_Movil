/**
 * ProgrammedMatchCard.tsx
 * Tarjeta única de partido programado para dashboard, calendario y pantallas de partidos.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import type { UpcomingMatchData } from '@/src/shared/types/dashboard.types';
import type { DashboardPermissions } from '@/src/features/dashboard/services/dashboardService';
import { routes } from '@/src/shared/config/routes';

interface ProgrammedMatchExtras {
  startsAt?: string | null;
  rawDate?: string | null;
}

type ProgrammedMatchCardData = UpcomingMatchData & ProgrammedMatchExtras;

export interface ProgrammedMatchCardProps {
  match: ProgrammedMatchCardData;
  permissions: DashboardPermissions;
  onPress?: () => void;
  onStartMatch?: () => void;
  onEditMatch?: () => void;
  actionsDisabled?: boolean;
}

const MONTH_MAP: Record<string, number> = {
  ENE: 0, FEB: 1, MAR: 2, ABR: 3, MAY: 4, JUN: 5,
  JUL: 6, AGO: 7, SEP: 8, OCT: 9, NOV: 10, DIC: 11,
};

function parseLiteralTimestamp(raw?: string | null): number | null {
  if (!raw) return null;
  const match = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);
  if (!match) return null;
  const [, y, m, d, h = '00', min = '00'] = match;
  const ts = new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min), 0, 0).getTime();
  return Number.isFinite(ts) ? ts : null;
}

function canStartMatchNow(match: ProgrammedMatchCardData): boolean {
  const byRaw = parseLiteralTimestamp(match.startsAt ?? match.rawDate ?? null);
  if (byRaw != null) return Date.now() >= byRaw - 60 * 60000;

  const monthIndex = MONTH_MAP[String(match.month ?? '').toUpperCase()];
  if (monthIndex === undefined) return false;
  const [hStr, mStr] = String(match.time ?? '').split(':');
  const hours = Number(hStr);
  const minutes = Number(mStr);
  const day = Number(match.day);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || !Number.isFinite(day)) return false;

  const now = new Date();
  const matchDate = new Date(now.getFullYear(), monthIndex, day, hours, minutes, 0);
  return Date.now() >= matchDate.getTime() - 60 * 60000;
}

function TeamBadge({ letter, color }: { letter: string; color: string }) {
  return (
    <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: color + '22', borderWidth: 1.5, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color, fontSize: 12, fontWeight: '700' }}>{letter}</Text>
    </View>
  );
}

export function ProgrammedMatchCard({ match, permissions, onPress, onStartMatch, onEditMatch, actionsDisabled = false }: ProgrammedMatchCardProps) {
  const router = useRouter();
  const homeColor = match.homeColor ?? '#A1A1AA';
  const awayColor = match.awayColor ?? '#C4F135';
  const startAllowed = canStartMatchNow(match) && !actionsDisabled;

  const handleCardPress = () => {
    if (onPress) onPress();
    else router.push(routes.private.matchRoutes.programmed.detail(match.id) as never);
  };

  return (
    <TouchableOpacity onPress={handleCardPress} activeOpacity={0.75} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C22', borderRadius: 12, padding: 14, marginBottom: 8, opacity: actionsDisabled ? 0.86 : 1 }}>
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TeamBadge letter={match.homeTeam.charAt(0).toUpperCase()} color={homeColor} />
          <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '500' }}>{match.homeTeam}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TeamBadge letter={match.awayTeam.charAt(0).toUpperCase()} color={awayColor} />
          <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '500' }}>{match.awayTeam}</Text>
        </View>

        <Text style={{ color: '#52525B', fontSize: 12, marginTop: 2 }}>{match.round} · {match.venue}</Text>

        {(permissions.canStartMatch || permissions.canManageSquad || onEditMatch) && (
          <View style={{ marginTop: 6, gap: 6 }}>
            {(permissions.canStartMatch || onEditMatch) && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                {permissions.canStartMatch && (
                  <TouchableOpacity
                    onPress={(e) => { e.stopPropagation?.(); if (startAllowed) onStartMatch?.(); }}
                    disabled={!startAllowed}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: startAllowed ? '#C4F135' : '#2A2A35', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 }}
                  >
                    <Ionicons name="play-circle-outline" size={13} color={startAllowed ? '#0F0F13' : '#52525B'} />
                    <Text style={{ color: startAllowed ? '#0F0F13' : '#52525B', fontSize: 12, fontWeight: '700' }}>Iniciar</Text>
                  </TouchableOpacity>
                )}

                {onEditMatch && (
                  <TouchableOpacity
                    onPress={(e) => { e.stopPropagation?.(); if (!actionsDisabled) onEditMatch(); }}
                    disabled={actionsDisabled}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#2A2A35', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, opacity: actionsDisabled ? 0.45 : 1 }}
                  >
                    <Ionicons name="create-outline" size={13} color="#A1A1AA" />
                    <Text style={{ color: '#A1A1AA', fontSize: 12, fontWeight: '700' }}>Editar</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {permissions.canStartMatch && !startAllowed && (
              <Text style={{ color: '#52525B', fontSize: 10, marginTop: 3 }}>Disponible cuando llegue la hora del partido</Text>
            )}

            {permissions.canManageSquad && (
              <TouchableOpacity
                onPress={(e) => { e.stopPropagation?.(); if (!actionsDisabled) router.push(routes.private.matchRoutes.programmed.convocation(match.id) as never); }}
                disabled={actionsDisabled}
                style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#2A2A35', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, opacity: actionsDisabled ? 0.45 : 1 }}
              >
                <Ionicons name="people-outline" size={12} color="#A1A1AA" />
                <Text style={{ color: '#A1A1AA', fontSize: 11, fontWeight: '600' }}>Convocatoria</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View style={{ width: 1, height: 56, backgroundColor: '#2A2A35', marginHorizontal: 14 }} />

      <View style={{ alignItems: 'center', minWidth: 52 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', lineHeight: 28 }}>{match.day}</Text>
        <Text style={{ color: '#A1A1AA', fontSize: 11, textTransform: 'uppercase' }}>{match.month}</Text>
        <Text style={{ color: '#C4F135', fontSize: 13, fontWeight: '600', marginTop: 3 }}>{match.time}</Text>
      </View>
    </TouchableOpacity>
  );
}
