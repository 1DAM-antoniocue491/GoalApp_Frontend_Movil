/**
 * calendarService.ts
 *
 * Orquesta el acceso a datos del calendario.
 *
 * Responsabilidades:
 * - Determinar viewState: no_teams / no_calendar / has_calendar
 * - Mapear PartidoConEquiposCalendario → CalendarMatch
 * - Agrupar CalendarMatch por jornada → CalendarJourney[]
 * - Absorber errores de red y devolver fallbacks seguros
 */

import { logger } from "@/src/shared/utils/logger";
import {
  getPartidosByLeague,
  getJornadasByLeague,
  createCalendarForLeague,
  getCalendarConfig,
  updateCalendarForLeague,
  deleteCalendarForLeague,
  type PartidoConEquiposCalendario,
  type PartidoCalendarioApi,
  type JornadaConPartidosApi,
  type EquipoResumenJornada,
  type CreateCalendarRequest,
} from "../api/calendar.api";
// Reutilizamos la llamada de equipos ya existente para cruzar datos
import { getTeamsByLeague } from "@/src/features/teams/api/teams.api";
import type { EquipoResponse } from "@/src/features/teams/types/teams.types";
import type {
  CalendarJourney,
  CalendarMatch,
  CalendarMatchStatus,
  CalendarViewState,
} from "../types/calendar.types";

// ---------------------------------------------------------------------------
// Normalización de estado
// ---------------------------------------------------------------------------

/**
 * Mapea el estado del backend al status del calendario.
 *
 * Leniente: solo cancelado/cancelled se omite.
 * Todo estado no reconocido se trata como 'programmed' para no silenciar partidos
 * cuando el backend cambia nomenclatura sin avisar.
 */
function normalizarEstado(
  estado: string | undefined | null,
): CalendarMatchStatus | null {
  if (!estado) return "programmed";
  const s = estado.toLowerCase().trim();
  // Únicos estados que se omiten
  if (s === "cancelado" || s === "cancelled") return null;
  // En vivo
  if (s === "en_juego" || s === "en_vivo" || s === "live" || s === "en_curso")
    return "live";
  // Finalizado
  if (
    s === "finalizado" ||
    s === "finished" ||
    s === "completado" ||
    s === "terminado"
  )
    return "finished";
  // Programado (incluye cualquier desconocido)
  return "programmed";
}

// ---------------------------------------------------------------------------
// Parseo de fecha
// ---------------------------------------------------------------------------

const MESES = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
];

/**
 * Convierte la fecha del backend a los formatos que esperan las cards.
 * Devuelve guiones si la fecha viene vacía o no se puede parsear para no romper la UI.
 */
function parseFechaHora(fechaHora: string | null | undefined) {
  if (!fechaHora)
    return { day: "–", month: "–", time: "–", dateFormatted: "–" };
  try {
    const d = new Date(fechaHora);
    if (isNaN(d.getTime()))
      return { day: "–", month: "–", time: "–", dateFormatted: "–" };
    const day = String(d.getDate());
    const month = MESES[d.getMonth()] ?? "–";
    const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    return { day, month, time, dateFormatted: `${day} ${month}` };
  } catch {
    return { day: "–", month: "–", time: "–", dateFormatted: "–" };
  }
}

// ---------------------------------------------------------------------------
// Mapper DTO → CalendarMatch
// ---------------------------------------------------------------------------

function mapPartidoToCalendarMatch(
  partido: PartidoConEquiposCalendario,
  leagueName: string,
): CalendarMatch | null {
  const status = normalizarEstado(partido.estado);
  if (!status) return null; // omitir cancelados y estados no reconocidos

  const jornada = partido.jornada;
  const round =
    jornada?.nombre ??
    (jornada?.numero != null ? `Jornada ${jornada.numero}` : "–");
  const { day, month, time, dateFormatted } = parseFechaHora(
    partido.fecha_hora,
  );

  return {
    id: String(partido.id_partido),
    homeTeam: partido.equipo_local.nombre,
    awayTeam: partido.equipo_visitante.nombre,
    status,
    // El endpoint con-equipos no distingue manual/automático; se asume automático.
    source: "automatic",
    round,
    venue: partido.estadio ?? "",
    leagueName,
    // Campos de fecha — usados según el status de la card
    day,
    month,
    time,
    date: dateFormatted,
    // Marcador — presente en live y finished; 0 por defecto en programado
    homeScore: partido.goles_local ?? 0,
    awayScore: partido.goles_visitante ?? 0,
    minute: partido.minuto_actual ?? 0,
    // Visual
    homeColor: partido.equipo_local.color_primario ?? undefined,
    awayColor: partido.equipo_visitante.color_primario ?? undefined,
    homeShieldLetter: partido.equipo_local.nombre.charAt(0).toUpperCase(),
    awayShieldLetter: partido.equipo_visitante.nombre.charAt(0).toUpperCase(),
  };
}

// ---------------------------------------------------------------------------
// Helpers para resolver equipos y jornadas del endpoint /jornadas
// ---------------------------------------------------------------------------

/**
 * Extrae el ID numérico de un objeto de equipo embebido.
 * Acepta id_equipo o id como alternativas.
 */
function getTeamId(
  team: EquipoResumenJornada | null | undefined,
): number | null {
  const raw = team?.id_equipo ?? team?.id;
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Extrae el número REAL del backend para una jornada.
 * Prueba múltiples nombres de campo.
 * Si ninguno es válido, usa el índice (base-1).
 */
function getBackendJourneyNumber(
  jornadaItem: JornadaConPartidosApi,
  index: number,
): number {
  const raw =
    jornadaItem.jornada ??
    jornadaItem.numero_jornada ??
    jornadaItem.num_jornada ??
    jornadaItem.numero;

  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;

  return index + 1;
}

// ---------------------------------------------------------------------------
// Normalizador de la respuesta cruda de /jornadas
// ---------------------------------------------------------------------------

/**
 * Agrupa un array plano de partidos por su campo de jornada.
 * Caso C: backend devuelve partidos directamente sin agrupar.
 */
function groupFlatPartidos(
  partidos: PartidoCalendarioApi[],
): JornadaConPartidosApi[] {
  const map = new Map<number, PartidoCalendarioApi[]>();
  for (const p of partidos) {
    const num = p.jornada ?? p.numero_jornada ?? p.num_jornada ?? 1;
    const existing = map.get(num) ?? [];
    existing.push(p);
    map.set(num, existing);
  }
  return Array.from(map.entries()).map(([jornada, ps]) => ({
    jornada,
    partidos: ps,
  }));
}

/**
 * Normaliza la respuesta cruda de GET /jornadas para soportar:
 * - Caso A: [{jornada: 18, partidos: [...]}]  ← agrupado
 * - Caso B: {jornadas: [{jornada: 18, partidos: [...]}]}  ← wrapped
 * - Caso C: [{id_partido: 1, jornada: 18, ...}]  ← plano
 */
function normalizeJornadasResponse(raw: unknown): JornadaConPartidosApi[] {
  // Caso B: {jornadas: [...]}
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const wrapped = raw as Record<string, unknown>;
    if (Array.isArray(wrapped.jornadas)) {
      return wrapped.jornadas as JornadaConPartidosApi[];
    }
    return [];
  }

  if (!Array.isArray(raw) || raw.length === 0) return [];

  const first = raw[0] as Record<string, unknown>;

  // Caso A: array de objetos con campo 'partidos'
  if ("partidos" in first || "jornada" in first || "numero_jornada" in first) {
    return raw as JornadaConPartidosApi[];
  }

  // Caso C: array plano de partidos (tienen id_partido)
  if ("id_partido" in first) {
    return groupFlatPartidos(raw as PartidoCalendarioApi[]);
  }

  return raw as JornadaConPartidosApi[];
}

/**
 * Resuelve el color de un equipo priorizando el mapa real de equipos.
 */
function resolveTeamColor(
  embeddedTeam: EquipoResumenJornada | null | undefined,
  mappedTeam: EquipoResponse | undefined,
): string | undefined {
  return (
    mappedTeam?.color_primario ??
    embeddedTeam?.color_primario ??
    embeddedTeam?.colores ??
    undefined
  );
}

// ---------------------------------------------------------------------------
// Mapper flexible para partidos de /jornadas
// ---------------------------------------------------------------------------

/**
 * Mapea un PartidoCalendarioApi → CalendarMatch cruzando con el mapa de equipos.
 * El mapa teamsById se construye a partir de GET /equipos/?liga_id y es la fuente
 * de verdad para nombres y colores cuando el endpoint /jornadas no los embebe.
 */
function mapPartidoJornadaToCalendarMatch(
  partido: PartidoCalendarioApi,
  jornadaNum: number,
  leagueName: string,
  teamsById: Map<number, EquipoResponse>,
): CalendarMatch | null {
  const status = normalizarEstado(partido.estado ?? "");
  if (!status) return null;

  // Fecha flexible
  const rawDate = partido.fecha_hora ?? partido.fecha;
  const { day, month, time, dateFormatted } = parseFechaHora(rawDate);

  // Resolver equipo local: priorizar mapa real de equipos
  const homeId =
    partido.id_equipo_local ?? getTeamId(partido.equipo_local) ?? undefined;
  const homeMapped = homeId != null ? teamsById.get(homeId) : undefined;
  const homeName =
    homeMapped?.nombre ??
    partido.equipo_local?.nombre ??
    (homeId != null ? `Equipo ${homeId}` : "Equipo local");

  // Resolver equipo visitante
  const awayId =
    partido.id_equipo_visitante ??
    getTeamId(partido.equipo_visitante) ??
    undefined;
  const awayMapped = awayId != null ? teamsById.get(awayId) : undefined;
  const awayName =
    awayMapped?.nombre ??
    partido.equipo_visitante?.nombre ??
    (awayId != null ? `Equipo ${awayId}` : "Equipo visitante");

  const homeColor = resolveTeamColor(partido.equipo_local, homeMapped);
  const awayColor = resolveTeamColor(partido.equipo_visitante, awayMapped);

  return {
    id: String(partido.id_partido),
    homeTeam: homeName,
    awayTeam: awayName,
    status,
    source: "automatic",
    round: `Jornada ${jornadaNum}`,
    venue: partido.estadio ?? "",
    leagueName,
    day,
    month,
    time,
    date: dateFormatted,
    homeScore: partido.goles_local ?? 0,
    awayScore: partido.goles_visitante ?? 0,
    minute: partido.minuto_actual ?? 0,
    homeColor,
    awayColor,
    homeShieldLetter: homeName.charAt(0).toUpperCase(),
    awayShieldLetter: awayName.charAt(0).toUpperCase(),
  };
}

/**
 * Transforma JornadaConPartidosApi[] → CalendarJourney[].
 *
 * number      = índice visual secuencial (1, 2, 3...) — para navegación y UI
 * backendNumber = número real del backend (18, 19...) — para depuración
 *
 * Usa teamsById para resolver nombres reales de equipos.
 */
function mapJornadasToCalendarJourneys(
  jornadas: JornadaConPartidosApi[],
  leagueName: string,
  teamsById: Map<number, EquipoResponse>,
): CalendarJourney[] {
  // Ordenar por número backend antes de asignar índice visual
  const sorted = [...jornadas].sort((a, b) => {
    const aNum = getBackendJourneyNumber(a, 0);
    const bNum = getBackendJourneyNumber(b, 0);
    return aNum - bNum;
  });

  const result: CalendarJourney[] = [];

  sorted.forEach((j, index) => {
    const backendNumber = getBackendJourneyNumber(j, index);
    const visualNumber = index + 1; // 1, 2, 3...
    const partidos = j.partidos ?? [];

    const matches = partidos
      .map((p) =>
        mapPartidoJornadaToCalendarMatch(
          p,
          visualNumber,
          leagueName,
          teamsById,
        ),
      )
      .filter((m): m is CalendarMatch => m !== null);

    // Incluir jornadas aunque tengan 0 matches válidos — el usuario debe poder navegar
    result.push({
      id: String(visualNumber),
      number: visualNumber,
      backendNumber,
      matches,
    });
  });

  logger.debug("[calendar/jornadas]", "Jornadas normalizadas", {
    rawCount: jornadas.length,
    mappedCount: result.length,
    backendNumbers: result.map((j) => j.backendNumber),
    visualNumbers: result.map((j) => j.number),
    matchesPerJourney: result.map((j) => j.matches.length),
  });

  return result;
}

// ---------------------------------------------------------------------------
// Agrupador por jornada (fallback con /con-equipos)
// ---------------------------------------------------------------------------

/**
 * Agrupa los partidos por número de jornada y devuelve CalendarJourney[]
 * ordenadas ascendentemente.
 * Los partidos sin jornada asignada van a jornada 1 como fallback.
 */
function groupByJornada(
  partidos: PartidoConEquiposCalendario[],
  leagueName: string,
): CalendarJourney[] {
  const jornadaMap = new Map<number, CalendarJourney>();

  for (const partido of partidos) {
    const match = mapPartidoToCalendarMatch(partido, leagueName);
    if (!match) continue;

    const numero = partido.jornada?.numero ?? 1;
    const id = String(partido.jornada?.id_jornada ?? numero);

    if (!jornadaMap.has(numero)) {
      jornadaMap.set(numero, { id, number: numero, matches: [] });
    }
    jornadaMap.get(numero)!.matches.push(match);
  }

  // Ordenar por número backend y reasignar número visual secuencial
  return Array.from(jornadaMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([backendNum, journey], index) => ({
      ...journey,
      number: index + 1, // visual: 1, 2, 3...
      backendNumber: backendNum, // real del backend
    }));
}

// ---------------------------------------------------------------------------
// Resultado del servicio
// ---------------------------------------------------------------------------

export interface CalendarData {
  journeys: CalendarJourney[];
  viewState: CalendarViewState;
}

// ---------------------------------------------------------------------------
// Servicio exportado
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Helpers de conversión para crear calendario
// ---------------------------------------------------------------------------

/**
 * Convierte fecha UI (DD/MM/YYYY o YYYY-MM-DD o ISO) a YYYY-MM-DD.
 * El DateTimePickerField puede devolver cualquiera de estos formatos.
 */
function toApiDate(startDate: string): string {
  const parts = startDate.split("/");
  if (parts.length === 3) {
    // DD/MM/YYYY → YYYY-MM-DD
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // Ya es YYYY-MM-DD o ISO → recortar a la parte de fecha
  return startDate.split("T")[0];
}

/**
 * Convierte días de la UI (0=Lun … 6=Dom) al formato de la API (1=Lun … 6=Sáb, 0=Dom).
 */
function toApiDays(uiDays: number[]): number[] {
  return uiDays.map((i) => (i === 6 ? 0 : i + 1));
}

/** Input del formulario de creación/edición de calendario (espejo de CalendarConfigData) */
export interface CreateCalendarInput {
  type: "one_way" | "two_way";
  /** Fecha en formato UI: DD/MM/YYYY, YYYY-MM-DD o ISO */
  startDate: string;
  /** Índices UI: 0=Lun, 1=Mar, ..., 5=Sáb, 6=Dom */
  matchDays: number[];
  /** HH:MM */
  matchTime: string;
}

/**
 * Convierte fecha API (YYYY-MM-DD) a formato UI (DD/MM/YYYY).
 */
function fromApiDate(fechaInicio: string): string {
  const parts = fechaInicio.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return fechaInicio;
}

/**
 * Convierte días de la API (1=Lun…6=Sáb, 0=Dom) a formato UI (0=Lun…5=Sáb, 6=Dom).
 */
function fromApiDays(apiDays: number[]): number[] {
  return apiDays.map((d) => (d === 0 ? 6 : d - 1));
}

// ---------------------------------------------------------------------------
// Servicio
// ---------------------------------------------------------------------------

/** Resultado estándar para operaciones de escritura del servicio */
export interface ServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export const calendarService = {
  /**
   * Crea el calendario automático de la liga.
   * Nunca lanza: devuelve {success, data, error} para control en UI.
   *
   * Errores controlados:
   * - 400/422: mensaje del backend (datos inválidos)
   * - 409: calendario ya existe
   * - 500+: error interno del servidor
   * - red/timeout: error de conexión
   */
  async createCalendar(
    ligaId: number,
    input: CreateCalendarInput,
  ): Promise<ServiceResult> {
    // El formulario usa nombres pensados para UI; aquí se traduce al contrato real de la API.
    const payload: CreateCalendarRequest = {
      tipo: input.type === "one_way" ? "ida" : "ida_vuelta",
      fecha_inicio: toApiDate(input.startDate),
      dias_partido: toApiDays(input.matchDays),
      hora: input.matchTime,
    };
    try {
      const data = await createCalendarForLeague(ligaId, payload);
      return { success: true, data };
    } catch (err: unknown) {
      const axiosError = err as {
        response?: {
          status?: number;
          data?: { detail?: string; message?: string };
        };
      };
      const status = axiosError?.response?.status;
      const detail =
        axiosError?.response?.data?.detail ??
        axiosError?.response?.data?.message;

      if (status === 409) {
        return {
          success: false,
          error: "Ya existe un calendario para esta liga.",
        };
      }
      if (status === 400 || status === 422) {
        return {
          success: false,
          error: detail ?? "Datos incorrectos. Revisa el formulario.",
        };
      }
      if (status != null && status >= 500) {
        return {
          success: false,
          error: "Error del servidor. Inténtalo de nuevo.",
        };
      }
      logger.warn("calendarService", "createCalendar error", {
        ligaId,
        status,
        error: err instanceof Error ? err.message : String(err),
      });
      return {
        success: false,
        error: "No se pudo crear el calendario. Comprueba la conexión.",
      };
    }
  },

  /**
   * Obtiene la configuración actual del calendario en formato UI.
   * Usado para precargar el formulario en modo edición.
   */
  async fetchCalendarConfig(
    ligaId: number,
  ): Promise<ServiceResult<CreateCalendarInput>> {
    try {
      const raw = await getCalendarConfig(ligaId);
      const input: CreateCalendarInput = {
        type: raw.tipo === "ida" ? "one_way" : "two_way",
        startDate: fromApiDate(raw.fecha_inicio),
        matchDays: fromApiDays(raw.dias_partido),
        matchTime: raw.hora,
      };
      return { success: true, data: input };
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number } };
      const status = axiosError?.response?.status;
      if (status === 404) {
        return {
          success: false,
          error: "No se encontró la configuración del calendario.",
        };
      }
      logger.warn("calendarService", "fetchCalendarConfig error", {
        ligaId,
        error: err instanceof Error ? err.message : String(err),
      });
      return { success: false, error: "No se pudo cargar la configuración." };
    }
  },

  /**
   * Actualiza el calendario existente con nueva configuración.
   * PUT /partidos/ligas/{liga_id}/calendario — elimina el anterior y regenera.
   */
  async updateCalendar(
    ligaId: number,
    input: CreateCalendarInput,
  ): Promise<ServiceResult> {
    const payload: CreateCalendarRequest = {
      tipo: input.type === "one_way" ? "ida" : "ida_vuelta",
      fecha_inicio: toApiDate(input.startDate),
      dias_partido: toApiDays(input.matchDays),
      hora: input.matchTime,
    };
    try {
      const data = await updateCalendarForLeague(ligaId, payload);
      return { success: true, data };
    } catch (err: unknown) {
      const axiosError = err as {
        response?: {
          status?: number;
          data?: { detail?: string; message?: string };
        };
      };
      const status = axiosError?.response?.status;
      const detail =
        axiosError?.response?.data?.detail ??
        axiosError?.response?.data?.message;
      if (status === 400 || status === 422) {
        return {
          success: false,
          error: detail ?? "Datos incorrectos. Revisa el formulario.",
        };
      }
      if (status != null && status >= 500) {
        return {
          success: false,
          error: "Error del servidor. Inténtalo de nuevo.",
        };
      }
      logger.warn("calendarService", "updateCalendar error", {
        ligaId,
        error: err instanceof Error ? err.message : String(err),
      });
      return { success: false, error: "No se pudo actualizar el calendario." };
    }
  },

  /**
   * Elimina el calendario completo de la liga (partidos + jornadas).
   * DELETE /partidos/ligas/{liga_id}/calendario
   */
  async deleteCalendar(
    ligaId: number,
  ): Promise<
    ServiceResult<{ partidos_eliminados: number; jornadas_eliminadas: number }>
  > {
    try {
      const data = await deleteCalendarForLeague(ligaId);
      return { success: true, data };
    } catch (err: unknown) {
      const axiosError = err as {
        response?: {
          status?: number;
          data?: { detail?: string; message?: string };
        };
      };
      const status = axiosError?.response?.status;
      if (status === 403) {
        return {
          success: false,
          error: "No tienes permisos para eliminar el calendario.",
        };
      }
      if (status != null && status >= 500) {
        return {
          success: false,
          error: "Error del servidor. Inténtalo de nuevo.",
        };
      }
      logger.warn("calendarService", "deleteCalendar error", {
        ligaId,
        error: err instanceof Error ? err.message : String(err),
      });
      return { success: false, error: "No se pudo eliminar el calendario." };
    }
  },

  /**
   * Carga jornadas de la liga, determina el viewState y devuelve CalendarJourney[].
   *
   * Prioridad:
   * 1. GET /equipos/?liga_id → construir mapa de equipos reales (nombres, colores)
   * 2. GET /partidos/ligas/{id}/jornadas → fuente principal de partidos/jornadas
   * 3. GET /partidos/ligas/{id}/con-equipos → fallback si /jornadas falla
   *
   * Nunca lanza: devuelve estado seguro si todos los endpoints fallan.
   */
  async getCalendarData(
    ligaId: number,
    leagueName: string,
  ): Promise<CalendarData> {
    // 1. Cargar equipos reales — fuente de nombres y colores
    let teams: EquipoResponse[] = [];
    try {
      teams = await getTeamsByLeague(ligaId);
    } catch (err) {
      logger.warn("calendarService", "getTeamsByLeague falló", {
        ligaId,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    if (teams.length === 0) {
      return { journeys: [], viewState: "no_teams" };
    }

    // Mapa id_equipo → EquipoResponse para resolución rápida en el mapper
    const teamsById = new Map<number, EquipoResponse>();
    for (const t of teams) {
      teamsById.set(t.id_equipo, t);
    }

    // 2. Intentar /jornadas (fuente principal)
    try {
      const rawResponse = await getJornadasByLeague(ligaId);

      // Log de auditoría — forma real de la respuesta
      logger.debug("[calendar/jornadas]", "Respuesta cruda de jornadas", {
        ligaId,
        isArray: Array.isArray(rawResponse),
        isObject:
          !Array.isArray(rawResponse) && typeof rawResponse === "object",
        firstItemKeys:
          Array.isArray(rawResponse) && rawResponse[0]
            ? Object.keys(rawResponse[0] as object)
            : null,
        firstMatchKeys:
          Array.isArray(rawResponse) &&
          (rawResponse[0] as JornadaConPartidosApi)?.partidos?.[0]
            ? Object.keys(
                (rawResponse[0] as JornadaConPartidosApi)
                  .partidos![0] as object,
              )
            : null,
      });

      const jornadas = normalizeJornadasResponse(rawResponse);

      logger.debug(
        "calendarService/getCalendarData",
        "Jornadas normalizadas recibidas",
        {
          ligaId,
          jornadasCount: jornadas.length,
          totalMatches: jornadas.reduce(
            (acc, j) => acc + (j.partidos?.length ?? 0),
            0,
          ),
        },
      );

      if (jornadas.length > 0) {
        const journeys = mapJornadasToCalendarJourneys(
          jornadas,
          leagueName,
          teamsById,
        );
        // has_calendar si hay al menos una jornada (aunque tenga 0 matches por filtro de estado)
        if (journeys.length > 0) {
          return { journeys, viewState: "has_calendar" };
        }
      }
    } catch (err) {
      logger.warn(
        "calendarService",
        "getJornadasByLeague falló, intentando fallback",
        {
          ligaId,
          error: err instanceof Error ? err.message : String(err),
        },
      );
    }

    // 3. Fallback: /con-equipos
    let partidos: PartidoConEquiposCalendario[] = [];
    try {
      partidos = await getPartidosByLeague(ligaId);
    } catch (err) {
      logger.warn(
        "calendarService",
        "getPartidosByLeague (fallback) también falló",
        {
          ligaId,
          error: err instanceof Error ? err.message : String(err),
        },
      );
    }

    if (partidos.length === 0) {
      return { journeys: [], viewState: "no_calendar" };
    }

    const journeys = groupByJornada(partidos, leagueName);
    return { journeys, viewState: "has_calendar" };
  },
};
