/**
 * FieldDelegateDashboard.tsx
 *
 * Dashboard para el rol `field_delegate` (delegado de campo).
 *
 * DIFERENCIAS CON ADMIN:
 * - No ve métricas de liga ni tarjetas de progreso
 * - En partidos en vivo: puede registrar eventos y finalizar (igual que admin)
 *   pero NO gestiona convocatorias ni edita el partido
 * - En próximos: solo puede iniciar el partido (canStartMatch = true)
 *   pero sin convocatoria ni edición (canManageSquad = false, canEditMatch = false)
 *
 * El field_delegate es el "árbitro/delegado" que controla el partido en campo.
 * Tiene acceso operativo al partido pero no a la gestión administrativa de la liga.
 *
 * SHELL:
 * SafeAreaView, StatusBar, WelcomeBlock, loading y error están centralizados
 * en DashboardLayout. FieldDelegateDashboard solo se preocupa de sus secciones.
 */

import React from 'react';
import { View } from 'react-native';

import { useDashboardData } from '@/src/shared/hooks/usedashboarddata';
import { getDashboardPermissions } from '../services/dashboardService';
import { DashboardLayout } from './DashboardLayout';
import { LiveMatchCard } from '@/src/features/matches/components/cards/LiveMatchCard';
import { UpcomingMatchesSection } from './UpcomingMatchesSection';

interface FieldDelegateDashboardProps {
  leagueName: string;
  leagueId: string;
  userName: string;
  notificationCount?: number;
}

export function FieldDelegateDashboard({
  leagueName,
  leagueId,
  userName,
  notificationCount = 0,
}: FieldDelegateDashboardProps) {
  const { data, isLoading, isError, refetch } = useDashboardData(leagueId);
  const permissions = getDashboardPermissions('field_delegate');

  const handleRegisterEvent = (matchId: string) => {
    // TODO: abrir modal de registro de evento
    console.log('[FieldDelegate] Registrar evento:', matchId);
  };

  const handleEndMatch = (matchId: string) => {
    // TODO: abrir flujo de finalización
    console.log('[FieldDelegate] Finalizar partido:', matchId);
  };

  const handleStartMatch = (matchId: string) => {
    // TODO: confirmar inicio del partido
    console.log('[FieldDelegate] Iniciar partido:', matchId);
  };

  return (
    <DashboardLayout
      userName={userName}
      leagueName={leagueName}
      role="field_delegate"
      notificationCount={notificationCount}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
    >
      {data && (
        <>
          {/* El field_delegate tiene acceso operativo completo al partido en vivo */}
          {data.liveMatch && (
            <View style={{ marginTop: 16 }}>
              <LiveMatchCard
                match={data.liveMatch}
                permissions={permissions}
                onRegisterEvent={handleRegisterEvent}
                onEndMatch={handleEndMatch}
              />
            </View>
          )}

          {/* Próximos: solo puede iniciar, sin convocatoria ni edición */}
          <UpcomingMatchesSection
            matches={data.upcomingMatches}
            permissions={permissions}
            onStartMatch={handleStartMatch}
          />
        </>
      )}
    </DashboardLayout>
  );
}