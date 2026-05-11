/**
 * notificationsService
 *
 * Orquestación entre la UI y la API.
 * - Mapper NotificationResponse → AppNotification
 * - Derivar categoría desde `tipo` (no desde `tipo_referencia`)
 * - Derivar ruta de navegación desde `tipo_referencia` + `id_referencia`
 * - Todas las mutaciones devuelven ServiceResult — nunca lanzan
 */

import { routes } from '@/src/shared/config/routes';
import type { ServiceResult } from '@/src/features/leagues/services/leagueService';
import type {
  AppNotification,
  NotificationCategory,
  NotificationResponse,
  NotificationType,
} from '../types/notifications.types';
import {
  deleteNotification,
  getNotifications,
  getUnreadNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../api/notifications.api';

// ─── Clasificación por tipo ──────────────────────────────────────────────────

/**
 * Calcula la categoría UI a partir del campo `tipo` del backend.
 * Nunca usar `tipo_referencia` para clasificar.
 */
export function getNotificationCategory(tipo: string): NotificationCategory {
  switch (tipo) {
    case 'partido_en_juego':
      return 'live';

    case 'partido_finalizado':
    case 'partido_cancelado':
    case 'resultado':
      return 'results';

    case 'convocatoria':
    case 'convocatoria_actualizada':
    case 'convocatoria_eliminada':
    case 'jugador_nuevo':
    case 'rol_asignado':
    case 'rol_revocado':
      return 'teams';

    case 'clasificacion':
      return 'stats';

    default:
      return 'all';
  }
}

// ─── Ruta de navegación ──────────────────────────────────────────────────────

function getNotificationNavigation(
  tipoReferencia: string | null,
  idReferencia: number | null,
  tipo: NotificationType,
): Pick<AppNotification, 'targetRoute' | 'targetParams'> {
  const t = (tipoReferencia ?? tipo).toLowerCase();

  if (t.includes('partido') || t.includes('resultado') || t.includes('gol') || t.includes('tarjeta')) {
    if (t.includes('finalizado') || t.includes('cancelado') || t.includes('resultado')) {
      return {
        targetRoute: routes.matches.finished,
        ...(idReferencia ? { targetParams: { matchId: idReferencia } } : {}),
      };
    }
    if (t.includes('programado')) {
      return {
        targetRoute: routes.matches.programmed,
        ...(idReferencia ? { targetParams: { matchId: idReferencia } } : {}),
      };
    }
    return {
      targetRoute: routes.matches.live,
      ...(idReferencia ? { targetParams: { matchId: idReferencia } } : {}),
    };
  }
  if (t.includes('convocatoria') || t.includes('equipo')) {
    return { targetRoute: routes.league.teams };
  }
  if (t.includes('jugador')) {
    return { targetRoute: routes.league.players };
  }
  if (t.includes('clasificacion') || t.includes('estadistica')) {
    return { targetRoute: routes.private.tabs.statistics };
  }
  return {};
}

// ─── Mapper backend → UI ─────────────────────────────────────────────────────

/**
 * Convierte NotificationResponse del backend en AppNotification para la UI.
 * NUNCA usa n.id — siempre n.id_notificacion.
 * NUNCA usa n.leido — siempre n.leida.
 * NUNCA usa n.fecha_creacion — siempre n.created_at.
 */
export function mapNotificationResponse(n: NotificationResponse): AppNotification {
  const rawId = n.id_notificacion;

  // Fallback robusto si id_notificacion llega undefined por error del backend
  const safeId =
    rawId !== undefined && rawId !== null
      ? String(rawId)
      : `${n.tipo}-${n.id_referencia ?? 'no-ref'}-${n.created_at}`;

  const nav = getNotificationNavigation(n.tipo_referencia, n.id_referencia, n.tipo);

  return {
    id: safeId,
    rawId: rawId ?? -1,
    type: n.tipo,
    title: n.titulo,
    body: n.mensaje,
    isRead: n.leida,
    createdAt: n.created_at,
    referenceId: n.id_referencia,
    referenceType: n.tipo_referencia,
    category: getNotificationCategory(n.tipo),
    ...nav,
  };
}

// ─── Servicios ───────────────────────────────────────────────────────────────

export async function fetchNotificationsService(): Promise<ServiceResult<AppNotification[]>> {
  try {
    const data = await getNotifications();
    return { success: true, data: data.map(mapNotificationResponse) };
  } catch {
    return { success: false, error: 'No se pudieron cargar las notificaciones.' };
  }
}

export async function fetchUnreadNotificationsService(): Promise<ServiceResult<AppNotification[]>> {
  try {
    const data = await getUnreadNotifications();
    return { success: true, data: data.map(mapNotificationResponse) };
  } catch {
    return { success: false, error: 'No se pudieron cargar las notificaciones no leídas.' };
  }
}

export async function markNotificationAsReadService(id: string): Promise<ServiceResult> {
  try {
    await markNotificationAsRead(Number(id));
    return { success: true };
  } catch {
    return { success: false, error: 'No se pudo marcar como leída.' };
  }
}

export async function markAllNotificationsAsReadService(): Promise<ServiceResult> {
  try {
    await markAllNotificationsAsRead();
    return { success: true };
  } catch {
    return { success: false, error: 'No se pudieron marcar todas como leídas.' };
  }
}

export async function deleteNotificationService(id: string): Promise<ServiceResult> {
  try {
    await deleteNotification(Number(id));
    return { success: true };
  } catch {
    return { success: false, error: 'No se pudo eliminar la notificación.' };
  }
}
