/**
 * useNotifications
 *
 * Gestiona el estado local de notificaciones:
 * - Mock data (sustituible por servicio real)
 * - Filtro por categoría (restringido por rol)
 * - Búsqueda por texto
 * - Marcar como leída / eliminar / marcar todas
 *
 * TODO: reemplazar MOCK_NOTIFICATIONS con llamada a notificationsService cuando la API esté lista
 */

import { useState, useMemo } from 'react';
import { routes } from '@/src/shared/config/routes';
import type {
  AppNotification,
  NotificationCategory,
  NotificationFilter,
} from '@/src/features/notifications/types/notifications.types';

// Rol del usuario en la liga — extraer del estado global cuando esté disponible
export type UserRole = 'admin' | 'coach' | 'player' | 'observer' | 'delegate';

// Categorías accesibles por rol según reglas de negocio
const CATEGORIES_BY_ROLE: Record<UserRole, NotificationCategory[]> = {
  admin:    ['live', 'results', 'teams', 'players', 'statistics', 'maintenance', 'league'],
  coach:    ['live', 'results', 'teams', 'players', 'statistics'],
  delegate: ['live', 'results', 'teams', 'players', 'statistics'],
  player:   ['live', 'results', 'statistics'],
  observer: ['live', 'results', 'statistics'],
};

// ─── Mock data ──────────────────────────────────────────────────────────────
// targetRoute y targetParams determinan a dónde navega la tarjeta al pulsarla.
// Usar las rutas de routes.ts para evitar strings sueltos.
const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    title: 'Partido iniciado',
    body: 'Real Madrid CF vs FC Barcelona ha comenzado.',
    category: 'live',
    isRead: false,
    createdAt: '2026-04-27T10:30:00Z',
    leagueId: 'league_1',
    targetRoute: routes.matches.live,
  },
  {
    id: 'n2',
    title: 'Resultado final',
    body: 'Real Madrid CF 2–1 FC Barcelona. Partido finalizado.',
    category: 'results',
    isRead: false,
    createdAt: '2026-04-26T20:15:00Z',
    leagueId: 'league_1',
    targetRoute: routes.matches.finished,
  },
  {
    id: 'n3',
    title: 'Nuevo jugador inscrito',
    body: 'Carlos Ruiz ha sido inscrito en Real Madrid CF.',
    category: 'players',
    isRead: true,
    createdAt: '2026-04-25T09:00:00Z',
    leagueId: 'league_1',
    targetRoute: routes.league.players,
  },
  {
    id: 'n4',
    title: 'Estadísticas actualizadas',
    body: 'Las estadísticas de la jornada 8 ya están disponibles.',
    category: 'statistics',
    isRead: true,
    createdAt: '2026-04-24T18:00:00Z',
    leagueId: 'league_1',
    targetRoute: routes.private.tabs.statistics,
  },
  {
    id: 'n5',
    title: 'Mantenimiento programado',
    body: 'El sistema estará en mantenimiento el 30 de abril de 02:00 a 04:00.',
    category: 'maintenance',
    isRead: false,
    createdAt: '2026-04-23T12:00:00Z',
    leagueId: 'league_1',
    // Sin destino específico — mantenimiento no tiene pantalla propia
  },
  {
    id: 'n6',
    title: 'Equipo actualizado',
    body: 'FC Barcelona ha actualizado su plantilla para la jornada 9.',
    category: 'teams',
    isRead: true,
    createdAt: '2026-04-22T16:30:00Z',
    leagueId: 'league_1',
    targetRoute: routes.league.teams,
  },
  {
    id: 'n7',
    title: 'Cambio en la liga',
    body: 'El formato de la liga ha sido actualizado por el administrador.',
    category: 'league',
    isRead: false,
    createdAt: '2026-04-21T11:00:00Z',
    leagueId: 'league_1',
    targetRoute: routes.league.index,
  },
  {
    id: 'n8',
    title: 'Gol anotado',
    body: 'Minuto 67 — Gol de Luis Rodríguez para Real Madrid CF.',
    category: 'live',
    isRead: false,
    createdAt: '2026-04-27T11:07:00Z',
    leagueId: 'league_1',
    targetRoute: routes.matches.live,
  },
];

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useNotifications(role: UserRole = 'admin') {
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');
  const [search, setSearch] = useState('');

  // Categorías visibles para el rol actual
  const availableCategories = CATEGORIES_BY_ROLE[role];

  // Notificaciones filtradas: por rol → por categoría activa → por búsqueda
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return notifications
      .filter(n => availableCategories.includes(n.category))
      .filter(n => activeFilter === 'all' || n.category === activeFilter)
      .filter(n =>
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q)
      );
  }, [notifications, activeFilter, search, availableCategories]);

  // Total de no leídas visibles (para el subtítulo del header)
  const unreadCount = useMemo(
    () => filtered.filter(n => !n.isRead).length,
    [filtered]
  );

  function markAsRead(id: string) {
    // TODO: llamar a notificationsService.markAsRead(id)
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  }

  function remove(id: string) {
    // TODO: llamar a notificationsService.remove(id)
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  function markAllAsRead() {
    // TODO: llamar a notificationsService.markAllAsRead()
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }

  return {
    notifications: filtered,
    unreadCount,
    activeFilter,
    setActiveFilter,
    search,
    setSearch,
    availableCategories,
    markAsRead,
    remove,
    markAllAsRead,
  };
}
