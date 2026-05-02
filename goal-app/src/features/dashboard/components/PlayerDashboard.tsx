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
 *
 * SHELL:
 * SafeAreaView, StatusBar, WelcomeBlock, loading y error están centralizados
 * en DashboardLayout. PlayerDashboard solo se preocupa de sus secciones.
 */

import React from 'react';
import { View } from 'react-native';

import { useDashboardData } from '@/src/features/dashboard/hooks';
import { getDashboardPermissions } from '../services/dashboardService';
import { DashboardLayout } from './DashboardLayout';
import { LiveMatchCard } from '@/src/features/matches/components/cards/LiveMatchCard';
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
  const { data, isLoading, isRefetching, isError, refetch } = useDashboardData(leagueId);
  const permissions = getDashboardPermissions('player');

  // El equipo del jugador se muestra en el subtítulo del WelcomeBlock
  const displayLeagueName = teamName ? `${teamName} · ${leagueName}` : leagueName;

  return (
    <DashboardLayout
      userName={userName}
      leagueName={displayLeagueName}
      role="player"
      notificationCount={notificationCount}
      isLoading={isLoading}
      isRefetching={isRefetching}
      isError={isError}
      onRetry={refetch}
    >
      {data && (
        <>
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
        </>
      )}
    </DashboardLayout>
  );
}