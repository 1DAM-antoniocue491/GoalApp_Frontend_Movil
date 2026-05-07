/**
 * Tipos que reflejan la respuesta real del backend de GoalApp
 * para el módulo de ligas. No modificar sin verificar contra la API.
 */

/** Respuesta de una liga individual desde el backend */
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
 * Respuesta de GET /usuarios/me/ligas
 * El backend devuelve un objeto plano (no anidado bajo "liga").
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
}

/** Body para POST /ligas/ */
export interface LigaCreateRequest {
  nombre: string;
  temporada: string;
  categoria?: string | null;
  activa?: boolean;
  cantidad_partidos?: number | null;
  duracion_partido?: number | null;
  logo_url?: string | null;
}

/**
 * Body para PUT /ligas/{liga_id}
 * Todos los campos son opcionales: solo se envían los que cambian.
 */
export interface LigaUpdateRequest {
  nombre?: string;
  temporada?: string;
  categoria?: string | null;
  activa?: boolean;
  cantidad_partidos?: number | null;
  duracion_partido?: number | null;
  logo_url?: string | null;
}

/**
 * Body para POST /ligas/{liga_id}/configuracion (primera vez, campos obligatorios).
 * Usado por createLeagueWithConfig.
 */
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

/**
 * Body para PUT /ligas/{liga_id}/configuracion (edición).
 * Todos los campos son opcionales para permitir actualizaciones parciales.
 */
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

/**
 * Respuesta de GET /ligas/{liga_id}/configuracion
 * Refleja todos los parámetros de configuración de la liga.
 */
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

/**
 * Respuesta flexible del endpoint de unirse a liga mediante código.
 * El backend puede devolver solo mensaje o también los IDs de seguimiento/liga.
 */
export interface JoinLeagueByCodeResponse {
  mensaje?: string;
  detail?: string;
  id_seguimiento?: number;
  id_usuario?: number;
  id_liga?: number;
  id_usuario_rol?: number;
  rol?: string;
  liga_nombre?: string;
}

/**
 * Respuesta de GET /invitaciones/validar-codigo/{codigo}.
 * Es el contrato real expuesto por el backend para comprobar códigos
 * antes de aceptarlos con el usuario autenticado.
 */
export interface InvitacionValidarResponse {
  valido: boolean;
  email?: string | null;
  nombre?: string | null;
  liga_nombre?: string | null;
  equipo_nombre?: string | null;
  rol?: string | null;
  dorsal?: string | null;
  posicion?: string | null;
  tipo_jugador?: string | null;
  motivo?: string | null;
}
