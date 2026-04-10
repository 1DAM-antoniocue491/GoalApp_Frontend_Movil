/**
 * ActiveLeagueStore - Store para la liga activa y rol del usuario
 *
 * Gestiona el estado de la liga seleccionada durante la sesión:
 * - leagueId: ID de la liga activa
 * - leagueName: Nombre de la liga
 * - role: Rol del usuario en esa liga (admin, coach, player, field_delegate)
 *
 * Nota: En producción, esto se persistiría con AsyncStorage o similar.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { LeagueRole } from '../types/league';

export interface ActiveLeagueSession {
  leagueId: string;
  leagueName: string;
  role: LeagueRole;
}

interface ActiveLeagueState {
  session: ActiveLeagueSession | null;
  setSession: (session: ActiveLeagueSession) => void;
  clearSession: () => void;
  hasActiveLeague: () => boolean;
  getRole: () => LeagueRole | null;
}

// Estado global (en producción usar Zustand, Redux o Context)
let state: ActiveLeagueSession | null = null;
const listeners: Set<(state: ActiveLeagueSession | null) => void> = new Set();

/**
 * Hook React para suscribirse al estado de la liga activa
 *
 * @example
 * const { session, setSession, clearSession, hasActiveLeague, getRole } = useActiveLeague();
 */
export function useActiveLeague(): ActiveLeagueState {
  const [localState, setLocalState] = React.useState<ActiveLeagueSession | null>(state);

  React.useEffect(() => {
    const listener = (newState: ActiveLeagueSession | null) => {
      setLocalState(newState);
    };
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  return {
    session: localState,
    setSession: (session: ActiveLeagueSession) => {
      state = session;
      listeners.forEach((listener) => listener(session));
    },
    clearSession: () => {
      state = null;
      listeners.forEach((listener) => listener(null));
    },
    hasActiveLeague: () => state !== null,
    getRole: () => state?.role ?? null,
  };
}

// Exportamos funciones directas para uso fuera de componentes
export const activeLeagueStore = {
  getSession: () => state,
  setSession: (session: ActiveLeagueSession) => {
    state = session;
    listeners.forEach((listener) => listener(session));
  },
  clearSession: () => {
    state = null;
    listeners.forEach((listener) => listener(null));
  },
  hasActiveLeague: () => state !== null,
  getRole: () => state?.role ?? null,
  getLeagueId: () => state?.leagueId ?? null,
  getLeagueName: () => state?.leagueName ?? null,
};

// Hook para obtener el rol actual como string para uso en switch
export function useActiveLeagueRole(): LeagueRole | null {
  const [role, setRole] = React.useState<LeagueRole | null>(state?.role ?? null);

  React.useEffect(() => {
    const listener = (newState: ActiveLeagueSession | null) => {
      setRole(newState?.role ?? null);
    };
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  return role;
}
