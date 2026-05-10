/**
 * useMatchActionModals.ts
 * Centraliza modales operativos con API real y bloqueo antirrepetición.
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
  createMatchEventService,
  finishMatchService,
  getMatchPlayersBySideService,
  getMatchScoreFromEventsService,
  startMatchService,
} from '../services/matchesService';

export interface MatchModalVisibility {
  registerEvent: boolean;
  goal: boolean;
  yellowCard: boolean;
  redCard: boolean;
  substitution: boolean;
  startMatch: boolean;
  endMatch: boolean;
}

export interface MatchActionPending {
  hydratingEventPlayers: boolean;
  hydratingEndMatch: boolean;
  submittingEvent: boolean;
  startingMatch: boolean;
  endingMatch: boolean;
  any: boolean;
}

export interface MatchActionModalProps {
  modals: MatchModalVisibility;
  pending: MatchActionPending;
  activeEventMatch: LiveMatchContext | null;
  activeEndMatch: LiveMatchSummary | null;
  activeStartMatch: ProgrammedMatchContext | null;
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

  const pending: MatchActionPending = useMemo(() => {
    const any = hydratingEventPlayers || hydratingEndMatch || submittingEvent || startingMatch || endingMatch;
    return { hydratingEventPlayers, hydratingEndMatch, submittingEvent, startingMatch, endingMatch, any };
  }, [hydratingEventPlayers, hydratingEndMatch, submittingEvent, startingMatch, endingMatch]);

  const hydratePlayers = useCallback(async <T extends LiveMatchContext | LiveMatchSummary>(match: T): Promise<T> => {
    const matchId = getMatchIdValue(match.id);
    const result = await getMatchPlayersBySideService(matchId);
    if (!result.success || !result.data) return match;
    return { ...match, homePlayers: result.data.home, awayPlayers: result.data.away };
  }, []);

  const hydrateEndMatch = useCallback(async (match: LiveMatchSummary): Promise<LiveMatchSummary> => {
    const withPlayers = await hydratePlayers(match);
    const score = await getMatchScoreFromEventsService(
      getMatchIdValue(match.id),
      match.homeTeamId,
      match.awayTeamId,
    );

    // Regla migrada desde web: al finalizar se recalcula el marcador desde eventos.
    if (!score.success || !score.data) return withPlayers;
    return {
      ...withPlayers,
      homeScore: score.data.homeScore,
      awayScore: score.data.awayScore,
    };
  }, [hydratePlayers]);

  const notifyError = (error?: string) => Alert.alert('No se pudo completar la acción', error || 'Inténtalo de nuevo.');

  const actionLocked = pending.any;

  const openRegisterEvent = useCallback((match: LiveMatchContext) => {
    if (actionLocked) return;
    setActiveEventMatch(match);
    setRegisterEventVisible(true);
    setHydratingEventPlayers(true);
    void hydratePlayers(match)
      .then(setActiveEventMatch)
      .finally(() => setHydratingEventPlayers(false));
  }, [actionLocked, hydratePlayers]);

  const openStartMatch = useCallback((match: ProgrammedMatchContext) => {
    if (actionLocked) return;
    setActiveStartMatch(match);
    setStartMatchVisible(true);
  }, [actionLocked]);

  const openEndMatch = useCallback((match: LiveMatchSummary) => {
    if (actionLocked) return;
    setActiveEndMatch(match);
    setEndMatchVisible(true);
    setHydratingEndMatch(true);
    void hydrateEndMatch(match)
      .then(setActiveEndMatch)
      .finally(() => setHydratingEndMatch(false));
  }, [actionLocked, hydrateEndMatch]);

  const handleSelectEvent = useCallback((type: MatchEventType) => {
    if (pending.any || hydratingEventPlayers) return;
    setRegisterEventVisible(false);
    if (type === 'goal') setGoalVisible(true);
    else if (type === 'yellow_card') setYellowCardVisible(true);
    else if (type === 'red_card') setRedCardVisible(true);
    else setSubstitutionVisible(true);
  }, [pending.any, hydratingEventPlayers]);

  const closeEventModals = useCallback(() => {
    setGoalVisible(false);
    setYellowCardVisible(false);
    setRedCardVisible(false);
    setSubstitutionVisible(false);
  }, []);

  const submitEvent = useCallback(async (input: {
    id_jugador: number;
    tipo_evento: 'gol' | 'tarjeta_amarilla' | 'tarjeta_roja' | 'cambio';
    id_jugador_sale?: number;
    incidencias?: string;
  }) => {
    if (!activeEventMatch || submittingEvent) return;

    setSubmittingEvent(true);
    try {
      const result = await createMatchEventService({
        id_partido: getMatchIdValue(activeEventMatch.id),
        id_jugador: input.id_jugador,
        tipo_evento: input.tipo_evento,
        minuto: activeEventMatch.minute,
        id_jugador_sale: input.id_jugador_sale,
        incidencias: input.incidencias,
      });

      if (!result.success) {
        notifyError(result.error);
        return;
      }

      closeEventModals();
      await onChanged?.();
    } finally {
      setSubmittingEvent(false);
    }
  }, [activeEventMatch, closeEventModals, onChanged, submittingEvent]);

  const handleGoalConfirm = useCallback((data: GoalEventData) => {
    void submitEvent({ id_jugador: data.scorerId, tipo_evento: 'gol' });
  }, [submitEvent]);

  const handleYellowCardConfirm = useCallback((data: YellowCardEventData) => {
    void submitEvent({ id_jugador: data.playerId, tipo_evento: 'tarjeta_amarilla', incidencias: data.incidencias });
  }, [submitEvent]);

  const handleRedCardConfirm = useCallback((data: RedCardEventData) => {
    void submitEvent({ id_jugador: data.playerId, tipo_evento: 'tarjeta_roja', incidencias: data.incidencias });
  }, [submitEvent]);

  const handleSubstitutionConfirm = useCallback((data: SubstitutionEventData) => {
    void submitEvent({ id_jugador: data.playerInId, id_jugador_sale: data.playerOutId, tipo_evento: 'cambio' });
  }, [submitEvent]);

  const handleEndMatchConfirm = useCallback(async (data: EndMatchData) => {
    if (!activeEndMatch || endingMatch) return;

    setEndingMatch(true);
    try {
      // Recalcula justo antes de finalizar para evitar marcador viejo si se registró un gol recientemente.
      const score = await getMatchScoreFromEventsService(
        getMatchIdValue(activeEndMatch.id),
        activeEndMatch.homeTeamId,
        activeEndMatch.awayTeamId,
      );

      const result = await finishMatchService(getMatchIdValue(activeEndMatch.id), {
        goles_local: score.success && score.data ? score.data.homeScore : activeEndMatch.homeScore,
        goles_visitante: score.success && score.data ? score.data.awayScore : activeEndMatch.awayScore,
        id_mvp: data.mvpId,
        puntuacion_mvp: data.mvpScore,
        incidencias: data.observations,
      });

      if (!result.success) {
        notifyError(result.error);
        return;
      }

      setEndMatchVisible(false);
      await onChanged?.();
    } finally {
      setEndingMatch(false);
    }
  }, [activeEndMatch, endingMatch, onChanged]);

  const handleStartMatchConfirm = useCallback(async () => {
    if (!activeStartMatch || startingMatch) return;

    setStartingMatch(true);
    try {
      const result = await startMatchService(getMatchIdValue(activeStartMatch.id));
      if (!result.success) {
        notifyError(result.error);
        return;
      }
      setStartMatchVisible(false);
      await onChanged?.();
    } finally {
      setStartingMatch(false);
    }
  }, [activeStartMatch, onChanged, startingMatch]);

  const guardedClose = useCallback((close: () => void) => {
    if (pending.any) return;
    close();
  }, [pending.any]);

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
    pending,
    activeEventMatch,
    activeEndMatch,
    activeStartMatch,
    onSelectEvent: handleSelectEvent,
    onGoalConfirm: handleGoalConfirm,
    onYellowCardConfirm: handleYellowCardConfirm,
    onRedCardConfirm: handleRedCardConfirm,
    onSubstitutionConfirm: handleSubstitutionConfirm,
    onEndMatchConfirm: handleEndMatchConfirm,
    onStartMatchConfirm: handleStartMatchConfirm,
    onCloseRegisterEvent: () => guardedClose(() => setRegisterEventVisible(false)),
    onCloseGoal: () => guardedClose(() => setGoalVisible(false)),
    onCloseYellowCard: () => guardedClose(() => setYellowCardVisible(false)),
    onCloseRedCard: () => guardedClose(() => setRedCardVisible(false)),
    onCloseSubstitution: () => guardedClose(() => setSubstitutionVisible(false)),
    onCloseEndMatch: () => guardedClose(() => setEndMatchVisible(false)),
    onCloseStartMatch: () => guardedClose(() => setStartMatchVisible(false)),
  };

  return {
    modals,
    pending,
    activeEventMatch,
    activeEndMatch,
    activeStartMatch,
    openRegisterEvent,
    openStartMatch,
    openEndMatch,
    modalProps,
  };
}
