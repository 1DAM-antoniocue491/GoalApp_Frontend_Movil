/**
 * useMatchActionModals.ts
 *
 * Hook reutilizable que centraliza el estado y los handlers de los modales
 * operativos de partido en vivo:
 *
 *   1. RegisterEventModal   — selector de tipo de evento
 *   2. GoalEventModal       — registrar gol
 *   3. YellowCardModal      — tarjeta amarilla
 *   4. RedCardModal         — tarjeta roja
 *   5. SubstitutionModal    — cambio de jugador
 *   6. StartMatchModal      — iniciar partido
 *   7. EndMatchModal        — finalizar partido
 *
 * Uso típico en cualquier pantalla que necesite estas acciones:
 *
 *   const { modals, openRegisterEvent, openStartMatch, openEndMatch, modalProps } =
 *     useMatchActionModals();
 *
 *   // Montar los modales al final del return:
 *   <MatchActionModals {@/src/features/matches.modalProps} />
 *
 * PREPARADO PARA API:
 * Los handlers `onGoalConfirm`, `onYellowCardConfirm`, `onRedCardConfirm`,
 * `onSubstitutionConfirm`, `onEndMatchConfirm` y `onStartMatchConfirm`
 * tienen comentarios TODO listos para conectar a los endpoints reales.
 */

import { useState } from 'react';

import type { LiveMatchContext } from '@/src/features/matches/components/modals/RegisterEventModal';
import type { LiveMatchSummary, EndMatchData } from '@/src/features/matches/components/modals/EndMatchModal';
import type { ProgrammedMatchContext } from '@/src/features/matches/components/modals/StartMatchModal';
import type { MatchEventType } from '@/src/features/matches/components/modals/RegisterEventModal';
import type { GoalEventData } from '@/src/features/matches/components/modals/GoalEventModal';
import type { YellowCardEventData } from '@/src/features/matches/components/modals/YellowCardModal';
import type { RedCardEventData } from '@/src/features/matches/components/modals/RedCardModal';
import type { SubstitutionEventData } from '@/src/features/matches/components/modals/SubstitutionModal';

// ---------------------------------------------------------------------------
// Tipos del hook
// ---------------------------------------------------------------------------

/** Estado de visibilidad de todos los modales operativos */
export interface MatchModalVisibility {
  registerEvent: boolean;
  goal: boolean;
  yellowCard: boolean;
  redCard: boolean;
  substitution: boolean;
  startMatch: boolean;
  endMatch: boolean;
}

/** Todo lo necesario para montar los modales en la pantalla consumidora */
export interface MatchActionModalProps {
  modals: MatchModalVisibility;
  /** Contexto del partido en vivo activo (RegisterEvent + sub-modales) */
  activeEventMatch: LiveMatchContext | null;
  /** Contexto del partido a finalizar */
  activeEndMatch: LiveMatchSummary | null;
  /** Contexto del partido a iniciar */
  activeStartMatch: ProgrammedMatchContext | null;
  /** Handlers de selección y confirmación */
  onSelectEvent: (type: MatchEventType) => void;
  onGoalConfirm: (data: GoalEventData) => void;
  onYellowCardConfirm: (data: YellowCardEventData) => void;
  onRedCardConfirm: (data: RedCardEventData) => void;
  onSubstitutionConfirm: (data: SubstitutionEventData) => void;
  onEndMatchConfirm: (data: EndMatchData) => void;
  onStartMatchConfirm: () => void;
  /** Cierre individual de cada modal */
  onCloseRegisterEvent: () => void;
  onCloseGoal: () => void;
  onCloseYellowCard: () => void;
  onCloseRedCard: () => void;
  onCloseSubstitution: () => void;
  onCloseEndMatch: () => void;
  onCloseStartMatch: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMatchActionModals() {
  // ── Visibilidad de modales ──
  const [registerEventVisible, setRegisterEventVisible] = useState(false);
  const [goalVisible, setGoalVisible] = useState(false);
  const [yellowCardVisible, setYellowCardVisible] = useState(false);
  const [redCardVisible, setRedCardVisible] = useState(false);
  const [substitutionVisible, setSubstitutionVisible] = useState(false);
  const [startMatchVisible, setStartMatchVisible] = useState(false);
  const [endMatchVisible, setEndMatchVisible] = useState(false);

  // ── Contextos activos — se establecen al abrir cada modal ──
  const [activeEventMatch, setActiveEventMatch] = useState<LiveMatchContext | null>(null);
  const [activeEndMatch, setActiveEndMatch] = useState<LiveMatchSummary | null>(null);
  const [activeStartMatch, setActiveStartMatch] = useState<ProgrammedMatchContext | null>(null);

  // ---------------------------------------------------------------------------
  // Abrirores — la pantalla consumidora llama a estos con los datos del partido
  // ---------------------------------------------------------------------------

  /** Abre el selector de tipo de evento para un partido en vivo */
  const openRegisterEvent = (match: LiveMatchContext) => {
    setActiveEventMatch(match);
    setRegisterEventVisible(true);
  };

  /** Abre el modal de confirmación de inicio de partido */
  const openStartMatch = (match: ProgrammedMatchContext) => {
    setActiveStartMatch(match);
    setStartMatchVisible(true);
  };

  /** Abre el modal de finalización de partido */
  const openEndMatch = (match: LiveMatchSummary) => {
    setActiveEndMatch(match);
    setEndMatchVisible(true);
  };

  /** Cierra todos los modales a la vez (útil al navegar o desmontar) */
  const closeAll = () => {
    setRegisterEventVisible(false);
    setGoalVisible(false);
    setYellowCardVisible(false);
    setRedCardVisible(false);
    setSubstitutionVisible(false);
    setStartMatchVisible(false);
    setEndMatchVisible(false);
  };

  // ---------------------------------------------------------------------------
  // Handler de selección de evento — despacha al sub-modal correcto
  // ---------------------------------------------------------------------------

  const handleSelectEvent = (type: MatchEventType) => {
    // Cierra el selector antes de abrir el sub-modal para evitar superposición
    setRegisterEventVisible(false);
    if (type === 'goal') setGoalVisible(true);
    else if (type === 'yellow_card') setYellowCardVisible(true);
    else if (type === 'red_card') setRedCardVisible(true);
    else if (type === 'substitution') setSubstitutionVisible(true);
  };

  // ---------------------------------------------------------------------------
  // Handlers de confirmación — preparados para conectar a API
  // ---------------------------------------------------------------------------

  const handleGoalConfirm = (data: GoalEventData) => {
    setGoalVisible(false);
    // TODO: POST /matches/:id/events { type: 'goal', @/src/features/matches.data, minute: activeEventMatch?.minute }
    console.log('[useMatchActionModals] goal confirmed for match:', activeEventMatch?.id, data);
  };

  const handleYellowCardConfirm = (data: YellowCardEventData) => {
    setYellowCardVisible(false);
    // TODO: POST /matches/:id/events { type: 'yellow_card', @/src/features/matches.data, minute: activeEventMatch?.minute }
    console.log('[useMatchActionModals] yellow_card confirmed for match:', activeEventMatch?.id, data);
  };

  const handleRedCardConfirm = (data: RedCardEventData) => {
    setRedCardVisible(false);
    // TODO: POST /matches/:id/events { type: 'red_card', @/src/features/matches.data, minute: activeEventMatch?.minute }
    console.log('[useMatchActionModals] red_card confirmed for match:', activeEventMatch?.id, data);
  };

  const handleSubstitutionConfirm = (data: SubstitutionEventData) => {
    setSubstitutionVisible(false);
    // TODO: POST /matches/:id/events { type: 'substitution', @/src/features/matches.data, minute: activeEventMatch?.minute }
    console.log('[useMatchActionModals] substitution confirmed for match:', activeEventMatch?.id, data);
  };

  const handleEndMatchConfirm = (data: EndMatchData) => {
    setEndMatchVisible(false);
    // TODO: PATCH /matches/:id/finish { mvp, observations }
    // Después actualizar la lista local cambiando el status a 'finished'
    console.log('[useMatchActionModals] end match confirmed for match:', activeEndMatch?.id, data);
  };

  const handleStartMatchConfirm = () => {
    setStartMatchVisible(false);
    // TODO: PATCH /matches/:id/start
    // Después actualizar la lista local cambiando el status a 'live'
    console.log('[useMatchActionModals] start match confirmed for match:', activeStartMatch?.id);
  };

  // ---------------------------------------------------------------------------
  // Retorno
  // ---------------------------------------------------------------------------

  const modals: MatchModalVisibility = {
    registerEvent: registerEventVisible,
    goal: goalVisible,
    yellowCard: yellowCardVisible,
    redCard: redCardVisible,
    substitution: substitutionVisible,
    startMatch: startMatchVisible,
    endMatch: endMatchVisible,
  };

  /** Props listas para spreadearse en <MatchActionModals /> o pasar individualmente */
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

  return {
    /** Estado de visibilidad de todos los modales */
    modals,
    /** Contexto del partido activo según el modal abierto */
    activeEventMatch,
    activeEndMatch,
    activeStartMatch,
    /** Abrirores — llamar con los datos del partido desde las cards */
    openRegisterEvent,
    openStartMatch,
    openEndMatch,
    closeAll,
    /** Props agregadas — útiles si se monta un componente <MatchActionModals> */
    modalProps,
  };
}
