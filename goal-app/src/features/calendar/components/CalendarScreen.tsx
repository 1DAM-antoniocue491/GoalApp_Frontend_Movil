/**
 * CalendarScreen.tsx
 *
 * Pantalla principal del calendario de la liga.
 * Datos reales vía useCalendarData → calendarService → calendar.api.
 *
 * Regla importante:
 * esta pantalla solo coordina UI, navegación, modales y permisos.
 * La normalización de datos del backend vive en calendarService para evitar
 * duplicar mapeos o reglas en los componentes visuales.
 */

import React, { useRef, useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, Alert } from 'react-native';
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
import { CreateTeamModal } from '@/src/features/teams/components/modals/CreateTeamModal';

// Sesión activa y hook de datos del calendario
import { useActiveLeague } from '@/src/state/activeLeague/activeLeagueStore';
import { useCalendarData } from '../hooks/useCalendar';
import { calendarService } from '../services/calendarService';

// Equipos reales de la liga — para el selector de CreateManualMatchModal
import { useTeamsByLeague } from '@/src/features/teams/hooks/useTeams';

// Service de partidos — crear partido manual
import {
  buildApiDateTime,
  createManualMatchService,
  updateScheduledMatchService,
} from '@/src/features/matches/services/matchesService';

// Componentes propios del módulo
import { CalendarHeader } from './CalendarHeader';
import { CalendarMainTabs } from './CalendarMainTabs';
import { JourneyNavigator } from './JourneyNavigator';
import { JourneyStatusTabs } from './JourneyStatusTabs';
import { CalendarActionsMenu, type CalendarMenuState } from './CalendarActionsMenu';
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
import { EditScheduledMatchModal, type EditScheduledMatchData } from '@/src/features/matches/components/modals/EditScheduledMatchModal';
// Hook centralizado de estado/control de modales de partido
import { useMatchActionModals } from '@/src/features/matches/hooks/useMatchActionModals';
import { emitMatchDataChanged } from '@/src/features/matches/services/matchSync';

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
import type { CreateCalendarInput } from '../services/calendarService';
import type { CreateManualMatchFormData } from './modals/CreateManualMatchModal';
import type { PartidoApi } from '@/src/features/matches/types/matches.types';


// ---------------------------------------------------------------------------
// Adaptadores CalendarMatch → tipos de cada card
// ---------------------------------------------------------------------------
// Las cards de partidos ya existen en el módulo matches y tienen su propio contrato.
// Estos adaptadores aíslan ese contrato para que CalendarMatch pueda evolucionar
// sin obligar a modificar LiveMatchCard, ProgrammedMatchCard o FinishedMatchCard.

function toLiveData(m: CalendarMatch) {
  return {
    id: m.id,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    homeScore: m.homeScore ?? 0,
    awayScore: m.awayScore ?? 0,
    minute: Math.max(1, m.minute ?? 1),
    duration: m.duration ?? 90,
    startedAt: m.startedAt ?? null,
    homeTeamId: m.homeTeamId ?? undefined,
    awayTeamId: m.awayTeamId ?? undefined,
    eventsLocked: (m.minute ?? 1) >= (m.duration ?? 90),
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
    startsAt: m.startedAt ?? null,
    rawDate: m.startedAt ?? null,
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
        Antes de generar el calendario necesitas añadir los equipos de la liga. Usa el menú de los tres puntos para crear uno nuevo.
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
        Genera el calendario automático o añade partidos manualmente desde el menú de los tres puntos.
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
  const {
    filter: filterParam,
    status: statusParam,
    tab: tabParam,
  } = useLocalSearchParams<{ filter?: string; status?: string; tab?: string }>();

  // ── Sesión y liga activa ──
  const { session } = useActiveLeague();
  const ligaId = session?.leagueId ? Number(session.leagueId) : 0;
  const leagueName = session?.leagueName ?? '–';
  const temporada = session?.temporada ?? '–';
  const role = (session?.role ?? 'observer') as CalendarRole;
  // Único rol con acceso al menú contextual del calendario.
  // Los roles no administradores no deben ver los tres puntos ni poder abrir acciones de gestión.
  const isAdmin = role === 'admin';

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

  // Navegación externa: permite abrir Calendario directamente en Jornada > Programados.
  useEffect(() => {
    if (tabParam === 'journey') setActiveTab('journey');

    const requestedStatus = statusParam ?? filterParam;
    if (
      requestedStatus === 'live' ||
      requestedStatus === 'programmed' ||
      requestedStatus === 'finished'
    ) {
      setStatusFilter(requestedStatus);
    }
  }, [filterParam, statusParam, tabParam]);

  // ── Estado de modales ──
  const [menuVisible, setMenuVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [calendarModalMode, setCalendarModalMode] = useState<'create' | 'edit'>('create');
  const [calendarModalError, setCalendarModalError] = useState<string | undefined>(undefined);
  const [calendarModalSubmitting, setCalendarModalSubmitting] = useState(false);
  const [calendarModalInitialData, setCalendarModalInitialData] = useState<Partial<CreateCalendarInput> | undefined>(undefined);
  const [newMatchModalVisible, setNewMatchModalVisible] = useState(false);
  const [newMatchError, setNewMatchError] = useState<string | undefined>(undefined);
  const [newMatchSubmitting, setNewMatchSubmitting] = useState(false);
  const [createTeamVisible, setCreateTeamVisible] = useState(false);
  const [editingMatch, setEditingMatch] = useState<PartidoApi | null>(null);
  const [editMatchSubmitting, setEditMatchSubmitting] = useState(false);

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
  } = useMatchActionModals(refetchJourneys);

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

  // ── Estado del calendario para el menú — 3 estados igual que la web ──
  // Los partidos manuales NO cuentan como calendario generado.
  // Esta bandera controla que "Editar calendario" solo aparezca cuando existe
  // calendario automático creado desde CalendarConfigModal/API.
  const hasGeneratedCalendar = journeys.some((j) =>
    j.matches.some((m) => m.source === 'automatic'),
  );

  const hasMatchesInPlayOrFinished = journeys.some((j) =>
    j.matches.some((m) => m.status === 'live' || m.status === 'finished'),
  );
  const calendarMenuState: CalendarMenuState =
    viewState === 'no_calendar'
      ? 'no_calendar'
      : hasMatchesInPlayOrFinished
        ? 'locked'
        : 'editable';

  // ── Handlers del menú de admin ──
  const handleMenuPress = () => {
    // Defensa extra: aunque el botón se oculte en CalendarHeader,
    // nunca abrimos el menú si la sesión actual no es administradora.
    if (!isAdmin) return;
    setMenuVisible(true);
  };

  const handleOpenCreateCalendar = () => {
    setMenuVisible(false);
    setCalendarModalInitialData(undefined);
    setCalendarModalMode('create');
    setCalendarModalError(undefined);
    // setTimeout evita conflicto de Modals en Android al cerrar uno y abrir otro
    setTimeout(() => setCalendarModalVisible(true), 150);
  };

  const handleOpenEditCalendar = async () => {
    setMenuVisible(false);
    setCalendarModalError(undefined);
    // Cargar configuración actual para precargar el formulario
    const result = await calendarService.fetchCalendarConfig(ligaId);
    if (result.success && result.data) {
      setCalendarModalInitialData(result.data);
    } else {
      setCalendarModalInitialData(undefined);
    }
    setCalendarModalMode('edit');
    setTimeout(() => setCalendarModalVisible(true), 150);
  };

  const handleOpenDeleteCalendar = () => {
    setMenuVisible(false);
    // Confirmación nativa antes de eliminar
    setTimeout(() => {
      Alert.alert(
        'Eliminar calendario',
        'Se eliminarán todos los partidos y jornadas. Esta acción no se puede deshacer.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              const result = await calendarService.deleteCalendar(ligaId);
              if (result.success) {
                refetchJourneys();
              } else {
                Alert.alert('Error', result.error ?? 'No se pudo eliminar el calendario.');
              }
            },
          },
        ],
      );
    }, 200);
  };

  const handleOpenAddMatch = () => {
    setMenuVisible(false);
    setTimeout(() => setNewMatchModalVisible(true), 150);
  };

  const handleOpenAddTeam = () => {
    setMenuVisible(false);
    setTimeout(() => setCreateTeamVisible(true), 150);
  };

  // ── Handlers de acciones en jornada ──


  // ── Confirm de modales ──
  /**
   * Crea o regenera el calendario desde el mismo formulario.
   * El modo activo decide si se llama al endpoint de creación o al de edición.
   */
  const handleCalendarConfigConfirm = async (data: CalendarConfigData) => {
    setCalendarModalError(undefined);
    setCalendarModalSubmitting(true);

    const input: CreateCalendarInput = {
      type: data.type,
      startDate: data.startDate,
      matchDays: data.matchDays,
      matchTime: data.matchTime,
    };

    const result = calendarModalMode === 'create'
      ? await calendarService.createCalendar(ligaId, input)
      : await calendarService.updateCalendar(ligaId, input);

    setCalendarModalSubmitting(false);
    if (result.success) {
      setCalendarModalVisible(false);
      refetchJourneys();
    } else {
      // El modal permanece abierto y muestra el error
      setCalendarModalError(result.error);
    }
  };

  /**
   * Crea un partido manual sin marcarlo como calendario automático.
   * Esto permite añadir partidos sueltos sin desbloquear opciones de editar/eliminar calendario.
   */
  const handleNewMatchConfirm = async (data: CreateManualMatchFormData) => {
    if (ligaId <= 0) return;


    // Convert local time to UTC so the backend (UTC+2) displays the correct hour
    const fechaHora = buildApiDateTime(data.date, data.time);

    setNewMatchError(undefined);
    setNewMatchSubmitting(true);

    const result = await createManualMatchService({
      id_liga: ligaId,
      id_equipo_local: parseInt(data.homeTeamId, 10),
      id_equipo_visitante: parseInt(data.awayTeamId, 10),
      // Payload alineado con web: POST /partidos/ espera `fecha`.
      fecha: fechaHora,
      // Si el backend decide aceptar jornada manual, el service ya soporta id_jornada.
      // No la enviamos por defecto para mantener paridad con web.
    });

    setNewMatchSubmitting(false);

    if (result.success) {
      setNewMatchModalVisible(false);
      setNewMatchError(undefined);
      // Refrescar calendario para mostrar el partido real y abrir Programados.
      setActiveTab('journey');
      setStatusFilter('programmed');
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
      minute: Math.max(1, match.minute ?? 1),
      duration: match.duration ?? 90,
      startedAt: match.startedAt ?? null,
      homeTeamId: match.homeTeamId ?? undefined,
      awayTeamId: match.awayTeamId ?? undefined,
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
      homeTeamId: match.homeTeamId ?? undefined,
      awayTeamId: match.awayTeamId ?? undefined,
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

  const handleEditMatch = (matchId: string) => {
    const match = findMatch(matchId);
    if (!match || match.status !== 'programmed') return;

    setEditingMatch({
      id_partido: Number(match.id),
      id_liga: ligaId,
      id_equipo_local: match.homeTeamId ?? undefined,
      id_equipo_visitante: match.awayTeamId ?? undefined,
      fecha_hora: match.startedAt ?? null,
      estadio: match.venue,
      estado: 'programado',
      goles_local: match.homeScore ?? 0,
      goles_visitante: match.awayScore ?? 0,
      equipo_local: {
        id_equipo: match.homeTeamId ?? undefined,
        nombre: match.homeTeam,
        color_primario: match.homeColor ?? null,
      },
      equipo_visitante: {
        id_equipo: match.awayTeamId ?? undefined,
        nombre: match.awayTeam,
        color_primario: match.awayColor ?? null,
      },
    } as PartidoApi);
  };

  const handleEditMatchConfirm = async (payload: EditScheduledMatchData) => {
    if (!editingMatch || editMatchSubmitting) return;

    setEditMatchSubmitting(true);
    const result = await updateScheduledMatchService(editingMatch.id_partido, payload);
    setEditMatchSubmitting(false);

    if (!result.success) {
      Alert.alert('No se pudo editar el partido', result.error ?? 'Inténtalo de nuevo.');
      return;
    }

    setEditingMatch(null);
    setActiveTab('journey');
    setStatusFilter('programmed');
    emitMatchDataChanged();
    refetchJourneys();
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
          canAddTeam={false}
        />
      );
    }

    if (viewState === 'no_calendar') {
      return (
        <EmptyNoCalendar
          canCreateCalendar={false}
          canAddMatch={false}
        />
      );
    }

    // has_calendar
    return (
      <>
        <JourneyNavigator
          journeyNumber={activeJourney.number}
          totalJourneys={journeys.length}
          season={temporada}
          onPrev={handlePrevJourney}
          onNext={handleNextJourney}
        />

        <JourneyStatusTabs
          activeFilter={statusFilter}
          counts={matchCounts}
          onFilterChange={setStatusFilter}
        />

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
                      actionsDisabled={modalProps.pending.any}
                      onRegisterEvent={dashPerms.canRegisterEvent ? handleRegisterEvent : undefined}
                      onEndMatch={dashPerms.canEndMatch ? handleEndMatch : undefined}
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
                      onStartMatch={dashPerms.canStartMatch ? () => handleStartMatch(match.id) : undefined}
                      onEditMatch={dashPerms.canEditMatch ? () => handleEditMatch(match.id) : undefined}
                      actionsDisabled={modalProps.pending.any || editMatchSubmitting}
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
        season={temporada}
        //  pasar logo real cuando el store incluya crestUrl de la liga activa
        hasMultipleSeasons={false}
        // Ocultamos por completo los tres puntos a cualquier rol que no sea administrador.
        showMenu={isAdmin}
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
      {isAdmin && (
        <CalendarActionsMenu
          visible={menuVisible}
          permissions={calendarPerms}
          calendarMenuState={calendarMenuState}
          hasGeneratedCalendar={hasGeneratedCalendar}
          onClose={() => setMenuVisible(false)}
          onCreateCalendar={handleOpenCreateCalendar}
          onEditCalendar={handleOpenEditCalendar}
          onDeleteCalendar={handleOpenDeleteCalendar}
          onAddMatch={handleOpenAddMatch}
          onAddTeam={calendarPerms.canAddMatch ? handleOpenAddTeam : undefined}
        />
      )}

      {/* Modal crear / editar calendario */}
      <CalendarConfigModal
        visible={calendarModalVisible}
        mode={calendarModalMode}
        initialData={calendarModalInitialData}
        error={calendarModalError}
        isSubmitting={calendarModalSubmitting}
        onConfirm={handleCalendarConfigConfirm}
        onCancel={() => { setCalendarModalVisible(false); setCalendarModalError(undefined); }}
      />

      {/* Modal crear equipo desde menú de calendario */}
      <CreateTeamModal
        visible={createTeamVisible}
        ligaId={ligaId}
        onClose={() => setCreateTeamVisible(false)}
        onCreated={() => {
          setCreateTeamVisible(false);
          refetchJourneys();
        }}
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

      <EditScheduledMatchModal
        visible={Boolean(editingMatch)}
        match={editingMatch}
        saving={editMatchSubmitting}
        onConfirm={handleEditMatchConfirm}
        onCancel={() => { if (!editMatchSubmitting) setEditingMatch(null); }}
      />

      {/* ── Modales operativos: solo se montan para roles con acceso ── */}

      {dashPerms.canRegisterEvent && (
        <>
          <RegisterEventModal
            visible={modals.registerEvent}
            match={activeEventMatch}
            onSelectEvent={modalProps.onSelectEvent}
            onCancel={modalProps.onCloseRegisterEvent}
            disabled={modalProps.pending.any}
          />
          <GoalEventModal
            visible={modals.goal}
            match={activeEventMatch}
            onConfirm={modalProps.onGoalConfirm}
            onCancel={modalProps.onCloseGoal}
            submitting={modalProps.pending.any}
          />
          <YellowCardModal
            visible={modals.yellowCard}
            match={activeEventMatch}
            onConfirm={modalProps.onYellowCardConfirm}
            onCancel={modalProps.onCloseYellowCard}
            submitting={modalProps.pending.any}
          />
          <RedCardModal
            visible={modals.redCard}
            match={activeEventMatch}
            onConfirm={modalProps.onRedCardConfirm}
            onCancel={modalProps.onCloseRedCard}
            submitting={modalProps.pending.any}
          />
          <SubstitutionModal
            visible={modals.substitution}
            match={activeEventMatch}
            onConfirm={modalProps.onSubstitutionConfirm}
            onCancel={modalProps.onCloseSubstitution}
            submitting={modalProps.pending.any}
          />
        </>
      )}

      {dashPerms.canEndMatch && (
        <EndMatchModal
          visible={modals.endMatch}
          match={activeEndMatch}
          onConfirm={modalProps.onEndMatchConfirm}
          onCancel={modalProps.onCloseEndMatch}
          submitting={modalProps.pending.any}
        />
      )}

      {dashPerms.canStartMatch && (
        <StartMatchModal
          visible={modals.startMatch}
          match={activeStartMatch}
          onConfirm={modalProps.onStartMatchConfirm}
          onCancel={modalProps.onCloseStartMatch}
          isSubmitting={modalProps.pending.any}
        />
      )}
    </View>
  );
}
