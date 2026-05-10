/**
 * ProgrammedMatchCard.tsx
 * Tarjeta única para partidos programados en calendario y dashboard.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { UpcomingMatchData } from '@/src/shared/types/dashboard.types';
import type { DashboardPermissions } from '@/src/features/dashboard/services/dashboardService';
import { routes } from '@/src/shared/config/routes';

export interface ProgrammedMatchCardProps {
  match: UpcomingMatchData;
  permissions: DashboardPermissions;
  onPress?: () => void;
  onStartMatch?: () => void;
  onEditMatch?: () => void;
  actionsDisabled?: boolean;
}


function TeamBadge({ letter, color }: { letter: string; color: string }) {
  return (
    <View
      style={{
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: color + '22',
        borderWidth: 1.5,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color, fontSize: 12, fontWeight: '700' }}>{letter}</Text>
    </View>
  );
}

export function ProgrammedMatchCard({
  match,
  permissions,
  onPress,
  onStartMatch,
  onEditMatch,
  actionsDisabled = false,
}: ProgrammedMatchCardProps) {
  const router = useRouter();
  const homeColor = match.homeColor ?? '#A1A1AA';
  const awayColor = match.awayColor ?? '#C4F135';
  const startAllowed = permissions.canStartMatch && !actionsDisabled;

  const handleCardPress = () => {
    if (onPress) onPress();
    else router.push(routes.private.matchRoutes.programmed.detail(match.id) as never);
  };

  return (
    <TouchableOpacity
      onPress={handleCardPress}
      activeOpacity={0.75}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C22',
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
      }}
    >
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TeamBadge letter={match.homeTeam.charAt(0)} color={homeColor} />
          <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '500' }} numberOfLines={1}>{match.homeTeam}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TeamBadge letter={match.awayTeam.charAt(0)} color={awayColor} />
          <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '500' }} numberOfLines={1}>{match.awayTeam}</Text>
        </View>

        <Text style={{ color: '#52525B', fontSize: 12, marginTop: 2 }} numberOfLines={1}>
          {match.round} · {match.venue || 'Sin sede'}
        </Text>

        {(permissions.canStartMatch || permissions.canManageSquad || onEditMatch) && (
          <View style={{ marginTop: 6, gap: 6 }}>
            {(permissions.canStartMatch || onEditMatch) && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                {permissions.canStartMatch && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation?.();
                      if (startAllowed) onStartMatch?.();
                    }}
                    disabled={!startAllowed}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      backgroundColor: startAllowed ? '#C4F135' : '#2A2A35',
                      paddingHorizontal: 12,
                      paddingVertical: 5,
                      borderRadius: 999,
                    }}
                  >
                    <Ionicons name="play-circle-outline" size={13} color={startAllowed ? '#0F0F13' : '#52525B'} />
                    <Text style={{ color: startAllowed ? '#0F0F13' : '#52525B', fontSize: 12, fontWeight: '700' }}>
                      Iniciar
                    </Text>
                  </TouchableOpacity>
                )}

                {onEditMatch && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation?.();
                      if (!actionsDisabled) onEditMatch?.();
                    }}
                    disabled={actionsDisabled}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      backgroundColor: '#2A2A35',
                      paddingHorizontal: 12,
                      paddingVertical: 5,
                      borderRadius: 999,
                      opacity: actionsDisabled ? 0.45 : 1,
                    }}
                  >
                    <Ionicons name="create-outline" size={13} color="#A1A1AA" />
                    <Text style={{ color: '#A1A1AA', fontSize: 12, fontWeight: '700' }}>Editar</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}


            {permissions.canManageSquad && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation?.();
                  if (!actionsDisabled) router.push(routes.private.matchRoutes.programmed.convocation(match.id) as never);
                }}
                disabled={actionsDisabled}
                style={{
                  alignSelf: 'flex-start',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: '#2A2A35',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 999,
                  opacity: actionsDisabled ? 0.45 : 1,
                }}
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
