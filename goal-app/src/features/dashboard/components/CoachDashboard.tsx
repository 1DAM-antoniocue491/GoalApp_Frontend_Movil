/**
 * CoachDashboard.tsx
 *
 * Dashboard para el rol `coach` (entrenador).
 *
 * DIFERENCIAS CON ADMIN:
 * - No ve las métricas generales de la liga (canViewLeagueMetrics = false)
 * - No ve las tarjetas de progreso (canViewProgressMetrics = false)
 * - En partidos en vivo: solo puede ver plantillas (canRegisterEvent = false)
 * - En próximos: puede gestionar convocatoria pero NO iniciar (canStartMatch = false)
 *   → Nota: canManageSquad = true, pero el botón de convocatoria se implementa
 *     en la feature Matches cuando esté lista.
 *
 * DATOS:
 * Usa el mismo hook `useDashboardData` que el admin.
 * En el futuro, si el backend devuelve datos distintos por rol,
 * solo hay que actualizar el hook sin tocar este componente.
 *
 * SHELL:
 * SafeAreaView, StatusBar, WelcomeBlock, loading y error están centralizados
 * en DashboardLayout. CoachDashboard solo se preocupa de sus secciones.
 */

import React from 'react';
import { View } from 'react-native';

import { useDashboardData } from '@/src/shared/hooks/usedashboarddata';
import { getDashboardPermissions } from '../services/dashboardService';
import { DashboardLayout } from './DashboardLayout';
import { LiveMatchCard } from '@/src/features/matches/components/cards/LiveMatchCard';
import { UpcomingMatchesSection } from './UpcomingMatchesSection';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CoachDashboardProps {
  leagueName: string;
  leagueId: string;
  userName: string;
  teamName?: string;
  notificationCount?: number;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function CoachDashboard({
  leagueName,
  leagueId,
  userName,
  teamName,
  notificationCount = 0,
}: CoachDashboardProps) {
  const { data, isLoading, isError, refetch } = useDashboardData(leagueId);
  // Permisos del rol coach — distintos a admin
  const permissions = getDashboardPermissions('coach');

  // El equipo del entrenador se muestra en el subtítulo del WelcomeBlock
  const displayLeagueName = teamName ? `${teamName} · ${leagueName}` : leagueName;

  return (
    <DashboardLayout
      userName={userName}
      leagueName={displayLeagueName}
      role="coach"
      notificationCount={notificationCount}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
    >
      {data && (
        <>
          {/* Partido en vivo: el coach solo puede ver plantillas */}
          {data.liveMatch && (
            <View style={{ marginTop: 16 }}>
              <LiveMatchCard
                match={data.liveMatch}
                permissions={permissions}
                // onRegisterEvent y onEndMatch no se pasan: coach no los usa
              />
            </View>
          )}

          {/* Próximos: el coach puede gestionar convocatoria pero no iniciar */}
          <UpcomingMatchesSection
            matches={data.upcomingMatches}
            permissions={permissions}
          />
        </>
      )}
    </DashboardLayout>
  );
}