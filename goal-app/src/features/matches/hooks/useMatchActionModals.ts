/**
 * useMatchActionModals.ts
 * Centraliza modales operativos con API real y sincronización global.
 */

import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import type { LiveMatchContext, MatchEventType } from '@/src/features/matches/components/modals/RegisterEventModal';
import type { LiveMatchSummary, EndMatchData } from '@/src/features/matches/components/modals/EndMatchModal';
import type { ProgrammedMatchContext } from '@/src/features/matches/components/modals/StartMatchModal';
import type { GoalEventData } from '@/src/features/matches/components/modals/GoalEventModal';
import type { YellowCardEventData } from '@/src/features/matches/components/modals/YellowCardModal';
import type { RedCardEventData } from '@/src/features/matches/components/modals/RedCardModal';
import type { SubstitutionEventData } from '@/src/features/matches/components/modals/SubstitutionModal';
import {
  createMatchEventService,
  finishMatchService,
  getComputedScoreFromEventsService,
  getMatchPlayersBySideService,
  startMatchService,
} from '../services/matchesService';
import { emitMatchDataChanged } from '../services/matchSync';

export interface MatchModalVisibility {
  registerEvent: boolean;
  goal: boolean;
  yellowCard: boolean;
  redCard: boolean;
  substitution: boolean;
  startMatch: boolean;
  endMatch: boolean;
}

export interface MatchActionModalProps {
  modals: MatchModalVisibility;
  activeEventMatch: LiveMatchContext | null;
  activeEndMatch: LiveMatchSummary | null;
  activeStartMatch: ProgrammedMatchContext | null;
  pending: boolean;
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

function notifyError(error?: string) {
  Alert.alert('No se pudo completar la acción', error || 'Inténtalo de nuevo.');
}

function getCurrentVisualMinute(match: LiveMatchContext): number {
  const duration = Math.max(1, Number(match.duration ?? 90));
  const startedAt = match.startedAt ? new Date(match.startedAt).getTime() : NaN;
  if (!Number.isNaN(startedAt)) {
    return Math.max(1, Math.min(duration, Math.floor((Date.now() - startedAt) / 60000) + 1));
  }
  return Math.max(1, Math.min(duration, Math.floor(Number(match.minute ?? 1))));
}

export function useMatchActionModals(onChanged?: () => void | Promise<void>) {
  const [registerEventVisible, setRegisterEventVisible] = useState(false);
  const [goalVisible, setGoalVisible] = useState(false);
  const [yellowCardVisible, setYellowCardVisible] = useState(false);
  const [redCardVisible, setRedCardVisible] = useState(false);
  const [substitutionVisible, setSubstitutionVisible] = useState(false);
  const [startMatchVisible, setStartMatchVisible] = useState(false);
  const [endMatchVisible, setEndMatchVisible] = useState(false);
  const [pending, setPending] = useState(false);

  const [activeEventMatch, setActiveEventMatch] = useState<LiveMatchContext | null>(null);
  const [activeEndMatch, setActiveEndMatch] = useState<LiveMatchSummary | null>(null);
  const [activeStartMatch, setActiveStartMatch] = useState<ProgrammedMatchContext | null>(null);

  const syncAfterChange = useCallback(async () => {
    emitMatchDataChanged();
    await onChanged?.();
  }, [onChanged]);

  const hydratePlayers = useCallback(async <T extends LiveMatchContext | LiveMatchSummary>(match: T): Promise<T> => {
    const matchId = getMatchIdValue(match.id);
    const result = await getMatchPlayersBySideService(matchId);
    if (!result.success || !result.data) return match;
    return { ...match, homePlayers: result.data.home, awayPlayers: result.data.away };
  }, []);

  const openRegisterEvent = useCallback((match: LiveMatchContext) => {
    if (pending) return;
    if (match.eventsLocked) {
      Alert.alert('Tiempo finalizado', 'Finaliza el partido y escoge el MVP.');
      return;
    }
    setActiveEventMatch(match);
    setRegisterEventVisible(true);
    void hydratePlayers(match).then(setActiveEventMatch);
  }, [hydratePlayers, pending]);

  const openStartMatch = useCallback((match: ProgrammedMatchContext) => {
    if (pending) return;
    setActiveStartMatch(match);
    setStartMatchVisible(true);
  }, [pending]);

  const openEndMatch = useCallback((match: LiveMatchSummary) => {
    if (pending) return;
    setActiveEndMatch(match);
    setEndMatchVisible(true);
    void hydratePlayers(match).then(setActiveEndMatch);
  }, [hydratePlayers, pending]);

  const closeIfIdle = (close: () => void) => {
    if (!pending) close();
  };

  const handleSelectEvent = (type: MatchEventType) => {
    if (pending || activeEventMatch?.eventsLocked) return;
    setRegisterEventVisible(false);
    if (type === 'goal') setGoalVisible(true);
    else if (type === 'yellow_card') setYellowCardVisible(true);
    else if (type === 'red_card') setRedCardVisible(true);
    else setSubstitutionVisible(true);
  };

  const submitEvent = async (input: {
    team?: 'home' | 'away';
    id_jugador: number;
    tipo_evento: 'gol' | 'tarjeta_amarilla' | 'tarjeta_roja' | 'cambio';
    id_jugador_sale?: number;
    incidencias?: string;
  }) => {
    if (!activeEventMatch || pending) return;
    if (activeEventMatch.eventsLocked) {
      Alert.alert('Tiempo finalizado', 'No se pueden registrar más eventos. Finaliza el partido y escoge el MVP.');
      return;
    }

    setPending(true);
    const idEquipo = input.team === 'home'
      ? activeEventMatch.homeTeamId
      : input.team === 'away'
        ? activeEventMatch.awayTeamId
        : undefined;

    const result = await createMatchEventService({
      id_partido: getMatchIdValue(activeEventMatch.id),
      id_jugador: input.id_jugador,
      tipo_evento: input.tipo_evento,
      minuto: getCurrentVisualMinute(activeEventMatch),
      id_jugador_sale: input.id_jugador_sale,
      id_equipo: idEquipo,
      incidencias: input.incidencias,
    });

    setPending(false);
    if (!result.success) {
      notifyError(result.error);
      return;
    }

    setGoalVisible(false);
    setYellowCardVisible(false);
    setRedCardVisible(false);
    setSubstitutionVisible(false);
    setRegisterEventVisible(false);
    await syncAfterChange();
  };

  const handleGoalConfirm = (data: GoalEventData) => submitEvent({
    team: data.team,
    id_jugador: data.scorerId,
    tipo_evento: 'gol',
    incidencias: data.ownGoal ? 'Gol en propia puerta' : undefined,
  });

  const handleYellowCardConfirm = (data: YellowCardEventData) => submitEvent({
    team: data.team,
    id_jugador: data.playerId,
    tipo_evento: 'tarjeta_amarilla',
    incidencias: 'Tarjeta amarilla',
  });

  const handleRedCardConfirm = (data: RedCardEventData) => submitEvent({
    team: data.team,
    id_jugador: data.playerId,
    tipo_evento: 'tarjeta_roja',
    incidencias: data.cardType === 'second_yellow' ? 'Roja por segunda amarilla' : 'Roja directa',
  });

  const handleSubstitutionConfirm = (data: SubstitutionEventData) => submitEvent({
    team: data.team,
    id_jugador: data.playerInId,
    id_jugador_sale: data.playerOutId,
    tipo_evento: 'cambio',
    incidencias: 'Sustitución',
  });

  const handleEndMatchConfirm = async (data: EndMatchData) => {
    if (!activeEndMatch || pending) return;
    if (data.mvpScore < 1 || data.mvpScore > 10) {
      Alert.alert('Puntuación no válida', 'La puntuación del MVP debe estar entre 1 y 10.');
      return;
    }

    setPending(true);
    const fallback = { home: activeEndMatch.homeScore, away: activeEndMatch.awayScore };
    const score = await getComputedScoreFromEventsService(
      getMatchIdValue(activeEndMatch.id),
      activeEndMatch.homeTeamId,
      activeEndMatch.awayTeamId,
      fallback,
    );

    const result = await finishMatchService(getMatchIdValue(activeEndMatch.id), {
      goles_local: score.home,
      goles_visitante: score.away,
      id_mvp: data.mvpId,
      puntuacion_mvp: data.mvpScore,
      incidencias: data.observations,
    });

    setPending(false);
    if (!result.success) {
      notifyError(result.error);
      return;
    }

    setEndMatchVisible(false);
    await syncAfterChange();
  };

  const handleStartMatchConfirm = async () => {
    if (!activeStartMatch || pending) return;
    setPending(true);
    const result = await startMatchService(getMatchIdValue(activeStartMatch.id));
    setPending(false);

    if (!result.success) {
      notifyError(result.error);
      return;
    }

    setStartMatchVisible(false);
    await syncAfterChange();
  };

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
    pending,
    openRegisterEvent,
    openStartMatch,
    openEndMatch,
    modalProps,
  };
}
