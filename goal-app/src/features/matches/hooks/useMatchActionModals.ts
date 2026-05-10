/**
 * useMatchActionModals.ts
 * Centraliza los modales operativos con API real y bloqueo anti-doble toque.
 */

import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import type { LiveMatchContext, MatchEventType } from '@/src/features/matches/components/modals/RegisterEventModal';
import type { LiveMatchSummary, EndMatchData } from '@/src/features/matches/components/modals/EndMatchModal';
import type { ProgrammedMatchContext } from '@/src/features/matches/components/modals/StartMatchModal';
import type { GoalEventData } from '@/src/features/matches/components/modals/GoalEventModal';
import type { YellowCardEventData } from '@/src/features/matches/components/modals/YellowCardModal';
import type { RedCardEventData } from '@/src/features/matches/components/modals/RedCardModal';
import type { SubstitutionEventData } from '@/src/features/matches/components/modals/SubstitutionModal';
import {
  clampMatchMinute,
  createMatchEventService,
  finishMatchService,
  getMatchPlayersBySideService,
  getMatchScoreFromEventsService,
  startMatchService,
} from '../services/matchesService';
import type { BackendEventType } from '../types/matches.types';

export interface MatchModalVisibility {
  registerEvent: boolean;
  goal: boolean;
  yellowCard: boolean;
  redCard: boolean;
  substitution: boolean;
  startMatch: boolean;
  endMatch: boolean;
}

export interface MatchActionPendingState {
  hydratingEventPlayers: boolean;
  hydratingEndMatch: boolean;
  submittingEvent: boolean;
  startingMatch: boolean;
  endingMatch: boolean;
  any: boolean;
}

export interface MatchActionModalProps {
  modals: MatchModalVisibility;
  activeEventMatch: LiveMatchContext | null;
  activeEndMatch: LiveMatchSummary | null;
  activeStartMatch: ProgrammedMatchContext | null;
  pending: MatchActionPendingState;
  onSelectEvent: (type: MatchEventType) => void;
  onGoalConfirm: (data: GoalEventData) => void;
  onYellowCardConfirm: (data: YellowCardEventData) => void;
  onRedCardConfirm: (data: RedCardEventData) => void;
  onSubstitutionConfirm: (data: SubstitutionEventData) => void;
  onEndMatchConfirm: (data: EndMatchData) => void;
  onStartMatchConfirm: () => void;
  onCloseRegisterEvent: () => void;
  onCloseGoal: () => void;
  onCloseYellowCard: () => void;
  onCloseRedCard: () => void;
  onCloseSubstitution: () => void;
  onCloseEndMatch: () => void;
  onCloseStartMatch: () => void;
}

function getMatchIdValue(id?: string | number | null): number {
  return Number(id ?? 0);
}

function buildIncidencias(parts: Array<string | undefined | null | false>): string | undefined {
  const value = parts.filter(Boolean).join(' · ').trim();
  return value || undefined;
}

export function useMatchActionModals(onChanged?: () => void | Promise<void>) {
  const [registerEventVisible, setRegisterEventVisible] = useState(false);
  const [goalVisible, setGoalVisible] = useState(false);
  const [yellowCardVisible, setYellowCardVisible] = useState(false);
  const [redCardVisible, setRedCardVisible] = useState(false);
  const [substitutionVisible, setSubstitutionVisible] = useState(false);
  const [startMatchVisible, setStartMatchVisible] = useState(false);
  const [endMatchVisible, setEndMatchVisible] = useState(false);

  const [activeEventMatch, setActiveEventMatch] = useState<LiveMatchContext | null>(null);
  const [activeEndMatch, setActiveEndMatch] = useState<LiveMatchSummary | null>(null);
  const [activeStartMatch, setActiveStartMatch] = useState<ProgrammedMatchContext | null>(null);

  const [hydratingEventPlayers, setHydratingEventPlayers] = useState(false);
  const [hydratingEndMatch, setHydratingEndMatch] = useState(false);
  const [submittingEvent, setSubmittingEvent] = useState(false);
  const [startingMatch, setStartingMatch] = useState(false);
  const [endingMatch, setEndingMatch] = useState(false);

  const anyPending = hydratingEventPlayers || hydratingEndMatch || submittingEvent || startingMatch || endingMatch;

  const pending = useMemo<MatchActionPendingState>(() => ({
    hydratingEventPlayers,
    hydratingEndMatch,
    submittingEvent,
    startingMatch,
    endingMatch,
    any: anyPending,
  }), [hydratingEventPlayers, hydratingEndMatch, submittingEvent, startingMatch, endingMatch, anyPending]);

  const hydratePlayers = useCallback(async <T extends LiveMatchContext | LiveMatchSummary>(match: T): Promise<T> => {
    const matchId = getMatchIdValue(match.id);
    const result = await getMatchPlayersBySideService(matchId);
    if (!result.success || !result.data) return match;
    return { ...match, homePlayers: result.data.home, awayPlayers: result.data.away };
  }, []);

  const notifyError = (error?: string) => Alert.alert('No se pudo completar la acción', error || 'Inténtalo de nuevo.');

  const openRegisterEvent = useCallback((match: LiveMatchContext) => {
    if (anyPending) return;
    setActiveEventMatch(match);
    setRegisterEventVisible(true);
    setHydratingEventPlayers(true);
    void hydratePlayers(match)
      .then(setActiveEventMatch)
      .finally(() => setHydratingEventPlayers(false));
  }, [anyPending, hydratePlayers]);

  const openStartMatch = useCallback((match: ProgrammedMatchContext) => {
    if (anyPending) return;
    setActiveStartMatch(match);
    setStartMatchVisible(true);
  }, [anyPending]);

  const openEndMatch = useCallback((match: LiveMatchSummary) => {
    if (anyPending) return;
    setActiveEndMatch(match);
    setEndMatchVisible(true);
    setHydratingEndMatch(true);
    void (async () => {
      // Fetch players AND score from events in parallel (same as web FinishMatchModal)
      const [hydratedMatch, score] = await Promise.all([
        hydratePlayers(match),
        getMatchScoreFromEventsService(getMatchIdValue(match.id), {
          goles_local: match.homeScore,
          goles_visitante: match.awayScore,
        }),
      ]);
      setActiveEndMatch({
        ...hydratedMatch,
        homeScore: score.goles_local,
        awayScore: score.goles_visitante,
      });
    })().finally(() => setHydratingEndMatch(false));
  }, [anyPending, hydratePlayers]);

  const closeIfIdle = useCallback((close: () => void) => {
    if (anyPending) return;
    close();
  }, [anyPending]);

  const handleSelectEvent = useCallback((type: MatchEventType) => {
    if (anyPending) return;
    setRegisterEventVisible(false);
    if (type === 'goal') setGoalVisible(true);
    else if (type === 'yellow_card') setYellowCardVisible(true);
    else if (type === 'red_card') setRedCardVisible(true);
    else setSubstitutionVisible(true);
  }, [anyPending]);

  const submitEvent = useCallback(async (input: {
    id_jugador: number;
    tipo_evento: BackendEventType;
    id_jugador_sale?: number;
    id_equipo?: number;
    incidencias?: string;
  }) => {
    if (!activeEventMatch || submittingEvent) return;
    setSubmittingEvent(true);

    // Calcular el minuto en el momento exacto del submit, igual que LiveMatchCard.
    // Si tenemos startedAt, recalculamos desde el tiempo real transcurrido.
    // Así el minuto registrado siempre coincide con el que se muestra en la tarjeta.
    const limit = activeEventMatch.duration ?? 90;
    const minute = activeEventMatch.startedAt
      ? clampMatchMinute(
          Math.floor((Date.now() - new Date(activeEventMatch.startedAt).getTime()) / 60000) + 1,
          limit,
        )
      : clampMatchMinute(activeEventMatch.minute, limit);

    const result = await createMatchEventService({
      id_partido: getMatchIdValue(activeEventMatch.id),
      id_jugador: input.id_jugador,
      tipo_evento: input.tipo_evento,
      minuto: minute,
      id_equipo: input.id_equipo,
      id_jugador_sale: input.id_jugador_sale,
      incidencias: input.incidencias,
    });

    setSubmittingEvent(false);

    if (!result.success) {
      notifyError(result.error);
      return;
    }

    setGoalVisible(false);
    setYellowCardVisible(false);
    setRedCardVisible(false);
    setSubstitutionVisible(false);
    await onChanged?.();
  }, [activeEventMatch, onChanged, submittingEvent]);

  const handleGoalConfirm = useCallback((data: GoalEventData) => {
    const homeId = activeEventMatch?.homeTeamId;
    const awayId = activeEventMatch?.awayTeamId;
    const scoringSide = data.ownGoal ? (data.team === 'home' ? 'away' : 'home') : data.team;
    const scoringTeamId = scoringSide === 'home' ? homeId : awayId;

    void submitEvent({
      id_jugador: data.scorerId,
      tipo_evento: 'gol',
      id_equipo: scoringTeamId ?? undefined,
      incidencias: buildIncidencias([
        data.ownGoal && 'Gol en propia puerta',
        data.observations,
      ]),
    });
  }, [activeEventMatch, submitEvent]);

  const handleYellowCardConfirm = useCallback((data: YellowCardEventData) => {
    const teamId = data.team === 'home' ? activeEventMatch?.homeTeamId : activeEventMatch?.awayTeamId;
    void submitEvent({
      id_jugador: data.playerId,
      tipo_evento: 'tarjeta_amarilla',
      id_equipo: teamId ?? undefined,
      incidencias: data.observations,
    });
  }, [activeEventMatch, submitEvent]);

  const handleRedCardConfirm = useCallback((data: RedCardEventData) => {
    const teamId = data.team === 'home' ? activeEventMatch?.homeTeamId : activeEventMatch?.awayTeamId;
    void submitEvent({
      id_jugador: data.playerId,
      tipo_evento: 'tarjeta_roja',
      id_equipo: teamId ?? undefined,
      incidencias: buildIncidencias([
        data.cardType === 'second_yellow' ? 'Expulsión por segunda amarilla' : 'Roja directa',
        data.observations,
      ]),
    });
  }, [activeEventMatch, submitEvent]);

  const handleSubstitutionConfirm = useCallback((data: SubstitutionEventData) => {
    const teamId = data.team === 'home' ? activeEventMatch?.homeTeamId : activeEventMatch?.awayTeamId;
    void submitEvent({
      id_jugador: data.playerInId,
      id_jugador_sale: data.playerOutId,
      tipo_evento: 'cambio',
      id_equipo: teamId ?? undefined,
    });
  }, [activeEventMatch, submitEvent]);

  const handleEndMatchConfirm = useCallback(async (data: EndMatchData) => {
    if (!activeEndMatch || endingMatch || hydratingEndMatch) return;
    setEndingMatch(true);

    // Score was already calculated from events when the modal opened (like web).
    // data.homeScore / data.awayScore may have been manually adjusted by the user.
    const result = await finishMatchService(getMatchIdValue(activeEndMatch.id), {
      goles_local: data.homeScore,
      goles_visitante: data.awayScore,
      id_mvp: data.mvpId,
      puntuacion_mvp: data.mvpScore,
      incidencias: data.observations,
    });

    setEndingMatch(false);

    if (!result.success) {
      notifyError(result.error);
      return;
    }

    setEndMatchVisible(false);
    await onChanged?.();
  }, [activeEndMatch, endingMatch, hydratingEndMatch, onChanged]);

  const handleStartMatchConfirm = useCallback(async () => {
    if (!activeStartMatch || startingMatch) return;
    setStartingMatch(true);
    const result = await startMatchService(getMatchIdValue(activeStartMatch.id), {
      rawDateTime: activeStartMatch.rawDateTime,
      date: activeStartMatch.date,
      time: activeStartMatch.time,
    });
    setStartingMatch(false);

    if (!result.success) {
      notifyError(result.error);
      return;
    }

    setStartMatchVisible(false);
    await onChanged?.();
  }, [activeStartMatch, onChanged, startingMatch]);

  const modals: MatchModalVisibility = {
    registerEvent: registerEventVisible,
    goal: goalVisible,
    yellowCard: yellowCardVisible,
    redCard: redCardVisible,
    substitution: substitutionVisible,
    startMatch: startMatchVisible,
    endMatch: endMatchVisible,
  };

  const modalProps: MatchActionModalProps = {
    modals,
    activeEventMatch,
    activeEndMatch,
    activeStartMatch,
    pending,
    onSelectEvent: handleSelectEvent,
    onGoalConfirm: handleGoalConfirm,
    onYellowCardConfirm: handleYellowCardConfirm,
    onRedCardConfirm: handleRedCardConfirm,
    onSubstitutionConfirm: handleSubstitutionConfirm,
    onEndMatchConfirm: handleEndMatchConfirm,
    onStartMatchConfirm: handleStartMatchConfirm,
    onCloseRegisterEvent: () => closeIfIdle(() => setRegisterEventVisible(false)),
    onCloseGoal: () => closeIfIdle(() => setGoalVisible(false)),
    onCloseYellowCard: () => closeIfIdle(() => setYellowCardVisible(false)),
    onCloseRedCard: () => closeIfIdle(() => setRedCardVisible(false)),
    onCloseSubstitution: () => closeIfIdle(() => setSubstitutionVisible(false)),
    onCloseEndMatch: () => closeIfIdle(() => setEndMatchVisible(false)),
    onCloseStartMatch: () => closeIfIdle(() => setStartMatchVisible(false)),
  };

  return {
    modals,
    activeEventMatch,
    activeEndMatch,
    activeStartMatch,
    openRegisterEvent,
    openStartMatch,
    openEndMatch,
    modalProps,
  };
}
