/**
 * convocatoriaService.ts
 * Orquesta jugadores, convocatoria existente, límites y validaciones.
 */

import { ApiError } from '@/src/shared/api/client';
import { getLeagueConfig } from '@/src/features/leagues/api/leagues.api';
import { getMatchById } from '@/src/features/matches/api/matches.api';
import type { PartidoApi } from '@/src/features/matches/types/matches.types';
import {
  getConvocatoriaByPartidoEquipo,
  getJugadoresByEquipo,
  saveConvocatoria,
} from '../api/convocatoria.api';
import type {
  ConvocatoriaEquipoData,
  ConvocatoriaLimits,
  ConvocatoriaPlayer,
  ConvocatoriaPlayerState,
  JugadorEquipoApi,
  ServiceResult,
} from '../types/convocatoria.types';

const DEFAULT_LIMITS: ConvocatoriaLimits = {
  minConvocados: 14,
  maxConvocados: 23,
  maxTitulares: 11,
  minutosPartido: 90,
};

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message || `Error ${error.status}`;
  if (error instanceof Error) return error.message;
  return 'Error desconocido';
}

export function normalizePosition(position?: string | null): ConvocatoriaPlayer['posicion'] {
  const value = String(position ?? '').toLowerCase().trim();
  if (['por', 'portero', 'goalkeeper', 'arquero'].includes(value)) return 'POR';
  if (['def', 'defensa', 'defender'].includes(value)) return 'DEF';
  if (['med', 'medio', 'mediocentro', 'centrocampista', 'midfielder'].includes(value)) return 'MED';
  if (['del', 'delantero', 'forward', 'atacante'].includes(value)) return 'DEL';
  return 'OTR';
}

function getPlayerName(player: JugadorEquipoApi): string {
  return (
    player.usuario?.nombre ||
    player.nombre ||
    player.usuario?.email ||
    player.email ||
    `Jugador ${player.id_jugador}`
  );
}

function getPlayerDorsal(player: JugadorEquipoApi): string {
  if (player.dorsal === null || player.dorsal === undefined || player.dorsal === '') return '-';
  return String(player.dorsal);
}

function getMatchDate(match: PartidoApi): string | null {
  return match.fecha_hora ?? match.fecha ?? null;
}

function isConvocationLocked(match: PartidoApi | null): { locked: boolean; reason?: string } {
  const rawDate = match ? getMatchDate(match) : null;
  if (!rawDate) return { locked: false };
  const matchDate = new Date(rawDate);
  if (Number.isNaN(matchDate.getTime())) return { locked: false };
  const lockTime = matchDate.getTime() - 60 * 60 * 1000;
  if (Date.now() >= lockTime) {
    return { locked: true, reason: 'La convocatoria se bloquea automáticamente 1 hora antes del inicio.' };
  }
  return { locked: false };
}

async function getLimitsFromLeague(ligaId?: number): Promise<ConvocatoriaLimits> {
  if (!ligaId) return DEFAULT_LIMITS;
  try {
    const config = await getLeagueConfig(ligaId);
    return {
      minConvocados: Number(config.min_convocados ?? DEFAULT_LIMITS.minConvocados),
      maxConvocados: Number(config.max_convocados ?? DEFAULT_LIMITS.maxConvocados),
      maxTitulares: 11,
      minutosPartido: Number(config.minutos_partido ?? DEFAULT_LIMITS.minutosPartido),
    };
  } catch {
    return DEFAULT_LIMITS;
  }
}

export async function getConvocatoriaEquipoService(partidoId: number, equipoId: number): Promise<ConvocatoriaEquipoData> {
  const [match, jugadores, convocatoria] = await Promise.all([
    getMatchById(partidoId).catch(() => null),
    getJugadoresByEquipo(equipoId),
    getConvocatoriaByPartidoEquipo(partidoId, equipoId),
  ]);

  const titularIds = new Set((convocatoria?.titulares ?? []).map(j => Number(j.id_jugador)));
  const suplenteIds = new Set((convocatoria?.suplentes ?? []).map(j => Number(j.id_jugador)));

  const players: ConvocatoriaPlayer[] = jugadores
    .filter(j => j.activo !== false)
    .map((j) => {
      const id = Number(j.id_jugador);
      let estado: ConvocatoriaPlayerState = 'no_convocado';
      if (titularIds.has(id)) estado = 'titular';
      else if (suplenteIds.has(id)) estado = 'suplente';
      return {
        id: String(id),
        id_jugador: id,
        dorsal: getPlayerDorsal(j),
        nombre: getPlayerName(j),
        posicion: normalizePosition(j.posicion),
        posicionOriginal: j.posicion,
        activo: j.activo !== false,
        estado,
      };
    })
    .sort((a, b) => {
      const posOrder = ['POR', 'DEF', 'MED', 'DEL', 'OTR'];
      const byPos = posOrder.indexOf(a.posicion) - posOrder.indexOf(b.posicion);
      if (byPos !== 0) return byPos;
      const dorsalA = Number.isFinite(Number(a.dorsal)) ? Number(a.dorsal) : 999;
      const dorsalB = Number.isFinite(Number(b.dorsal)) ? Number(b.dorsal) : 999;
      return dorsalA - dorsalB;
    });

  const limits = await getLimitsFromLeague(match?.id_liga);
  const lock = isConvocationLocked(match);

  return {
    partidoId,
    equipoId,
    nombreEquipo: convocatoria?.nombre_equipo,
    jugadores: players,
    limits,
    locked: lock.locked,
    lockReason: lock.reason,
  };
}

export function validateConvocatoriaPlayers(
  jugadores: ConvocatoriaPlayer[],
  limits: ConvocatoriaLimits,
  options?: { allowUnderMin?: boolean },
): string | null {
  const total = jugadores.filter(j => j.estado !== 'no_convocado').length;
  const titulares = jugadores.filter(j => j.estado === 'titular').length;
  if (!options?.allowUnderMin && total < limits.minConvocados) return `Debes convocar al menos ${limits.minConvocados} jugadores.`;
  if (total > limits.maxConvocados) return `No puedes convocar más de ${limits.maxConvocados} jugadores.`;
  if (titulares > limits.maxTitulares) return `No puedes seleccionar más de ${limits.maxTitulares} titulares.`;
  return null;
}

export async function saveConvocatoriaEquipoService(
  partidoId: number,
  jugadores: ConvocatoriaPlayer[],
  limits: ConvocatoriaLimits,
  options?: { allowUnderMin?: boolean },
): Promise<ServiceResult> {
  try {
    const validation = validateConvocatoriaPlayers(jugadores, limits, options);
    if (validation) return { success: false, error: validation };
    await saveConvocatoria({
      id_partido: partidoId,
      jugadores: jugadores
        .filter(j => j.estado !== 'no_convocado')
        .map(j => ({ id_jugador: j.id_jugador, es_titular: j.estado === 'titular' })),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}
