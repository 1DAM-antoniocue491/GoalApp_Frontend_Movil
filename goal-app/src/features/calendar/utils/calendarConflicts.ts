/**
 * calendarConflicts.ts
 *
 * Detección de conflictos entre partidos manuales y automáticos del calendario.
 *
 * REGLA DE NEGOCIO:
 * Cuando se genera un calendario automático, los partidos manuales existentes
 * NO deben sobrescribirse. Si un partido manual coincide con uno automático,
 * debe marcarse como conflicto para que el admin decida.
 *
 * CRITERIOS DE CONFLICTO (mínimo para esta fase):
 * 1. Mismo cruce exacto (mismo equipo local y visitante)
 * 2. Algún equipo en común en la misma jornada
 *
 * TODO (backend):
 * - La detección definitiva debe ocurrir en el servidor durante la operación
 *   POST /calendar/generate para garantizar consistencia transaccional.
 * - Esta utilidad sirve para feedback visual previo al guardado, no como
 *   validación autoritativa.
 * - Criterios adicionales a considerar en backend: misma hora aproximada
 *   (margen de 2 horas), mismo estadio, restricciones de liga.
 */

import type { CalendarMatch } from '../types/calendar.types';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type ConflictReason =
  | 'same_teams'         // Mismo cruce exacto (local y visitante)
  | 'same_round_overlap'; // Algún equipo en común en la misma jornada

export interface CalendarConflict {
  manualMatch: CalendarMatch;
  automaticMatch: CalendarMatch;
  reason: ConflictReason;
}

// ---------------------------------------------------------------------------
// Funciones
// ---------------------------------------------------------------------------

/**
 * Detecta conflictos entre partidos manuales y automáticos de una misma liga.
 *
 * @param manualMatches    - Partidos con source: 'manual'
 * @param automaticMatches - Partidos con source: 'automatic'
 */
export function detectCalendarConflicts(
  manualMatches: CalendarMatch[],
  automaticMatches: CalendarMatch[]
): CalendarConflict[] {
  const conflicts: CalendarConflict[] = [];

  for (const manual of manualMatches) {
    for (const automatic of automaticMatches) {
      // Conflicto fuerte: mismo cruce exacto
      const sameTeams =
        manual.homeTeam === automatic.homeTeam &&
        manual.awayTeam === automatic.awayTeam;

      if (sameTeams) {
        conflicts.push({ manualMatch: manual, automaticMatch: automatic, reason: 'same_teams' });
        continue;
      }

      // Conflicto medio: algún equipo en común en la misma jornada
      const sharedTeam =
        manual.homeTeam === automatic.homeTeam ||
        manual.homeTeam === automatic.awayTeam ||
        manual.awayTeam === automatic.homeTeam ||
        manual.awayTeam === automatic.awayTeam;

      const sameRound = manual.round === automatic.round;

      if (sharedTeam && sameRound) {
        conflicts.push({
          manualMatch: manual,
          automaticMatch: automatic,
          reason: 'same_round_overlap',
        });
      }
    }
  }

  return conflicts;
}

/**
 * Devuelve true si un partido dado está implicado en algún conflicto.
 * Útil para marcar visualmente la card del partido como conflictiva.
 */
export function isMatchInConflict(matchId: string, conflicts: CalendarConflict[]): boolean {
  return conflicts.some(
    (c) => c.manualMatch.id === matchId || c.automaticMatch.id === matchId
  );
}
