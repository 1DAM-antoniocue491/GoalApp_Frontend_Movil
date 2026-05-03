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
  fetchUnreadNotificationsService,
  markNotificationAsReadService,
  deleteNotificationService,
  markAllNotificationsAsReadService,
} from '@/src/features/notifications/services/notificationsService';
import type {
  AppNotification,
  NotificationCategory,
  NotificationFilter,
  NotificationReadFilter,
} from '@/src/features/notifications/types/notifications.types';

export type UserRole = 'admin' | 'coach' | 'player' | 'observer' | 'delegate';

// Categorías accesibles por rol — incluye 'all' para notificaciones generales
const CATEGORIES_BY_ROLE: Record<UserRole, NotificationCategory[]> = {
  admin:    ['all', 'live', 'results', 'teams', 'stats'],
  coach:    ['all', 'live', 'results', 'teams', 'stats'],
  delegate: ['all', 'live', 'results', 'teams'],
  player:   ['all', 'live', 'results', 'stats'],
  observer: ['all', 'live', 'results', 'stats'],
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useNotifications(role: UserRole = 'admin') {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');
  const [readFilter, setReadFilter] = useState<NotificationReadFilter>('all');
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
      .filter(n => {
        if (readFilter === 'read') return n.isRead;
        if (readFilter === 'unread') return !n.isRead;
        return true;
      })
      .filter(n =>
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q)
      );
  }, [notifications, activeFilter, readFilter, search, availableCategories]);

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
    setIsMarkingAllAsRead(true);
    const result = await markAllNotificationsAsReadService();
    if (result.success) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } else {
      setError(result.error ?? 'No se pudieron marcar las notificaciones como leídas');
    }
    setIsMarkingAllAsRead(false);
  }, []);

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
    isMarkingAllAsRead,
    error,
    refresh,
    search,
    setSearch,
    activeFilter,
    setActiveFilter,
    readFilter,
    setReadFilter,
    availableCategories,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}

// ─── Hook ligero para el badge de la campana ─────────────────────────────────

/**
 * useUnreadCount
 *
 * Obtiene el número de notificaciones no leídas desde GET /notificaciones/no-leidas.
 * Usado en el DashboardHeader para mostrar el punto verde de la campana.
 * Se recarga cada vez que el componente monta (al entrar al dashboard).
 */
export function useUnreadCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetchUnreadNotificationsService().then(result => {
      if (result.success) {
        setCount(result.data?.length ?? 0);
      }
    });
  }, []);

  return count;
}
