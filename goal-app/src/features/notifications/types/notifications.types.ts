/**
 * Tipos del sistema de notificaciones de GoalApp.
 *
 * NotificationCategory: categorías reales de una notificación.
 * NotificationFilter: incluye 'all' como valor de UI para el chip "Todas".
 *   Ninguna notificación tiene category === 'all'; es solo un valor de filtro.
 */

export type NotificationCategory =
  | 'live'
  | 'teams'
  | 'statistics'
  | 'results'
  | 'maintenance'
  | 'players'
  | 'league';

/** Usado en chips de filtro. 'all' = sin filtro activo. */
export type NotificationFilter = NotificationCategory | 'all';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  isRead: boolean;
  /** Fecha ISO 8601 */
  createdAt: string;
  leagueId: string;
  /** Ruta de Expo Router a la que navegar al pulsar la tarjeta */
  targetRoute?: string;
  /** Parámetros opcionales para la ruta destino */
  targetParams?: Record<string, string | number>;
}
