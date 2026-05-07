/**
 * Tipos que reflejan la respuesta real del backend de GoalApp
 * para el módulo de ligas. No modificar sin verificar contra la API.
 */

export interface LigaResponse {
  id_liga: number;
  nombre: string;
  temporada: string;
  activa: boolean;
  logo_url?: string | null;
  categoria?: string | null;
  equipos_total?: number;
}

/**
 * Respuesta de GET /usuarios/me/ligas.
 *
 * El OpenAPI actual solo garantiza: id_liga, nombre, temporada, activa, rol y equipos_total.
 * Se dejan campos opcionales defensivos por si backend añade equipo asignado en el futuro.
 */
export interface LigaConRolResponse {
  id_liga: number;
  nombre: string;
  temporada: string;
  activa: boolean;
  rol: string;
  logo_url?: string | null;
  categoria?: string | null;
  equipos_total?: number;

  // Campos opcionales para equipo asignado si el backend los añade.
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

export interface MyTeamInLeagueResponse {
  id_equipo?: number | null;
  id?: number | null;
  nombre?: string | null;
  escudo?: string | null;
  colores?: string | null;
  id_liga?: number | null;
}

export interface JoinLeagueByCodeResponse {
  mensaje?: string;
  message?: string;
  id_liga?: number;
  liga_id?: number;
  codigo?: string;
}

export interface LigaCreateRequest {
  nombre: string;
  temporada: string;
  categoria?: string | null;
  activa?: boolean;
  cantidad_partidos?: number | null;
  duracion_partido?: number | null;
  logo_url?: string | null;
}

export interface LigaUpdateRequest {
  nombre?: string;
  temporada?: string;
  categoria?: string | null;
  activa?: boolean;
  cantidad_partidos?: number | null;
  duracion_partido?: number | null;
  logo_url?: string | null;
}

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
