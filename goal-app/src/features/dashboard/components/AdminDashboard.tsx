/**
 * AdminDashboard.tsx
 *
 * Dashboard para el rol `admin`. Orquesta todos los sub-componentes
 * y gestiona el ciclo de datos (loading → error → datos → refresco).
 *
 * RESPONSABILIDAD:
 * - Leer datos del dashboard via `useDashboardData` (nunca directamente del mock)
 * - Calcular permisos via `getDashboardPermissions` (nunca hardcodear en hijos)
 * - Pasar datos y permisos a cada sub-componente
 * - Gestionar navegación de alto nivel (registrar evento, finalizar partido)
 *
 * PATRÓN DE DATOS:
 * AdminDashboard → useDashboardData → fetchDashboardData → API real
 *
 * Los sub-componentes no saben de dónde vienen los datos.
 * Solo conocen su prop contract.
 *
 * SHELL:
 * SafeAreaView, StatusBar, WelcomeBlock, loading y error están centralizados
 * en DashboardLayout. AdminDashboard solo se preocupa de sus secciones.
 */

import React, { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';

import { useDashboardData } from '@/src/features/dashboard/hooks';
import { getDashboardPermissions } from '../services/dashboardService';
import { DashboardLayout } from './DashboardLayout';
import { LeagueMetrics } from './LeagueMetrics';
import { LiveMatchCard } from '@/src/features/matches/components/cards/LiveMatchCard';
import { UpcomingMatchesSection } from './UpcomingMatchesSection';
import { ProgressMetrics } from './ProgressMetrics';
import { useMatchActionModals } from '@/src/features/matches/hooks/useMatchActionModals';
import { RegisterEventModal } from '@/src/features/matches/components/modals/RegisterEventModal';
import { GoalEventModal } from '@/src/features/matches/components/modals/GoalEventModal';
import { YellowCardModal } from '@/src/features/matches/components/modals/YellowCardModal';
import { RedCardModal } from '@/src/features/matches/components/modals/RedCardModal';
import { SubstitutionModal } from '@/src/features/matches/components/modals/SubstitutionModal';
import { EndMatchModal } from '@/src/features/matches/components/modals/EndMatchModal';
import { StartMatchModal } from '@/src/features/matches/components/modals/StartMatchModal';
import { EditScheduledMatchModal } from '@/src/features/matches/components/modals/EditScheduledMatchModal';
import type { EditScheduledMatchData } from '@/src/features/matches/components/modals/EditScheduledMatchModal';
import { getMatchByIdService, updateScheduledMatchService } from '@/src/features/matches/services/matchesService';
import type { PartidoApi } from '@/src/features/matches/types/matches.types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AdminDashboardProps {
  leagueName: string;
  /** ID de la liga activa — se usa como clave de datos en useDashboardData */
  leagueId: string;
  /** Nombre del usuario autenticado — viene de la sesión global */
  userName: string;
  /** Número de notificaciones no leídas */
  notificationCount?: number;
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function AdminDashboard({
  leagueName,
  leagueId,
  userName,
  notificationCount = 0,
}: AdminDashboardProps) {
  // Datos del dashboard desde el hook — API real vía fetchDashboardData
  const { data, isLoading, isRefetching, isError, refetch } = useDashboardData(leagueId);

  // Permisos del rol admin — calculados una sola vez en el padre
  // para pasarlos a todos los hijos que los necesiten
  const permissions = getDashboardPermissions('admin');
  const {
    openRegisterEvent, openEndMatch, openStartMatch,
    modals, activeEventMatch, activeEndMatch, activeStartMatch, modalProps,
  } = useMatchActionModals(refetch);

  // ── Editar partido ──
  const [matchToEdit, setMatchToEdit] = useState<PartidoApi | null>(null);
  const [editMatchVisible, setEditMatchVisible] = useState(false);
  const [savingEditMatch, setSavingEditMatch] = useState(false);

  const handleEditMatch = useCallback((matchId: string) => {
    void (async () => {
      const result = await getMatchByIdService(Number(matchId));
      if (result.success && result.data) {
        setMatchToEdit(result.data);
        setEditMatchVisible(true);
      } else {
        Alert.alert('Error', 'No se pudo cargar el partido para editar.');
      }
    })();
  }, []);

  const handleEditMatchConfirm = useCallback(async (data: EditScheduledMatchData) => {
    if (!matchToEdit) return;
    setSavingEditMatch(true);
    const result = await updateScheduledMatchService(Number(matchToEdit.id_partido), {
      fecha: data.fecha,
      estado: data.estado,
    });
    setSavingEditMatch(false);
    if (!result.success) {
      Alert.alert('Error', result.error || 'No se pudo guardar el partido.');
      return;
    }
    setEditMatchVisible(false);
    setMatchToEdit(null);
    void refetch();
  }, [matchToEdit, refetch]);

  // ── Handlers de acciones — delegan al flujo centralizado de modales ──

  const handleRegisterEvent = (_matchId: string) => {
    if (!data?.liveMatch) return;
    openRegisterEvent({
      id: data.liveMatch.id,
      homeTeam: data.liveMatch.homeTeam,
      awayTeam: data.liveMatch.awayTeam,
      homeScore: data.liveMatch.homeScore,
      awayScore: data.liveMatch.awayScore,
      minute: data.liveMatch.minute,
      duration: data.liveMatch.duration,
      homeTeamId: data.liveMatch.homeTeamId,
      awayTeamId: data.liveMatch.awayTeamId,
      startedAt: data.liveMatch.startedAt,
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
    openStartMatch({
      id: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      date: `${match.day} ${match.month}`,
      time: match.time,
      venue: match.venue,
      rawDateTime: match.rawDateTime,
    });
  };

  // ── Render ──

  return (
    <DashboardLayout
      userName={userName}
      leagueName={leagueName}
      role="admin"
      notificationCount={notificationCount}
      isLoading={isLoading}
      isRefetching={isRefetching}
      isError={isError}
      onRetry={refetch}
    >
      {/*
        data se null-chequea aquí porque DashboardLayout no conoce el tipo
        de datos de cada rol. Cuando data es null (antes de la primera carga)
        este bloque se omite y el layout sigue mostrando el skeleton.
      */}
      {data && (
        <>
          {/* ── Métricas 2×2 (solo admin: canViewLeagueMetrics) ── */}
          {permissions.canViewLeagueMetrics && (
            <LeagueMetrics metrics={data.metrics} />
          )}

          {/* ── Partido en vivo (si existe) ── */}
          {data.liveMatch && (
            <View style={{ marginTop: 16 }}>
              <LiveMatchCard
                match={data.liveMatch}
                permissions={permissions}
                onRegisterEvent={handleRegisterEvent}
                onEndMatch={handleEndMatch}
                actionsDisabled={modalProps.pending.any}
              />
            </View>
          )}

          {/* ── Próximos partidos ── */}
          <UpcomingMatchesSection
            matches={data.upcomingMatches}
            permissions={permissions}
            onStartMatch={handleStartMatch}
            onEditMatch={permissions.canEditMatch ? handleEditMatch : undefined}
            actionsDisabled={modalProps.pending.any}
          />

          {/* ── Progreso: equipos activos + jornadas (solo admin) ── */}
          {permissions.canViewProgressMetrics && (
            <ProgressMetrics metrics={data.metrics} />
          )}
        </>
      )}

      {/* ── Modales operativos — estado centralizado en useMatchActionModals ── */}
      <RegisterEventModal
        visible={modals.registerEvent}
        match={activeEventMatch}
        disabled={modalProps.pending.any}
        loading={modalProps.pending.hydratingEventPlayers}
        onSelectEvent={modalProps.onSelectEvent}
        onCancel={modalProps.onCloseRegisterEvent}
      />
      <GoalEventModal
        visible={modals.goal}
        match={activeEventMatch}
        submitting={modalProps.pending.submittingEvent}
        onConfirm={modalProps.onGoalConfirm}
        onCancel={modalProps.onCloseGoal}
      />
      <YellowCardModal
        visible={modals.yellowCard}
        match={activeEventMatch}
        submitting={modalProps.pending.submittingEvent}
        onConfirm={modalProps.onYellowCardConfirm}
        onCancel={modalProps.onCloseYellowCard}
      />
      <RedCardModal
        visible={modals.redCard}
        match={activeEventMatch}
        submitting={modalProps.pending.submittingEvent}
        onConfirm={modalProps.onRedCardConfirm}
        onCancel={modalProps.onCloseRedCard}
      />
      <SubstitutionModal
        visible={modals.substitution}
        match={activeEventMatch}
        submitting={modalProps.pending.submittingEvent}
        onConfirm={modalProps.onSubstitutionConfirm}
        onCancel={modalProps.onCloseSubstitution}
      />
      <EndMatchModal
        visible={modals.endMatch}
        match={activeEndMatch}
        submitting={modalProps.pending.endingMatch || modalProps.pending.hydratingEndMatch}
        onConfirm={modalProps.onEndMatchConfirm}
        onCancel={modalProps.onCloseEndMatch}
      />
      <StartMatchModal
        visible={modals.startMatch}
        match={activeStartMatch}
        submitting={modalProps.pending.startingMatch}
        onConfirm={modalProps.onStartMatchConfirm}
        onCancel={modalProps.onCloseStartMatch}
      />
      <EditScheduledMatchModal
        visible={editMatchVisible}
        match={matchToEdit}
        saving={savingEditMatch}
        onConfirm={handleEditMatchConfirm}
        onCancel={() => { if (!savingEditMatch) { setEditMatchVisible(false); setMatchToEdit(null); } }}
      />
    </DashboardLayout>
  );
}