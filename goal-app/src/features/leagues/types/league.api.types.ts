/**
 * Tipos que reflejan la respuesta real del backend de GoalApp
 * para el módulo de ligas. Mantener estos contratos alineados con OpenAPI.
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
 * El endpoint puede devolver solo datos de liga + rol, pero se dejan campos
 * opcionales de equipo por compatibilidad si backend los añade más adelante.
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

/** Respuesta de /equipos/usuario/mi-equipo?liga_id=... */
export interface MyTeamInLeagueResponse {
  id_equipo?: number | null;
  id?: number | null;
  nombre?: string | null;
  escudo?: string | null;
  colores?: string | null;
  id_liga?: number | null;
}

/** Respuesta del flujo de aceptar código de invitación. */
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
  /**
   * Se conserva por compatibilidad con backend, pero los modales móviles ya no
   * muestran ni envían “máximo de partidos”.
   */
  cantidad_partidos?: number | null;
  duracion_partido?: number | null;
  /**
   * Se conserva por compatibilidad de lectura, pero la UI móvil no permite
   * subir ni editar logo de liga.
   */
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
  /**
   * Campo backend. No se muestra en UI móvil; se envía con valor interno/default
   * para mantener el contrato sin exponerlo al usuario.
   */
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
  /** No editable en UI móvil; se conserva internamente por compatibilidad API. */
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
  /** No editable en UI móvil; backend puede seguir devolviéndolo. */
  max_partidos: number;
  created_at?: string;
  updated_at?: string;
}
