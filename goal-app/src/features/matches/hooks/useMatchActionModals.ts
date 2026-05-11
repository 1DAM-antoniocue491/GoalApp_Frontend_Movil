/**
 * useMatchActionModals.ts
 * Centraliza modales operativos con API real y bloqueo anti-doble toque.
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

function getTeamIdFromContext(match: LiveMatchContext, team?: 'home' | 'away'): number | undefined {
  if (team === 'home') return match.homeTeamId;
  if (team === 'away') return match.awayTeamId;
  return undefined;
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

  const pending = useMemo<MatchActionPendingState>(() => {
    const any = hydratingEventPlayers || hydratingEndMatch || submittingEvent || startingMatch || endingMatch;
    return { hydratingEventPlayers, hydratingEndMatch, submittingEvent, startingMatch, endingMatch, any };
  }, [hydratingEventPlayers, hydratingEndMatch, submittingEvent, startingMatch, endingMatch]);

  const hydratePlayers = useCallback(async <T extends LiveMatchContext | LiveMatchSummary>(match: T): Promise<T> => {
    const matchId = getMatchIdValue(match.id);
    const result = await getMatchPlayersBySideService(matchId);
    if (!result.success || !result.data) return match;
    return { ...match, homePlayers: result.data.home, awayPlayers: result.data.away };
  }, []);

  const notifyError = (error?: string) => Alert.alert('No se pudo completar la acción', error || 'Inténtalo de nuevo.');

  const openRegisterEvent = useCallback((match: LiveMatchContext) => {
    if (pending.any) return;
    setActiveEventMatch(match);
    setRegisterEventVisible(true);
    setHydratingEventPlayers(true);
    void hydratePlayers(match)
      .then(setActiveEventMatch)
      .finally(() => setHydratingEventPlayers(false));
  }, [hydratePlayers, pending.any]);

  const openStartMatch = useCallback((match: ProgrammedMatchContext) => {
    if (pending.any) return;
    setActiveStartMatch(match);
    setStartMatchVisible(true);
  }, [pending.any]);

  const openEndMatch = useCallback((match: LiveMatchSummary) => {
    if (pending.any) return;
    setActiveEndMatch(match);
    setEndMatchVisible(true);
    setHydratingEndMatch(true);
    void hydratePlayers(match)
      .then(setActiveEndMatch)
      .finally(() => setHydratingEndMatch(false));
  }, [hydratePlayers, pending.any]);

  const handleSelectEvent = (type: MatchEventType) => {
    if (pending.any) return;
    setRegisterEventVisible(false);
    if (type === 'goal') setGoalVisible(true);
    else if (type === 'yellow_card') setYellowCardVisible(true);
    else if (type === 'red_card') setRedCardVisible(true);
    else setSubstitutionVisible(true);
  };

  const submitEvent = async (input: {
    id_jugador: number;
    tipo_evento: 'gol' | 'tarjeta_amarilla' | 'tarjeta_roja' | 'cambio';
    id_jugador_sale?: number;
    team?: 'home' | 'away';
    incidencias?: string;
  }) => {
    if (!activeEventMatch || submittingEvent) return;
    setSubmittingEvent(true);
    const result = await createMatchEventService({
      id_partido: getMatchIdValue(activeEventMatch.id),
      id_jugador: input.id_jugador,
      tipo_evento: input.tipo_evento,
      minuto: Math.max(1, Number(activeEventMatch.minute ?? 1)),
      id_jugador_sale: input.id_jugador_sale,
      id_equipo: getTeamIdFromContext(activeEventMatch, input.team),
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
    void onChanged?.();
  };

  const handleGoalConfirm = (data: GoalEventData) => submitEvent({
    id_jugador: data.scorerId,
    tipo_evento: 'gol',
    team: data.team,
    incidencias: data.ownGoal ? 'Gol en propia puerta' : undefined,
  });

  const handleYellowCardConfirm = (data: YellowCardEventData) => submitEvent({
    id_jugador: data.playerId,
    tipo_evento: 'tarjeta_amarilla',
    team: data.team,
  });

  const handleRedCardConfirm = (data: RedCardEventData) => submitEvent({
    id_jugador: data.playerId,
    tipo_evento: 'tarjeta_roja',
    team: data.team,
    incidencias: data.cardType === 'second_yellow' ? 'Segunda amarilla' : 'Roja directa',
  });

  const handleSubstitutionConfirm = (data: SubstitutionEventData) => submitEvent({
    id_jugador: data.playerInId,
    id_jugador_sale: data.playerOutId,
    tipo_evento: 'cambio',
    team: data.team,
  });

  const handleEndMatchConfirm = async (data: EndMatchData) => {
    if (!activeEndMatch || endingMatch) return;
    setEndingMatch(true);
    const result = await finishMatchService(getMatchIdValue(activeEndMatch.id), {
      goles_local: activeEndMatch.homeScore,
      goles_visitante: activeEndMatch.awayScore,
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
    void onChanged?.();
  };

  const handleStartMatchConfirm = async () => {
    if (!activeStartMatch || startingMatch) return;
    setStartingMatch(true);
    const result = await startMatchService(getMatchIdValue(activeStartMatch.id));
    setStartingMatch(false);
    if (!result.success) {
      notifyError(result.error);
      return;
    }
    setStartMatchVisible(false);
    void onChanged?.();
  };

  const closeIfIdle = (close: () => void) => {
    if (!pending.any) close();
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
    openRegisterEvent,
    openStartMatch,
    openEndMatch,
    modalProps,
  };
}
