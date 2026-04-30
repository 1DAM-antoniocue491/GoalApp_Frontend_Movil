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

/** Body para POST /ligas/{liga_id}/configuracion y PUT /ligas/{liga_id}/configuracion */
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
