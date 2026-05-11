/**
 * Tipos que reflejan la respuesta real del backend de GoalApp
 * para el módulo de ligas. No modificar sin verificar contra la API.
 */

/** Respuesta de una liga individual desde el backend. */
export interface LigaResponse {
  id_liga: number;
  nombre: string;
  temporada: string;
  activa: boolean;
  logo_url?: string | null;
  categoria?: string;
  equipos_total?: number;
}

/**
 * Respuesta de GET /usuarios/me/ligas.
 *
 * El backend devuelve ligas con el rol del usuario autenticado. Algunos
 * despliegues pueden incluir datos del equipo asignado; por eso se dejan
 * campos opcionales defensivos para evitar romper el mapeo si aparecen.
 */
export interface LigaConRolResponse {
  id_liga: number;
  nombre: string;
  temporada: string;
  activa: boolean;
  rol: string;
  logo_url?: string | null;
  categoria?: string;
  equipos_total?: number;

  id_equipo?: number | null;
  equipo_id?: number | null;
  nombre_equipo?: string | null;
  equipo_nombre?: string | null;
  mi_equipo?: string | null;
  miEquipo?: string | null;
  equipo?: {
    id_equipo?: number | null;
    id?: number | null;
    nombre?: string | null;
    escudo?: string | null;
  } | null;
}

/** Respuesta de GET /usuarios/me/ligas-seguidas. */
export interface LigaSeguidaResponse {
  id_liga: number;
  nombre?: string;
  temporada?: string;
  activa?: boolean;
}

/** Respuesta de POST /usuarios/me/ligas/{liga_id}/seguir. */
export interface SeguimientoResponse {
  id_seguimiento: number;
  id_usuario: number;
  id_liga: number;
  created_at?: string;
}

/** Respuesta de DELETE /usuarios/me/ligas/{liga_id}/seguir. */
export interface DejarSeguirResponse {
  mensaje?: string;
  message?: string;
}

/** Respuesta de PUT /ligas/{liga_id}/reactivar. */
export interface ReactivateLeagueResponse {
  mensaje?: string;
  message?: string;
  liga?: LigaResponse;
}

/** Equipo asignado al usuario dentro de una liga. */
export interface MyTeamInLeagueResponse {
  id_equipo?: number | null;
  id?: number | null;
  nombre?: string | null;
  escudo?: string | null;
  colores?: string | null;
  id_liga?: number | null;
}

/** Respuesta de aceptar código de unión. */
export interface JoinLeagueByCodeResponse {
  mensaje?: string;
  message?: string;
  id_liga?: number;
  liga_id?: number;
  codigo?: string;
}

/** Body para POST /ligas/. */
export interface LigaCreateRequest {
  nombre: string;
  temporada: string;
  categoria?: string | null;
  activa?: boolean;
  cantidad_partidos?: number | null;
  duracion_partido?: number | null;
  logo_url?: string | null;
}

/** Body para PUT /ligas/{liga_id}. */
export interface LigaUpdateRequest {
  nombre?: string;
  temporada?: string;
  categoria?: string | null;
  activa?: boolean;
  cantidad_partidos?: number | null;
  duracion_partido?: number | null;
  logo_url?: string | null;
}

/** Body para POST /ligas/{liga_id}/configuracion. */
export interface LigaConfiguracionRequest {
  hora_partidos?: string;
  min_equipos: number;
  max_equipos: number;
  min_convocados: number;
  max_convocados: number;
  min_plantilla: number;
  max_plantilla: number;
  min_jugadores_equipo: number;
  min_partidos_entre_equipos: number;
  minutos_partido: number;
  max_partidos: number;
}

/** Body para PUT /ligas/{liga_id}/configuracion. */
export interface UpdateLeagueConfigRequest {
  hora_partidos?: string;
  min_equipos?: number;
  max_equipos?: number;
  min_convocados?: number;
  max_convocados?: number;
  min_plantilla?: number;
  max_plantilla?: number;
  min_jugadores_equipo?: number;
  min_partidos_entre_equipos?: number;
  minutos_partido?: number;
  max_partidos?: number;
}

/** Respuesta de GET /ligas/{liga_id}/configuracion. */
export interface LeagueConfigResponse {
  id_configuracion: number;
  id_liga: number;
  hora_partidos: string;
  min_equipos: number;
  max_equipos: number;
  min_convocados: number;
  max_convocados: number;
  min_plantilla: number;
  max_plantilla: number;
  min_jugadores_equipo: number;
  min_partidos_entre_equipos: number;
  minutos_partido: number;
  max_partidos: number;
  created_at?: string;
  updated_at?: string;
}
