/**
 * Tipos para el módulo de estadísticas de liga
 */

export interface SeasonStatsResponse {
  total_partidos: number;
  total_goles: number;
  promedio_goles_por_partido: number;
  total_amarillas: number;
  total_rojas: number;
  total_asistencias: number;
  equipos_participantes: number;
  jugadores_registrados: number;
}

export interface TopScorerResponse {
  id_jugador: number;
  id_usuario: number;
  id_equipo: number;
  nombre: string;
  nombre_equipo: string;
  escudo_equipo: string | null;
  goles: number;
  partidos_jugados: number;
  promedio_goles: number;
}

export interface MatchdayMVP {
  id_jugador: number;
  id_usuario: number;
  nombre: string;
  nombre_equipo: string;
  escudo_equipo: string | null;
  rating: number;
  goles: number;
  asistencias: number;
  jornada: number;
}

export interface TeamGoalsStats {
  id_equipo: number;
  nombre: string;
  escudo: string | null;
  goles_favor: number;
  goles_contra: number;
  diferencia_goles: number;
  promedio_goles_favor: number;
  partidos_jugados: number;
}

export interface PlayerPersonalStats {
  id_jugador: number;
  id_usuario: number;
  nombre: string;
  nombre_equipo: string;
  escudo_equipo: string | null;
  goles: number;
  asistencias: number;
  tarjetas_amarillas: number;
  tarjetas_rojas: number;
  partidos_jugados: number;
  veces_mvp: number;
}

/** Devuelve el valor si es string no vacío, o fallback */
export function safeString(value: unknown, fallback = ''): string {
  if (typeof value === 'string' && value.trim() !== '') return value;
  return fallback;
}

/** Devuelve el valor si es número válido, o fallback */
export function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && !isNaN(value)) return value;
  return fallback;
}

/** Genera iniciales a partir del nombre (máximo 2 caracteres) */
export function getInitials(name: string): string {
  const safe = safeString(name, '?');
  return safe
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
