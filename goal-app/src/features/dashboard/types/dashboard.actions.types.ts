export interface LeagueRequest {
  nombre: string;
  temporada: string;
  categoria: string;
  cantidad_partidos: number;
  duracion_partido: number;
  logo_url: string;
  activa: boolean;
}

export interface LeagueResponse {
  id_liga: number;
  nombre: string;
  temporada: string;
  categoria: string;
  cantidad_partidos: number;
  duracion_partido: number;
  logo_url: string;
  activa: boolean;
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
  created_at?: string;
  updated_at?: string;
}