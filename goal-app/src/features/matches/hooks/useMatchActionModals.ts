/**
 * useMatchActionModals.ts
 * Centraliza modales operativos con API real.
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

export interface MatchActionModalProps {
  modals: MatchModalVisibility;
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

  const hydratePlayers = useCallback(async <T extends LiveMatchContext | LiveMatchSummary>(match: T): Promise<T> => {
    const matchId = getMatchIdValue(match.id);
    const result = await getMatchPlayersBySideService(matchId);
    if (!result.success || !result.data) return match;
    return { ...match, homePlayers: result.data.home, awayPlayers: result.data.away };
  }, []);

  const notifyError = (error?: string) => Alert.alert('No se pudo completar la acción', error || 'Inténtalo de nuevo.');

  const openRegisterEvent = useCallback((match: LiveMatchContext) => {
    setActiveEventMatch(match);
    setRegisterEventVisible(true);
    void hydratePlayers(match).then(setActiveEventMatch);
  }, [hydratePlayers]);

  const openStartMatch = useCallback((match: ProgrammedMatchContext) => {
    setActiveStartMatch(match);
    setStartMatchVisible(true);
  }, []);

  const openEndMatch = useCallback((match: LiveMatchSummary) => {
    setActiveEndMatch(match);
    setEndMatchVisible(true);
    void hydratePlayers(match).then(setActiveEndMatch);
  }, [hydratePlayers]);

  const handleSelectEvent = (type: MatchEventType) => {
    setRegisterEventVisible(false);
    if (type === 'goal') setGoalVisible(true);
    else if (type === 'yellow_card') setYellowCardVisible(true);
    else if (type === 'red_card') setRedCardVisible(true);
    else setSubstitutionVisible(true);
  };

  const submitEvent = async (input: { id_jugador: number; tipo_evento: 'gol' | 'tarjeta_amarilla' | 'tarjeta_roja' | 'cambio'; id_jugador_sale?: number }) => {
    if (!activeEventMatch) return;
    const result = await createMatchEventService({
      id_partido: getMatchIdValue(activeEventMatch.id),
      id_jugador: input.id_jugador,
      tipo_evento: input.tipo_evento,
      minuto: activeEventMatch.minute,
      id_jugador_sale: input.id_jugador_sale,
    });
    if (!result.success) {
      notifyError(result.error);
      return;
    }
    setGoalVisible(false); setYellowCardVisible(false); setRedCardVisible(false); setSubstitutionVisible(false);
    void onChanged?.();
  };

  const handleGoalConfirm = (data: GoalEventData) => submitEvent({ id_jugador: data.scorerId, tipo_evento: 'gol' });
  const handleYellowCardConfirm = (data: YellowCardEventData) => submitEvent({ id_jugador: data.playerId, tipo_evento: 'tarjeta_amarilla' });
  const handleRedCardConfirm = (data: RedCardEventData) => submitEvent({ id_jugador: data.playerId, tipo_evento: 'tarjeta_roja' });
  const handleSubstitutionConfirm = (data: SubstitutionEventData) => submitEvent({ id_jugador: data.playerInId, id_jugador_sale: data.playerOutId, tipo_evento: 'cambio' });

  const handleEndMatchConfirm = async (data: EndMatchData) => {
    if (!activeEndMatch) return;
    const result = await finishMatchService(getMatchIdValue(activeEndMatch.id), {
      goles_local: activeEndMatch.homeScore,
      goles_visitante: activeEndMatch.awayScore,
      id_mvp: data.mvpId,
      puntuacion_mvp: data.mvpScore,
      incidencias: data.observations,
    });
    if (!result.success) {
      notifyError(result.error);
      return;
    }
    setEndMatchVisible(false);
    void onChanged?.();
  };

  const handleStartMatchConfirm = async () => {
    if (!activeStartMatch) return;
    const result = await startMatchService(getMatchIdValue(activeStartMatch.id));
    if (!result.success) {
      notifyError(result.error);
      return;
    }
    setStartMatchVisible(false);
    void onChanged?.();
  };

  const modals: MatchModalVisibility = { registerEvent: registerEventVisible, goal: goalVisible, yellowCard: yellowCardVisible, redCard: redCardVisible, substitution: substitutionVisible, startMatch: startMatchVisible, endMatch: endMatchVisible };

  const modalProps: MatchActionModalProps = {
    modals,
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
    onCloseRegisterEvent: () => setRegisterEventVisible(false),
    onCloseGoal: () => setGoalVisible(false),
    onCloseYellowCard: () => setYellowCardVisible(false),
    onCloseRedCard: () => setRedCardVisible(false),
    onCloseSubstitution: () => setSubstitutionVisible(false),
    onCloseEndMatch: () => setEndMatchVisible(false),
    onCloseStartMatch: () => setStartMatchVisible(false),
  };

  return { modals, activeEventMatch, activeEndMatch, activeStartMatch, openRegisterEvent, openStartMatch, openEndMatch, modalProps };
}
