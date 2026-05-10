/**
 * FieldDelegateDashboard.tsx
 *
 * Dashboard para el rol `field_delegate` (delegado de campo).
 *
 * DIFERENCIAS CON ADMIN:
 * - No ve métricas de liga ni tarjetas de progreso
 * - En partidos en vivo: puede registrar eventos SOLO si su equipo es LOCAL
 *   y finalizar el partido
 * - En próximos: solo puede iniciar el partido SI su equipo es LOCAL
 * - NO gestiona convocatorias ni edita el partido
 *
 * El field_delegate es el "delegado" que controla el partido en campo.
 * Tiene acceso operativo limitado a partidos donde su equipo es local.
 */

import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useDashboardData } from '@/src/shared/hooks/usedashboarddata';
import { getDashboardPermissions } from '../services/dashboardService';
import { DashboardLayout } from './DashboardLayout';
import { LiveMatchCard } from '@/src/features/matches/components/cards/LiveMatchCard';
import { UpcomingMatchesSection } from './UpcomingMatchesSection';
import { useMatchActionModals } from '@/src/features/matches/hooks/useMatchActionModals';
import { RegisterEventModal } from '@/src/features/matches/components/modals/RegisterEventModal';
import { GoalEventModal } from '@/src/features/matches/components/modals/GoalEventModal';
import { YellowCardModal } from '@/src/features/matches/components/modals/YellowCardModal';
import { RedCardModal } from '@/src/features/matches/components/modals/RedCardModal';
import { SubstitutionModal } from '@/src/features/matches/components/modals/SubstitutionModal';
import { EndMatchModal } from '@/src/features/matches/components/modals/EndMatchModal';
import { StartMatchModal } from '@/src/features/matches/components/modals/StartMatchModal';

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
  const [delegadoTeamId, setDelegadoTeamId] = useState<string | null>(null);

  // Obtener el equipo del delegado
  useEffect(() => {
    async function fetchDelegadoTeam() {
      try {
        // TODO: Reemplazar con llamada real a API cuando el backend esté listo
        // const res = await apiGet<{ id_equipo: string }>('/equipos/usuario/mi-equipo', { liga_id: leagueId });
        // setDelegadoTeamId(res.id_equipo);
        // Por ahora usamos un equipo mock para pruebas
        setDelegadoTeamId('team-1'); // Equipo mock del delegado
      } catch {
        setDelegadoTeamId(null);
      }
    }
    fetchDelegadoTeam();
  }, [leagueId]);

  const isDelegadoHomeTeam = (homeTeamId?: string): boolean => {
    if (!delegadoTeamId || !homeTeamId) return false;
    return homeTeamId === delegadoTeamId;
  };

  const {
    openRegisterEvent, openEndMatch, openStartMatch,
    modals, activeEventMatch, activeEndMatch, activeStartMatch, modalProps,
  } = useMatchActionModals();

  const handleRegisterEvent = (_matchId: string) => {
    if (!data?.liveMatch) return;
    // El delegado solo puede registrar eventos si su equipo es local
    if (!isDelegadoHomeTeam(data.liveMatch.homeTeamId)) return;
    openRegisterEvent({
      id: data.liveMatch.id,
      homeTeam: data.liveMatch.homeTeam,
      awayTeam: data.liveMatch.awayTeam,
      homeScore: data.liveMatch.homeScore,
      awayScore: data.liveMatch.awayScore,
      minute: data.liveMatch.minute,
    });
  };

  const handleEndMatch = (_matchId: string) => {
    if (!data?.liveMatch) return;
    openEndMatch({
      id: data.liveMatch.id,
      homeTeam: data.liveMatch.homeTeam,
      awayTeam: data.liveMatch.awayTeam,
      homeScore: data.liveMatch.homeScore,
      awayScore: data.liveMatch.awayScore,
    });
  };

  const handleStartMatch = (matchId: string) => {
    const match = data?.upcomingMatches.find(m => m.id === matchId);
    if (!match) return;
    // El delegado solo puede iniciar partidos donde su equipo es local
    if (!isDelegadoHomeTeam(match.homeTeamId)) return;
    openStartMatch({
      id: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      date: `${match.day} ${match.month}`,
      time: match.time,
      venue: match.venue,
    });
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
                showRegisterEvent={isDelegadoHomeTeam(data.liveMatch.homeTeamId)}
              />
            </View>
          )}

          {/* Próximos: solo puede iniciar si es local, sin convocatoria ni edición */}
          <UpcomingMatchesSection
            matches={data.upcomingMatches}
            permissions={permissions}
            onStartMatch={handleStartMatch}
            delegateTeamId={delegadoTeamId ?? undefined}
          />
        </>
      )}

      {/* ── Modales operativos — estado centralizado en useMatchActionModals ── */}
      <RegisterEventModal
        visible={modals.registerEvent}
        match={activeEventMatch}
        onSelectEvent={modalProps.onSelectEvent}
        onCancel={modalProps.onCloseRegisterEvent}
      />
      <GoalEventModal
        visible={modals.goal}
        match={activeEventMatch}
        onConfirm={modalProps.onGoalConfirm}
        onCancel={modalProps.onCloseGoal}
      />
      <YellowCardModal
        visible={modals.yellowCard}
        match={activeEventMatch}
        onConfirm={modalProps.onYellowCardConfirm}
        onCancel={modalProps.onCloseYellowCard}
      />
      <RedCardModal
        visible={modals.redCard}
        match={activeEventMatch}
        onConfirm={modalProps.onRedCardConfirm}
        onCancel={modalProps.onCloseRedCard}
      />
      <SubstitutionModal
        visible={modals.substitution}
        match={activeEventMatch}
        onConfirm={modalProps.onSubstitutionConfirm}
        onCancel={modalProps.onCloseSubstitution}
      />
      <EndMatchModal
        visible={modals.endMatch}
        match={activeEndMatch}
        onConfirm={modalProps.onEndMatchConfirm}
        onCancel={modalProps.onCloseEndMatch}
      />
      <StartMatchModal
        visible={modals.startMatch}
        match={activeStartMatch}
        onConfirm={modalProps.onStartMatchConfirm}
        onCancel={modalProps.onCloseStartMatch}
      />
    </DashboardLayout>
  );
}