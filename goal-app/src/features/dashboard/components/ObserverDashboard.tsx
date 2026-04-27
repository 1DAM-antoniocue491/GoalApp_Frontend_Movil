/**
 * ObserverDashboard.tsx
 *
 * Dashboard para el rol `observer` (observador).
 *
 * DIFERENCIAS CON PLAYER:
 * - No pertenece a un equipo → no hay prop `teamName`
 * - No tendrá bloque de estadísticas personales cuando llegue feature Statistics
 *   → el bloque "Mis estadísticas" es exclusivo del rol `player`
 * - Permisos idénticos a player hoy, pero separados intencionalmente
 *   para que la divergencia futura no requiera tocar PlayerDashboard
 *
 * PERMISOS (observer):
 * - canViewLineups: true  → puede ver plantillas
 * - todo lo demás: false  → solo lectura, sin acciones operativas
 *
 * SHELL:
 * SafeAreaView, StatusBar, WelcomeBlock, loading y error están centralizados
 * en DashboardLayout. ObserverDashboard solo se preocupa de sus secciones.
 */

import React from 'react';
import { View } from 'react-native';

import { useDashboardData } from '@/src/shared/hooks/usedashboarddata';
import { getDashboardPermissions } from '../services/dashboardService';
import { DashboardLayout } from './DashboardLayout';
import { LiveMatchCard } from './LiveMatchCard';
import { UpcomingMatchesSection } from './UpcomingMatchesSection';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ObserverDashboardProps {
  leagueName: string;
  leagueId: string;
  userName: string;
  notificationCount?: number;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function ObserverDashboard({
  leagueName,
  leagueId,
  userName,
  notificationCount = 0,
}: ObserverDashboardProps) {
  const { data, isLoading, isError, refetch } = useDashboardData(leagueId);
  const permissions = getDashboardPermissions('observer');

  return (
    <DashboardLayout
      userName={userName}
      leagueName={leagueName}
      role="observer"
      notificationCount={notificationCount}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
    >
      {data && (
        <>
          {/* Partido en vivo: el observador solo puede ver plantillas */}
          {data.liveMatch && (
            <View style={{ marginTop: 16 }}>
              <LiveMatchCard
                match={data.liveMatch}
                permissions={permissions}
                // Sin callbacks de acción: observer no registra eventos ni finaliza
              />
            </View>
          )}

          {/* Próximos partidos: solo consulta, sin botones de acción */}
          <UpcomingMatchesSection
            matches={data.upcomingMatches}
            permissions={permissions}
            // onStartMatch no se pasa: observer no puede iniciar partidos
          />
        </>
      )}
    </DashboardLayout>
  );
}
