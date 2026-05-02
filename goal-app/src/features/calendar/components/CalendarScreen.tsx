/**
 * CalendarScreen.tsx
 *
 * Pantalla principal del calendario de la liga.
 * Datos reales vía useCalendarData → calendarService → calendar.api.
 */

import React, { useRef, useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { ScrollEdgeButton } from '@/src/shared/components/navigation/ScrollEdgeButton';
import { routes } from '@/src/shared/config/routes';

// Cards fuente de verdad — no se crean nuevas
import { LiveMatchCard } from '@/src/features/matches/components/cards/LiveMatchCard';
import { ProgrammedMatchCard } from '@/src/features/matches/components/cards/ProgrammedMatchCard';
import { FinishedMatchCard } from '@/src/features/matches/components/cards/FinishedMatchCard';

// Permisos para las cards (contrato de dashboardService)
import { getDashboardPermissions } from '@/src/features/dashboard/services/dashboardService';

// Pantallas de equipos y clasificación — reutilizadas como contenido de tab
import { TeamsScreen } from '@/src/features/teams/components/TeamsScreen';
import { ClassificationScreen } from '@/src/features/teams/components/ClassificationScreen';

// Sesión activa y hook de datos del calendario
import { useActiveLeague } from '@/src/state/activeLeague/activeLeagueStore';
import { useCalendarData } from '../hooks/useCalendar';
import { calendarService } from '../services/calendarService';

// Equipos reales de la liga — para el selector de CreateManualMatchModal
import { useTeamsByLeague } from '@/src/features/teams/hooks/useTeams';

// Service de partidos — crear partido manual
import { createManualMatchService } from '@/src/features/matches/services/matchesService';

// Componentes propios del módulo
import { CalendarHeader } from './CalendarHeader';
import { CalendarMainTabs } from './CalendarMainTabs';
import { JourneyNavigator } from './JourneyNavigator';
import { JourneyStatusTabs } from './JourneyStatusTabs';
import { CalendarActionsMenu } from './CalendarActionsMenu';
import { CalendarConfigModal } from './modals/CalendarConfigModal';
import { CreateManualMatchModal } from './modals/CreateManualMatchModal';
// Modales operativos de partido — viven en matches para reutilización cross-feature
import { RegisterEventModal } from '@/src/features/matches/components/modals/RegisterEventModal';
import { EndMatchModal } from '@/src/features/matches/components/modals/EndMatchModal';
import { StartMatchModal } from '@/src/features/matches/components/modals/StartMatchModal';
import { GoalEventModal } from '@/src/features/matches/components/modals/GoalEventModal';
import { YellowCardModal } from '@/src/features/matches/components/modals/YellowCardModal';
import { RedCardModal } from '@/src/features/matches/components/modals/RedCardModal';
import { SubstitutionModal } from '@/src/features/matches/components/modals/SubstitutionModal';
// Hook centralizado de estado/control de modales de partido
import { useMatchActionModals } from '@/src/features/matches/hooks/useMatchActionModals';

// Tipos y utilidades
import type {
  CalendarMainTab,
  CalendarMatch,
  CalendarMatchStatus,
  CalendarRole,
  JourneyStatusFilter,
} from '../types/calendar.types';
import {
  filterMatchesByStatus,
  countMatchesByStatus,
  getCalendarPermissions,
} from '../utils/calendarFilters';
import type { CalendarConfigData } from './modals/CalendarConfigModal';
import type { CreateManualMatchFormData } from './modals/CreateManualMatchModal';


// ---------------------------------------------------------------------------
// Adaptadores CalendarMatch → tipos de cada card
// ---------------------------------------------------------------------------

function toLiveData(m: CalendarMatch) {
  return {
    id: m.id,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    homeScore: m.homeScore ?? 0,
    awayScore: m.awayScore ?? 0,
    minute: m.minute ?? 0,
    leagueName: m.leagueName,
    venue: m.venue,
    homeShieldLetter: m.homeShieldLetter,
    awayShieldLetter: m.awayShieldLetter,
    homeColor: m.homeColor,
    awayColor: m.awayColor,
  };
}

function toProgrammedData(m: CalendarMatch) {
  return {
    id: m.id,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    day: m.day ?? '',
    month: m.month ?? '',
    time: m.time ?? '',
    round: m.round,
    venue: m.venue,
    homeColor: m.homeColor,
    awayColor: m.awayColor,
  };
}

function toFinishedData(m: CalendarMatch) {
  return {
    id: m.id,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    homeScore: m.homeScore ?? 0,
    awayScore: m.awayScore ?? 0,
    date: m.date ?? '',
    round: m.round,
    leagueName: m.leagueName,
    venue: m.venue,
    homeColor: m.homeColor,
    awayColor: m.awayColor,
    homeShieldLetter: m.homeShieldLetter,
    awayShieldLetter: m.awayShieldLetter,
  };
}

// ---------------------------------------------------------------------------
// Empty states
// ---------------------------------------------------------------------------

function EmptyNoTeams({ canAddTeam, onAddTeam }: { canAddTeam: boolean; onAddTeam?: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: Colors.bg.surface1,
          borderWidth: 1,
          borderColor: Colors.bg.surface2,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <Ionicons name="people-outline" size={32} color={Colors.text.disabled} />
      </View>
      <Text
        style={{
          color: Colors.text.primary,
          fontSize: theme.fontSize.lg,
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: 10,
        }}
      >
        Crea equipos para empezar
      </Text>
      <Text
        style={{
          color: Colors.text.secondary,
          fontSize: theme.fontSize.sm,
          textAlign: 'center',
          lineHeight: 20,
          marginBottom: 28,
        }}
      >
        Antes de generar el calendario necesitas añadir los equipos de la liga.
      </Text>
      {canAddTeam && (
        <Pressable
          onPress={onAddTeam}
          style={{
            backgroundColor: Colors.brand.primary,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: theme.borderRadius.full,
          }}
        >
          <Text style={{ color: Colors.bg.base, fontWeight: '700', fontSize: theme.fontSize.sm }}>
            Añadir equipo
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function EmptyNoCalendar({
  canCreateCalendar,
  canAddMatch,
  onCreateCalendar,
  onAddMatch,
}: {
  canCreateCalendar: boolean;
  canAddMatch: boolean;
  onCreateCalendar?: () => void;
  onAddMatch?: () => void;
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: Colors.bg.surface1,
          borderWidth: 1,
          borderColor: Colors.bg.surface2,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <Ionicons name="calendar-outline" size={32} color={Colors.text.disabled} />
      </View>
      <Text
        style={{
          color: Colors.text.primary,
          fontSize: theme.fontSize.lg,
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: 10,
        }}
      >
        Calendario pendiente
      </Text>
      <Text
        style={{
          color: Colors.text.secondary,
          fontSize: theme.fontSize.sm,
          textAlign: 'center',
          lineHeight: 20,
          marginBottom: 28,
        }}
      >
        Genera el calendario automático o añade partidos manualmente.
      </Text>
      {(canCreateCalendar || canAddMatch) && (
        <View style={{ gap: 12, width: '100%' }}>
          {canCreateCalendar && (
            <Pressable
              onPress={onCreateCalendar}
              style={{
                backgroundColor: Colors.brand.primary,
                paddingVertical: 13,
                borderRadius: theme.borderRadius.full,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: Colors.bg.base, fontWeight: '700', fontSize: theme.fontSize.sm }}>
                Crear calendario
              </Text>
            </Pressable>
          )}
          {canAddMatch && (
            <Pressable
              onPress={onAddMatch}
              style={{
                paddingVertical: 13,
                borderRadius: theme.borderRadius.full,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: Colors.bg.surface2,
              }}
            >
              <Text style={{ color: Colors.text.primary, fontWeight: '600', fontSize: theme.fontSize.sm }}>
                Nuevo partido
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

function EmptyFilterState({ filter }: { filter: JourneyStatusFilter }) {
  const labels: Record<JourneyStatusFilter, string> = {
    live: 'partidos en vivo',
    programmed: 'partidos programados',
    finished: 'partidos finalizados',
  };
  return (
    <View style={{ paddingVertical: 48, alignItems: 'center' }}>
      <Ionicons name="calendar-outline" size={36} color={Colors.text.disabled} />
      <Text
        style={{
          color: Colors.text.disabled,
          fontSize: theme.fontSize.sm,
          marginTop: 12,
          textAlign: 'center',
        }}
      >
        No hay {labels[filter]} en esta jornada
      </Text>
    </View>
  );
}

function PlaceholderTab({ label }: { label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <Ionicons name="construct-outline" size={36} color={Colors.text.disabled} />
      <Text
        style={{
          color: Colors.text.disabled,
          fontSize: theme.fontSize.sm,
          marginTop: 12,
          textAlign: 'center',
        }}
      >
        {label} disponible próximamente
      </Text>
    </View>
  );
}

function ManualMatchBadge() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
        marginBottom: 4,
        marginLeft: 20,
      }}
    >
      <Ionicons name="create-outline" size={11} color={Colors.text.disabled} />
      <Text style={{ color: Colors.text.disabled, fontSize: 10 }}>Partido manual</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// CalendarScreen
// ---------------------------------------------------------------------------

export function CalendarScreen() {
  const router = useRouter();
  // Param opcional desde navegación externa (ej: Dashboard > "Ver calendario")
  const { filter: filterParam } = useLocalSearchParams<{ filter?: string }>();

  // ── Sesión y liga activa ──
  const { session } = useActiveLeague();
  const ligaId = session?.leagueId ? Number(session.leagueId) : 0;
  const leagueName = session?.leagueName ?? '–';
  const role = (session?.role ?? 'observer') as CalendarRole;

  // ── Datos reales del calendario ──
  const {
    journeys,
    viewState,
    isLoading: isLoadingJourneys,
    isRefetching: isRefetchingJourneys,
    refetch: refetchJourneys,
  } = useCalendarData(ligaId, leagueName);

  // ── Equipos reales de la liga para el selector de partido manual ──
  const { data: teamsData } = useTeamsByLeague(ligaId);
  // Mapeados a SelectOption para el modal
  const teamOptions = teamsData.map((t) => ({
    value: String(t.id_equipo),
    label: t.nombre,
  }));

  // ── Estado de UI ──
  const [activeTab, setActiveTab] = useState<CalendarMainTab>('journey');
  const [journeyIndex, setJourneyIndex] = useState(0);
  const [statusFilter, setStatusFilter] = useState<JourneyStatusFilter>('live');

  // Cuando se navega desde el dashboard con filter=programmed, activar ese filtro
  useEffect(() => {
    if (filterParam === 'programmed') setStatusFilter('programmed');
  }, [filterParam]);

  // ── Estado de modales ──
  const [menuVisible, setMenuVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [calendarModalMode, setCalendarModalMode] = useState<'create' | 'edit'>('create');
  const [calendarModalError, setCalendarModalError] = useState<string | undefined>(undefined);
  const [calendarModalSubmitting, setCalendarModalSubmitting] = useState(false);
  const [newMatchModalVisible, setNewMatchModalVisible] = useState(false);
  const [newMatchError, setNewMatchError] = useState<string | undefined>(undefined);
  const [newMatchSubmitting, setNewMatchSubmitting] = useState(false);

  // Modales de acción sobre partidos — estado centralizado en el hook
  const {
    modals,
    activeEventMatch,
    activeEndMatch,
    activeStartMatch,
    openRegisterEvent,
    openStartMatch,
    openEndMatch,
    modalProps,
  } = useMatchActionModals();

  // ── Scroll ──
  const scrollRef = useRef<ScrollView | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  // ── Permisos derivados del rol real ──
  const calendarPerms = getCalendarPermissions(role);
  // DashboardPermissions para las cards de partido
  const dashPerms = getDashboardPermissions(role);

  // ── Jornada activa ──
  const activeJourney = journeys[journeyIndex];
  const filteredMatches = activeJourney
    ? filterMatchesByStatus(activeJourney.matches, statusFilter)
    : [];
  const matchCounts = activeJourney
    ? countMatchesByStatus(activeJourney.matches)
    : { live: 0, programmed: 0, finished: 0 };

  const activeRound = activeJourney ? `Jornada ${activeJourney.number}` : '';

  // Resetear índice al inicio cuando cambia la liga o el número de jornadas
  // No usar [journeys] porque cambia referencia en cada render
  useEffect(() => {
    setJourneyIndex(0);
  }, [ligaId, journeys.length]);

  // ── Handlers de jornada ──
  const handlePrevJourney = () => {
    if (journeyIndex > 0) setJourneyIndex((i) => i - 1);
  };
  const handleNextJourney = () => {
    if (journeyIndex < journeys.length - 1) setJourneyIndex((i) => i + 1);
  };

  // ── Handlers del menú de admin ──
  const handleMenuPress = () => setMenuVisible(true);

  const handleOpenCreateCalendar = () => {
    setMenuVisible(false);
    setCalendarModalMode('create');
    setCalendarModalError(undefined);
    setCalendarModalVisible(true);
  };

  const handleOpenEditCalendar = () => {
    setMenuVisible(false);
    setCalendarModalMode('edit');
    setCalendarModalError(undefined);
    setCalendarModalVisible(true);
  };

  const handleOpenAddMatch = () => {
    setMenuVisible(false);
    setNewMatchModalVisible(true);
  };

  // ── Handlers de acciones en jornada ──
  const handleAddMatch = () => setNewMatchModalVisible(true);

  const handleAddTeam = () => {
    // TODO: navegar a la pantalla de creación de equipo
    // router.push(routes.private.league.team.detail as never);
  };

  // ── Confirm de modales ──
  const handleCalendarConfigConfirm = async (data: CalendarConfigData) => {
    if (calendarModalMode !== 'create') {
      setCalendarModalVisible(false);
      return;
    }
    setCalendarModalError(undefined);
    setCalendarModalSubmitting(true);
    const result = await calendarService.createCalendar(ligaId, {
      type: data.type,
      startDate: data.startDate,
      matchDays: data.matchDays,
      matchTime: data.matchTime,
    });
    setCalendarModalSubmitting(false);
    if (result.success) {
      setCalendarModalVisible(false);
      refetchJourneys();
    } else {
      // El modal permanece abierto y muestra el error
      setCalendarModalError(result.error);
    }
  };

  const handleNewMatchConfirm = async (data: CreateManualMatchFormData) => {
    if (ligaId <= 0) return;

    // Número de jornada: preferir backendNumber (real) sobre number (visual)
    const activeJornada = journeys[journeyIndex];
    const jornadaNum = activeJornada?.backendNumber ?? activeJornada?.number ?? 1;

    // Combinar fecha + hora en ISO: YYYY-MM-DDTHH:MM:00
    // TODO API: si el backend requiere UTC, ajustar conversión aquí
    const fechaHora = `${data.date}T${data.time}:00`;

    setNewMatchError(undefined);
    setNewMatchSubmitting(true);

    const result = await createManualMatchService(ligaId, {
      id_equipo_local: parseInt(data.homeTeamId, 10),
      id_equipo_visitante: parseInt(data.awayTeamId, 10),
      fecha_hora: fechaHora,
      estadio: data.stadium || undefined,
      numero_jornada: jornadaNum,
    });

    setNewMatchSubmitting(false);

    if (result.success) {
      setNewMatchModalVisible(false);
      setNewMatchError(undefined);
      // Refrescar calendario para mostrar el partido real
      refetchJourneys();
    } else {
      // Mantener modal abierto y mostrar error
      setNewMatchError(result.error ?? 'Error al crear el partido');
    }
  };

  // ── Navegación al detalle de partido ──
  const handleMatchPress = (matchId: string, status: CalendarMatchStatus) => {
    if (status === 'live') {
      router.push(routes.private.matchRoutes.live.detail(matchId) as never);
      return;
    }
    if (status === 'programmed') {
      router.push(routes.private.matchRoutes.programmed.detail(matchId) as never);
      return;
    }
    if (status === 'finished') {
      router.push(routes.private.matchRoutes.finished.detail(matchId) as never);
    }
  };

  // ── Helpers para encontrar un partido en cualquier jornada ──
  const findMatch = (matchId: string): CalendarMatch | undefined => {
    for (const journey of journeys) {
      const found = journey.matches.find((m) => m.id === matchId);
      if (found) return found;
    }
    return undefined;
  };

  // Adapta un CalendarMatch al contexto que necesita openRegisterEvent
  const handleRegisterEvent = (matchId: string) => {
    const match = findMatch(matchId);
    if (!match) return;
    openRegisterEvent({
      id: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeScore: match.homeScore ?? 0,
      awayScore: match.awayScore ?? 0,
      minute: match.minute ?? 0,
    });
  };

  const handleEndMatch = (matchId: string) => {
    const match = findMatch(matchId);
    if (!match) return;
    openEndMatch({
      id: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeScore: match.homeScore ?? 0,
      awayScore: match.awayScore ?? 0,
    });
  };

  const handleStartMatch = (matchId: string) => {
    const match = findMatch(matchId);
    if (!match) return;
    openStartMatch({
      id: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      date: match.date,
      time: match.time,
      venue: match.venue,
    });
  };

  // ── Render: contenido de la tab Jornada ──
  const renderJourneyContent = () => {
    if (isLoadingJourneys) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
          <ActivityIndicator color={Colors.brand.primary} size="large" />
        </View>
      );
    }

    if (viewState === 'no_teams') {
      return (
        <EmptyNoTeams
          canAddTeam={calendarPerms.canAddMatch}
          onAddTeam={handleAddTeam}
        />
      );
    }

    if (viewState === 'no_calendar') {
      return (
        <EmptyNoCalendar
          canCreateCalendar={calendarPerms.canCreateCalendar}
          canAddMatch={calendarPerms.canAddMatch}
          onCreateCalendar={handleOpenCreateCalendar}
          onAddMatch={handleAddMatch}
        />
      );
    }

    // has_calendar
    return (
      <>
        <JourneyNavigator
          journeyNumber={activeJourney.number}
          totalJourneys={journeys.length}
          season="–"
          onPrev={handlePrevJourney}
          onNext={handleNextJourney}
        />

        <JourneyStatusTabs
          activeFilter={statusFilter}
          counts={matchCounts}
          onFilterChange={setStatusFilter}
        />

        {/* Acción rápida de admin: añadir partido a la jornada */}
        {calendarPerms.canAddMatch && (
          <Pressable
            onPress={handleAddMatch}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              alignSelf: 'flex-end',
              marginRight: theme.spacing.lg,
              marginBottom: theme.spacing.sm,
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: theme.borderRadius.full,
              borderWidth: 1,
              borderColor: Colors.bg.surface2,
            }}
          >
            <Ionicons name="add" size={14} color={Colors.text.secondary} />
            <Text style={{ color: Colors.text.secondary, fontSize: 12, fontWeight: '500' }}>
              Nuevo partido
            </Text>
          </Pressable>
        )}

        {/* Lista de partidos filtrada */}
        <View style={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl }}>
          {filteredMatches.length === 0 ? (
            <EmptyFilterState filter={statusFilter} />
          ) : (
            filteredMatches.map((match) => {
              if (match.status === 'live') {
                return (
                  <View key={match.id}>
                    <LiveMatchCard
                      match={toLiveData(match)}
                      permissions={dashPerms}
                      onRegisterEvent={handleRegisterEvent}
                      onEndMatch={handleEndMatch}
                    />
                    {match.source === 'manual' && <ManualMatchBadge />}
                  </View>
                );
              }

              if (match.status === 'programmed') {
                return (
                  <View key={match.id}>
                    <ProgrammedMatchCard
                      match={toProgrammedData(match)}
                      permissions={dashPerms}
                      onPress={() => handleMatchPress(match.id, match.status)}
                      onStartMatch={() => handleStartMatch(match.id)}
                    />
                    {match.source === 'manual' && <ManualMatchBadge />}
                  </View>
                );
              }

              if (match.status === 'finished') {
                return (
                  <View key={match.id}>
                    <FinishedMatchCard
                      match={toFinishedData(match)}
                      onPress={() => handleMatchPress(match.id, match.status)}
                    />
                    {match.source === 'manual' && <ManualMatchBadge />}
                  </View>
                );
              }

              return null;
            })
          )}
        </View>
      </>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg.base }}>
      {/* ── Header premium ── */}
      <CalendarHeader
        leagueName={leagueName}
        season="–"
        // TODO: pasar logo real cuando el store incluya crestUrl de la liga activa
        hasMultipleSeasons={false}
        onMenuPress={handleMenuPress}
      />

      {/* ── Tabs principales ── */}
      <CalendarMainTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* ── Contenido según tab activa ── */}
      {activeTab === 'teams' ? (
        <TeamsScreen embedded />
      ) : activeTab === 'classification' ? (
        <ClassificationScreen embedded />
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetchingJourneys}
                onRefresh={refetchJourneys}
                tintColor={Colors.brand.primary}
              />
            }
            onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
            scrollEventThrottle={16}
            onContentSizeChange={(_, h) => setContentHeight(h)}
            onLayout={(e) => setViewportHeight(e.nativeEvent.layout.height)}
          >
            {renderJourneyContent()}
          </ScrollView>

          <ScrollEdgeButton
            scrollRef={scrollRef}
            scrollY={scrollY}
            contentHeight={contentHeight}
            viewportHeight={viewportHeight}
          />
        </View>
      )}

      {/* ── Modales ── */}

      {/* Menú de acciones de admin (desde el header) */}
      <CalendarActionsMenu
        visible={menuVisible}
        permissions={calendarPerms}
        onClose={() => setMenuVisible(false)}
        onCreateCalendar={handleOpenCreateCalendar}
        onEditCalendar={handleOpenEditCalendar}
        onAddMatch={handleOpenAddMatch}
      />

      {/* Modal crear / editar calendario */}
      <CalendarConfigModal
        visible={calendarModalVisible}
        mode={calendarModalMode}
        error={calendarModalError}
        isSubmitting={calendarModalSubmitting}
        onConfirm={handleCalendarConfigConfirm}
        onCancel={() => { setCalendarModalVisible(false); setCalendarModalError(undefined); }}
      />

      {/* Modal nuevo partido manual — fuente de verdad única: CreateManualMatchModal */}
      <CreateManualMatchModal
        visible={newMatchModalVisible}
        defaultRound={activeRound}
        teamOptions={teamOptions}
        error={newMatchError}
        isSubmitting={newMatchSubmitting}
        onSubmit={handleNewMatchConfirm}
        onClose={() => { setNewMatchModalVisible(false); setNewMatchError(undefined); }}
      />

      {/* ── Modales operativos de partido — estado gestionado por useMatchActionModals ── */}

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
    </View>
  );
}
