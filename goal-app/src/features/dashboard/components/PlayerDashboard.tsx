/**
 * PlayerDashboard.tsx
 *
 * Dashboard para el rol `player` (jugador).
 *
 * DIFERENCIAS CON ADMIN Y COACH:
 * - No ve métricas de liga
 * - En partidos en vivo: solo puede ver plantillas
 * - En próximos: solo consulta (sin botones de acción)
 * - canStartMatch = false, canRegisterEvent = false, canManageSquad = false
 *
 * NOTA FUTURA:
 * Cuando la feature Statistics esté implementada, este dashboard
 * mostrará el bloque "Mis estadísticas" (goles, MVPs, tarjetas propias).
 * Por eso el componente recibe `playerName` como prop aunque no lo use aún.
 */

import React from 'react';
import { View, ScrollView, Text, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useDashboardData } from '@/src/shared/hooks/usedashboarddata';
import { getDashboardPermissions } from '../services/dashboardService';
import { WelcomeBlock } from './WelcomeBlock';
import { LiveMatchCard } from './LiveMatchCard';
import { UpcomingMatchesSection } from './UpcomingMatchesSection';

interface PlayerDashboardProps {
  leagueName: string;
  leagueId: string;
  userName: string;
  teamName?: string;
  /** Nombre del jugador autenticado — se usará en el bloque de estadísticas */
  playerName?: string;
  notificationCount?: number;
}

export function PlayerDashboard({
  leagueName,
  leagueId,
  userName,
  teamName,
  notificationCount = 0,
}: PlayerDashboardProps) {
  const { data, isLoading, isError, refetch } = useDashboardData(leagueId);
  const permissions = getDashboardPermissions('player');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F13' }} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F13" />

      <WelcomeBlock
        userName={userName}
        leagueName={teamName ? `${teamName} · ${leagueName}` : leagueName}
        role="player"
        notificationCount={notificationCount}
      />

      {isLoading && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="football-outline" size={32} color="#52525B" />
        </View>
      )}

      {isError && !isLoading && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <TouchableOpacity onPress={refetch}>
            <Text style={{ color: '#C4F135' }}>Error — pulsa para reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {data && !isLoading && !isError && (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {data.liveMatch && (
            <View style={{ marginTop: 16 }}>
              <LiveMatchCard
                match={data.liveMatch}
                permissions={permissions}
              // El jugador no tiene acciones operativas en el partido
              />
            </View>
          )}

          {/* Solo consulta: sin botones de inicio ni acción */}
          <UpcomingMatchesSection
            matches={data.upcomingMatches}
            permissions={permissions}
          />

          {/*
           * TODO (feature Statistics):
           * <PlayerStatsBlock playerId={session.userId} leagueId={leagueId} />
           * Muestra: goles propios, MVPs, tarjetas, partidos jugados
           */}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}