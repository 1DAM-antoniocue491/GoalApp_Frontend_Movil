/**
 * notificationsService
 *
 * Capa de orquestación entre la UI y la API.
 * Cuando el backend esté listo, descomenta las llamadas a notificationsApi
 * y elimina los throws.
 *
 * TODO: conectar a notificationsApi
 */

import type { AppNotification } from '../types/notifications.types';
// import { notificationsApi } from '../api/notifications.api';

export const notificationsService = {
  async getAll(_leagueId: string): Promise<AppNotification[]> {
    // TODO: return notificationsApi.getAll(_leagueId);
    throw new Error('notificationsService.getAll: not implemented');
  },

  async markAsRead(_id: string): Promise<void> {
    // TODO: return notificationsApi.markAsRead(_id);
    throw new Error('notificationsService.markAsRead: not implemented');
  },

  async remove(_id: string): Promise<void> {
    // TODO: return notificationsApi.remove(_id);
    throw new Error('notificationsService.remove: not implemented');
  },

  async markAllAsRead(_leagueId: string): Promise<void> {
    // TODO: return notificationsApi.markAllAsRead(_leagueId);
    throw new Error('notificationsService.markAllAsRead: not implemented');
  },
};
