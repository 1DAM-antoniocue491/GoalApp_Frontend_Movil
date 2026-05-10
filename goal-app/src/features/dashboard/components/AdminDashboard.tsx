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

import React, { useState } from 'react';
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
import { EditScheduledMatchModal, type EditScheduledMatchData } from '@/src/features/matches/components/modals/EditScheduledMatchModal';
import { updateScheduledMatchService } from '@/src/features/matches/services/matchesService';
import { emitMatchDataChanged } from '@/src/features/matches/services/matchSync';
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
  const [editingMatch, setEditingMatch] = useState<PartidoApi | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Datos del dashboard desde el hook — API real vía fetchDashboardData
  const { data, isLoading, isRefetching, isError, refetch } = useDashboardData(leagueId);

  // Permisos del rol admin — calculados una sola vez en el padre
  // para pasarlos a todos los hijos que los necesiten
  const permissions = getDashboardPermissions('admin');
  const {
    openRegisterEvent, openEndMatch, openStartMatch,
    modals, activeEventMatch, activeEndMatch, activeStartMatch, modalProps,
  } = useMatchActionModals(refetch);

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
      duration: (data.liveMatch as any).duration ?? 90,
      startedAt: (data.liveMatch as any).startedAt ?? null,
      homeTeamId: (data.liveMatch as any).homeTeamId,
      awayTeamId: (data.liveMatch as any).awayTeamId,
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
      homeTeamId: (data.liveMatch as any).homeTeamId,
      awayTeamId: (data.liveMatch as any).awayTeamId,
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
    });
  };

  const handleEditMatch = (matchId: string) => {
    const match = data?.upcomingMatches.find((m) => m.id === matchId);
    if (!match) return;
    setEditingMatch({
      id_partido: Number(match.id),
      fecha_hora: (match as any).startsAt ?? (match as any).rawDate ?? null,
      estado: 'programado',
      estadio: match.venue,
      equipo_local: { nombre: match.homeTeam },
      equipo_visitante: { nombre: match.awayTeam },
    } as PartidoApi);
  };

  const handleEditMatchConfirm = async (payload: EditScheduledMatchData) => {
    if (!editingMatch) return;
    setSavingEdit(true);
    const result = await updateScheduledMatchService(editingMatch.id_partido, payload);
    setSavingEdit(false);
    if (!result.success) {
      Alert.alert('No se pudo editar el partido', result.error ?? 'Inténtalo de nuevo.');
      return;
    }
    setEditingMatch(null);
    emitMatchDataChanged();
    refetch();
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
                actionsDisabled={modalProps.pending}
              />
            </View>
          )}

          {/* ── Próximos partidos ── */}
          <UpcomingMatchesSection
            matches={data.upcomingMatches}
            permissions={permissions}
            onStartMatch={handleStartMatch}
            onEditMatch={handleEditMatch}
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
        onSelectEvent={modalProps.onSelectEvent}
        onCancel={modalProps.onCloseRegisterEvent}
        isSubmitting={modalProps.pending}
      />
      <GoalEventModal
        visible={modals.goal}
        match={activeEventMatch}
        onConfirm={modalProps.onGoalConfirm}
        onCancel={modalProps.onCloseGoal}
        isSubmitting={modalProps.pending}
      />
      <YellowCardModal
        visible={modals.yellowCard}
        match={activeEventMatch}
        onConfirm={modalProps.onYellowCardConfirm}
        onCancel={modalProps.onCloseYellowCard}
        isSubmitting={modalProps.pending}
      />
      <RedCardModal
        visible={modals.redCard}
        match={activeEventMatch}
        onConfirm={modalProps.onRedCardConfirm}
        onCancel={modalProps.onCloseRedCard}
        isSubmitting={modalProps.pending}
      />
      <SubstitutionModal
        visible={modals.substitution}
        match={activeEventMatch}
        onConfirm={modalProps.onSubstitutionConfirm}
        onCancel={modalProps.onCloseSubstitution}
        isSubmitting={modalProps.pending}
      />
      <EndMatchModal
        visible={modals.endMatch}
        match={activeEndMatch}
        onConfirm={modalProps.onEndMatchConfirm}
        onCancel={modalProps.onCloseEndMatch}
        isSubmitting={modalProps.pending}
      />
      <StartMatchModal
        visible={modals.startMatch}
        match={activeStartMatch}
        onConfirm={modalProps.onStartMatchConfirm}
        onCancel={modalProps.onCloseStartMatch}
        isSubmitting={modalProps.pending}
      />
      <EditScheduledMatchModal
        visible={Boolean(editingMatch)}
        match={editingMatch}
        saving={savingEdit}
        onConfirm={handleEditMatchConfirm}
        onCancel={() => { if (!savingEdit) setEditingMatch(null); }}
      />
    </DashboardLayout>
  );
}