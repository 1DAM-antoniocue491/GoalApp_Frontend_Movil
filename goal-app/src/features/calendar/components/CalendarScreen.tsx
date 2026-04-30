/**
 * CalendarScreen.tsx
 *
 * Pantalla principal del calendario de la liga.
 *
 * Gestiona:
 * - Estado de la vista (sin equipos / sin calendario / con calendario)
 * - Navegación entre jornadas
 * - Filtros de estado dentro de la jornada (en vivo / programados / finalizados)
 * - Renderizado de cards según el tipo de partido usando las fuentes de verdad
 * - Menú de acciones de admin (crear calendario, editar calendario, nuevo partido)
 * - Modales conectados: CalendarConfigModal, CreateManualMatchModal
 * - Navegación real al detalle de partido según su estado
 *
 * PREPARADO PARA API:
 * Sustituir `MOCK_JOURNEYS` y `viewState` por una llamada real desde
 * un hook como `useCalendarData(leagueId)` cuando el backend esté listo.
 */

import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

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
  CalendarJourney,
  CalendarMainTab,
  CalendarMatch,
  CalendarMatchStatus,
  CalendarViewState,
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
// Mock data — reemplazar por useCalendarData(leagueId) cuando el API esté listo
// ---------------------------------------------------------------------------

const MOCK_VIEW_STATE: CalendarViewState = 'has_calendar';

const MOCK_JOURNEYS: CalendarJourney[] = [
  {
    id: 'j10',
    number: 10,
    matches: [
      {
        id: 'j10-m1',
        homeTeam: 'Real Betis',
        awayTeam: 'Sevilla FC',
        status: 'live',
        source: 'automatic',
        homeScore: 2,
        awayScore: 1,
        minute: 68,
        round: 'Jornada 10',
        venue: 'Estadio Benito Villamarín',
        leagueName: 'Liga Sevilla Premier',
        homeColor: '#00A650',
        awayColor: '#D40E14',
        homeShieldLetter: 'B',
        awayShieldLetter: 'S',
      },
      {
        id: 'j10-m2',
        homeTeam: 'Athletic Club',
        awayTeam: 'Real Sociedad',
        status: 'programmed',
        source: 'automatic',
        day: '24',
        month: 'MAY',
        time: '18:00',
        round: 'Jornada 10',
        venue: 'Estadio San Mamés',
        leagueName: 'Liga Sevilla Premier',
        homeColor: '#C8102E',
        awayColor: '#0057A8',
      },
      {
        id: 'j10-m3',
        homeTeam: 'Valencia CF',
        awayTeam: 'Atlético Madrid',
        status: 'finished',
        source: 'automatic',
        homeScore: 1,
        awayScore: 3,
        date: '18 Abr',
        round: 'Jornada 10',
        venue: 'Estadio de Mestalla',
        leagueName: 'Liga Sevilla Premier',
        homeColor: '#FF8C00',
        awayColor: '#C8102E',
        homeShieldLetter: 'V',
        awayShieldLetter: 'A',
      },
    ],
  },
  {
    id: 'j11',
    number: 11,
    matches: [
      {
        id: 'j11-m1',
        homeTeam: 'Villarreal CF',
        awayTeam: 'Valencia CF',
        status: 'programmed',
        // Partido manual — no se sobreescribirá al generar el calendario automático
        source: 'manual',
        day: '25',
        month: 'MAY',
        time: '20:30',
        round: 'Jornada 11',
        venue: 'Estadio de la Cerámica',
        leagueName: 'Liga Sevilla Premier',
        homeColor: '#FFD700',
        awayColor: '#FF8C00',
      },
      {
        id: 'j11-m2',
        homeTeam: 'Atlético Madrid',
        awayTeam: 'Getafe CF',
        status: 'programmed',
        source: 'automatic',
        day: '26',
        month: 'MAY',
        time: '19:00',
        round: 'Jornada 11',
        venue: 'Civitas Metropolitano',
        leagueName: 'Liga Sevilla Premier',
        homeColor: '#C8102E',
        awayColor: '#005999',
      },
    ],
  },
];

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

  // ── Datos ──
  // TODO: reemplazar por datos reales de useCalendarData(leagueId)
  const viewState: CalendarViewState = MOCK_VIEW_STATE;
  const journeys = MOCK_JOURNEYS;

  // ── Estado de UI ──
  const [activeTab, setActiveTab] = useState<CalendarMainTab>('journey');
  const [journeyIndex, setJourneyIndex] = useState(0);
  const [statusFilter, setStatusFilter] = useState<JourneyStatusFilter>('live');

  // ── Estado de modales ──
  const [menuVisible, setMenuVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [calendarModalMode, setCalendarModalMode] = useState<'create' | 'edit'>('create');
  const [newMatchModalVisible, setNewMatchModalVisible] = useState(false);

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

  // ── Permisos ──
  // TODO: obtener rol real del store de sesión → const { role } = useSession()
  const role = 'admin' as const;
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
    setCalendarModalVisible(true);
  };

  const handleOpenEditCalendar = () => {
    setMenuVisible(false);
    setCalendarModalMode('edit');
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
  const handleCalendarConfigConfirm = (data: CalendarConfigData) => {
    setCalendarModalVisible(false);
    // TODO: llamar a POST /calendar/generate (mode === 'create')
    //       o PATCH /calendar/:id/config (mode === 'edit') con `data`
    console.log('[CalendarConfigModal] confirmed:', data);
  };

  const handleNewMatchConfirm = (data: CreateManualMatchFormData) => {
    setNewMatchModalVisible(false);
    // TODO: llamar a POST /matches con { ...data, source: 'manual', leagueId }
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
          season="2025-2026"
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
        leagueName="Liga Sevilla Premier"
        season="2025–2026"
        // TODO: reemplazar por el logo real de la liga activa desde el store
        leagueLogo={require('../../../../assets/images/liga.png')}
        hasMultipleSeasons={false}
        onMenuPress={handleMenuPress}
      />

      {/* ── Tabs principales ── */}
      <CalendarMainTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* ── Contenido según tab activa ── */}
      {activeTab === 'teams' ? (
        <PlaceholderTab label="Vista de equipos" />
      ) : activeTab === 'classification' ? (
        <PlaceholderTab label="Clasificación" />
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
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
        onConfirm={handleCalendarConfigConfirm}
        onCancel={() => setCalendarModalVisible(false)}
      />

      {/* Modal nuevo partido manual — fuente de verdad única: CreateManualMatchModal */}
      <CreateManualMatchModal
        visible={newMatchModalVisible}
        defaultRound={activeRound}
        onSubmit={handleNewMatchConfirm}
        onClose={() => setNewMatchModalVisible(false)}
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
