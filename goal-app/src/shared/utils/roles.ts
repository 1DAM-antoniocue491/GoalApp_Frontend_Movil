/**
 * Utilidades compartidas para roles.
 *
 * Centraliza la normalización para que tarjetas de liga, usuarios y badges
 * usen los mismos nombres, iconos y colores, aunque el backend devuelva
 * variantes como "administrador", "delegado_campo" o "field_delegate".
 */

import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import type { LeagueRole } from '@/src/shared/types/league';
import type { UserRole } from '@/src/features/users/types/users.types';

export type AppRole = 'admin' | 'coach' | 'delegate' | 'player' | 'observer';

export interface RoleBadgeConfig {
  label: string;
  bgColor: string;
  textColor: string;
  icon: keyof typeof Ionicons.glyphMap;
}

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Normaliza cualquier variante de rol recibida desde backend/web/móvil. */
export function normalizeRole(role?: string | null): AppRole {
  const value = normalizeText(role);

  switch (value) {
    case 'admin':
    case 'administrador':
      return 'admin';

    case 'coach':
    case 'entrenador':
      return 'coach';

    case 'delegate':
    case 'delegado':
    case 'delegado campo':
    case 'delegado_campo':
    case 'field_delegate':
    case 'fielddelegate':
      return 'delegate';

    case 'player':
    case 'jugador':
      return 'player';

    case 'observer':
    case 'observador':
    case 'viewer':
    case 'seguidor':
    default:
      return 'observer';
  }
}

/** Rol en formato de ligas. LeagueRole usa field_delegate, no delegate. */
export function toLeagueRole(role?: string | null): LeagueRole {
  const normalized = normalizeRole(role);
  return normalized === 'delegate' ? 'field_delegate' : normalized;
}

/** Rol en formato de usuarios. UserRole usa delegate. */
export function toUserRole(role?: string | null): UserRole {
  return normalizeRole(role) as UserRole;
}

/** Etiqueta de rol consistente para toda la app. */
export function getRoleLabel(role?: string | null): string {
  const normalized = normalizeRole(role);

  switch (normalized) {
    case 'admin':
      return 'Administrador';
    case 'coach':
      return 'Entrenador';
    case 'delegate':
      return 'Delegado';
    case 'player':
      return 'Jugador';
    case 'observer':
    default:
      return 'Observador';
  }
}

/** Config visual única para RoleBadge. */
export function getRoleBadgeConfig(role?: string | null): RoleBadgeConfig {
  const normalized = normalizeRole(role);

  switch (normalized) {
    case 'admin':
      return {
        label: 'Administrador',
        bgColor: 'rgba(200,245,88,0.15)',
        textColor: Colors.brand.primary,
        icon: 'shield-outline',
      };

    case 'coach':
      return {
        label: 'Entrenador',
        bgColor: 'rgba(0,180,216,0.15)',
        textColor: Colors.brand.secondary,
        icon: 'ribbon-outline',
      };

    case 'delegate':
      return {
        label: 'Delegado',
        bgColor: 'rgba(255,214,10,0.15)',
        textColor: Colors.semantic.warning,
        icon: 'clipboard-outline',
      };

    case 'player':
      return {
        label: 'Jugador',
        bgColor: 'rgba(24,162,251,0.15)',
        textColor: Colors.brand.accent,
        icon: 'football-outline',
      };

    case 'observer':
    default:
      return {
        label: 'Observador',
        bgColor: 'rgba(161,161,170,0.12)',
        textColor: Colors.text.secondary,
        icon: 'eye-outline',
      };
  }
}
