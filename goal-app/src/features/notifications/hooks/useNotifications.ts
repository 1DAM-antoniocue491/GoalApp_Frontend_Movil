/**
 * useNotifications
 *
 * Gestiona el estado de notificaciones con API real.
 * - Carga desde GET /notificaciones/
 * - Badge desde GET /notificaciones/no-leidas
 * - Filtro por categoría (restringido por rol)
 * - Búsqueda por texto
 * - Mutaciones optimistas con revert si falla
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  fetchNotificationsService,
  markNotificationAsReadService,
  deleteNotificationService,
  markAllNotificationsAsReadService,
} from '@/src/features/notifications/services/notificationsService';
import type {
  AppNotification,
  NotificationCategory,
  NotificationFilter,
} from '@/src/features/notifications/types/notifications.types';

export type UserRole = 'admin' | 'coach' | 'player' | 'observer' | 'delegate';

// Categorías accesibles por rol
const CATEGORIES_BY_ROLE: Record<UserRole, NotificationCategory[]> = {
  admin:    ['matches', 'results', 'teams', 'players', 'stats', 'events', 'league', 'roles', 'system'],
  coach:    ['matches', 'results', 'teams', 'players', 'stats', 'events'],
  delegate: ['matches', 'results', 'teams', 'events'],
  player:   ['matches', 'results', 'stats', 'events'],
  observer: ['matches', 'results', 'stats'],
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useNotifications(role: UserRole = 'admin') {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');
  const [search, setSearch] = useState('');

  const hasLoadedRef = useRef(false);
  const availableCategories = CATEGORIES_BY_ROLE[role];

  // ── Carga ────────────────────────────────────────────────────────────────

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    const result = await fetchNotificationsService();
    if (result.success) {
      setNotifications(result.data ?? []);
    } else {
      setError(result.error ?? 'Error al cargar notificaciones');
    }

    if (isRefresh) setIsRefreshing(false);
    else setIsLoading(false);
  }, []);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    load(false);
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  // ── Filtrado ─────────────────────────────────────────────────────────────

  const filteredNotifications = useMemo(() => {
    const q = search.toLowerCase().trim();
    return notifications
      .filter(n => availableCategories.includes(n.category as NotificationCategory))
      .filter(n => activeFilter === 'all' || n.category === activeFilter)
      .filter(n =>
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q)
      );
  }, [notifications, activeFilter, search, availableCategories]);

  // unreadCount desde la lista completa (no filtrada) para el badge real
  const unreadCount = useMemo(
    () => notifications.filter(n => !n.isRead).length,
    [notifications]
  );

  // ── Mutaciones ───────────────────────────────────────────────────────────

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
    const result = await markNotificationAsReadService(id);
    if (!result.success) {
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: false } : n))
      );
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const snapshot = notifications;
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    const result = await markAllNotificationsAsReadService();
    if (!result.success) {
      setNotifications(snapshot);
    }
  }, [notifications]);

  const deleteNotification = useCallback(async (id: string) => {
    const snapshot = notifications;
    setNotifications(prev => prev.filter(n => n.id !== id));
    const result = await deleteNotificationService(id);
    if (!result.success) {
      setNotifications(snapshot);
    }
  }, [notifications]);

  return {
    notifications: filteredNotifications,
    filteredNotifications,
    unreadCount,
    isLoading,
    isRefreshing,
    error,
    refresh,
    search,
    setSearch,
    activeFilter,
    setActiveFilter,
    availableCategories,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
