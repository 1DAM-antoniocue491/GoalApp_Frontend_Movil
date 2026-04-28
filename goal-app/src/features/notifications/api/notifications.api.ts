/**
 * notifications.api
 *
 * Llamadas HTTP directas al endpoint de notificaciones.
 * TODO: importar httpClient de shared/api cuando esté disponible.
 */

import type { AppNotification } from '../types/notifications.types';

export const notificationsApi = {
  async getAll(_leagueId: string): Promise<AppNotification[]> {
    // TODO: return httpClient.get(`/leagues/${_leagueId}/notifications`);
    throw new Error('notificationsApi.getAll: not implemented');
  },

  async markAsRead(_id: string): Promise<void> {
    // TODO: return httpClient.patch(`/notifications/${_id}/read`);
    throw new Error('notificationsApi.markAsRead: not implemented');
  },

  async remove(_id: string): Promise<void> {
    // TODO: return httpClient.delete(`/notifications/${_id}`);
    throw new Error('notificationsApi.remove: not implemented');
  },

  async markAllAsRead(_leagueId: string): Promise<void> {
    // TODO: return httpClient.patch(`/leagues/${_leagueId}/notifications/read-all`);
    throw new Error('notificationsApi.markAllAsRead: not implemented');
  },
};
