/**
 * convocatoria.types.ts
 *
 * Tipos reales para convocatorias y alineaciones.
 * Contrato backend usado:
 * GET    /convocatorias/partido/{partidoId}/equipo/{equipoId}
 * GET    /jugadores/?equipo_id={equipoId}
 * POST   /convocatorias/
 * DELETE /convocatorias/partido/{partidoId}
 */

export type PlayerPositionCode = 'POR' | 'DEF' | 'MED' | 'DEL' | 'OTR';
export type ConvocatoriaPlayerState = 'titular' | 'suplente' | 'no_convocado';

export interface UsuarioJugadorApi {
  id_usuario?: number;
  nombre?: string | null;
  email?: string | null;
}

export interface JugadorEquipoApi {
  id_jugador: number;
  id_usuario?: number;
  id_equipo: number;
  posicion?: string | null;
  dorsal?: number | string | null;
  activo?: boolean;
  usuario?: UsuarioJugadorApi | null;
  nombre?: string | null;
  email?: string | null;
}

export interface JugadorConvocadoApi {
  id_jugador: number;
  nombre?: string | null;
  dorsal?: number | string | null;
  posicion?: string | null;
  es_titular: boolean;
}

export interface ConvocatoriaResponse {
  id_partido: number;
  id_equipo: number;
  nombre_equipo?: string | null;
  titulares: JugadorConvocadoApi[];
  suplentes: JugadorConvocadoApi[];
}

export interface ConvocatoriaCreatePayload {
  id_partido: number;
  jugadores: Array<{
    id_jugador: number;
    es_titular: boolean;
  }>;
}

export interface ConvocatoriaPlayer {
  id: string;
  id_jugador: number;
  dorsal: string;
  nombre: string;
  posicion: PlayerPositionCode;
  posicionOriginal?: string | null;
  activo: boolean;
  estado: ConvocatoriaPlayerState;
}

export interface ConvocatoriaLimits {
  minConvocados: number;
  maxConvocados: number;
  maxTitulares: number;
  minutosPartido: number;
}

export interface ConvocatoriaEquipoData {
  partidoId: number;
  equipoId: number;
  nombreEquipo?: string | null;
  jugadores: ConvocatoriaPlayer[];
  limits: ConvocatoriaLimits;
  locked: boolean;
  lockReason?: string;
}

export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
