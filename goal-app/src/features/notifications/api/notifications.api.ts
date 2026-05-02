/**
 * notifications.api
 *
 * Llamadas HTTP al módulo de notificaciones.
 * Usa apiClient para inyección automática de token y retry.
 *
 * Endpoints:
 *   GET    /notificaciones/           → lista completa del usuario
 *   GET    /notificaciones/no-leidas  → lista de no leídas (para badge)
 *   PATCH  /notificaciones/{id}/leer  → marcar una como leída
 *   PUT    /notificaciones/mark-all-read → marcar todas como leídas
 *   DELETE /notificaciones/{id}       → eliminar una notificación
 */

import { apiClient } from '@/src/shared/api/client';
import type { NotificationResponse } from '../types/notifications.types';

/** GET /notificaciones/ — lista completa del usuario autenticado */
export async function getNotifications(): Promise<NotificationResponse[]> {
  const response = await apiClient.get<NotificationResponse[]>('/notificaciones/');
  return response.data;
}

/** GET /notificaciones/no-leidas — notificaciones no leídas (para badge) */
export async function getUnreadNotifications(): Promise<NotificationResponse[]> {
  const response = await apiClient.get<NotificationResponse[]>('/notificaciones/no-leidas');
  return response.data;
}

/** PATCH /notificaciones/{id}/leer — marcar una notificación como leída */
export async function markNotificationAsRead(id: number): Promise<void> {
  await apiClient.patch(`/notificaciones/${id}/leer`);
}

/** PUT /notificaciones/mark-all-read — marcar todas las notificaciones como leídas */
export async function markAllNotificationsAsRead(): Promise<void> {
  await apiClient.put('/notificaciones/mark-all-read');
}

/** DELETE /notificaciones/{id} — eliminar una notificación */
export async function deleteNotification(id: number): Promise<void> {
  await apiClient.delete(`/notificaciones/${id}`);
}
