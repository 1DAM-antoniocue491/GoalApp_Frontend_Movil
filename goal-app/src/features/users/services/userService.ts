/**
 * userService.ts
 *
 * Servicio de dominio para Usuarios y roles.
 * Responsabilidades:
 * - Normalizar respuestas API con contratos distintos.
 * - Resolver IDs de rol desde GET /roles/ sin hardcodear IDs.
 * - Devolver ServiceResult para que la UI no tenga try/catch de API.
 */

import { logger } from '@/src/shared/utils/logger';
import {
  deleteUsuarioLiga,
  fetchLeagueUsers,
  fetchRoles,
  fetchTeamsByLeague,
  inviteUserToLeague,
  updateUsuarioEstado,
  updateUsuarioRol,
} from '../api/users.api';
import type {
  InviteUserFormData,
  InviteUserPayload,
  LeagueUser,
  LeagueUserApiResponse,
  ManageUserFormData,
  RoleResponse,
  ServiceResult,
  TeamForUsersResponse,
  UserRole,
} from '../types/users.types';
import { ROLE_LABELS } from '../types/users.types';

function getErrorMessage(error: unknown, fallback = 'Error inesperado'): string {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message);

      if (typeof parsed?.detail === 'string') return parsed.detail;

      if (Array.isArray(parsed?.detail)) {
        return parsed.detail
          .map((item: { loc?: unknown[]; msg?: string }) => {
            const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : undefined;
            return field ? `${String(field)}: ${item.msg ?? 'Dato inválido'}` : item.msg ?? 'Dato inválido';
          })
          .join(' · ');
      }
    } catch {
      // Mantener message normal si no es JSON.
    }

    return error.message;
  }

  if (typeof error === 'string') return error;
  return fallback;
}

function safeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function safeNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function normalizeRoleName(roleName: unknown): UserRole {
  const value = normalizeText(String(roleName ?? ''));

  if (['admin', 'administrador'].includes(value)) return 'admin';
  if (['coach', 'entrenador'].includes(value)) return 'coach';
  if (['player', 'jugador'].includes(value)) return 'player';
  if (['delegate', 'delegado', 'delegado_campo', 'field_delegate'].includes(value)) return 'delegate';
  if (['observer', 'observador'].includes(value)) return 'observer';

  return 'observer';
}

export function formatRoleLabel(role: UserRole | string): string {
  const normalized = normalizeRoleName(role);
  return ROLE_LABELS[normalized] ?? String(role);
}

export function findRoleId(roles: RoleResponse[], role: UserRole | ''): number | null {
  if (!role) return null;
  const target = role;
  const found = roles.find(item => normalizeRoleName(item.nombre) === target);
  return found?.id_rol ?? null;
}

export function buildRoleOptions(roles: RoleResponse[], options?: { includeAdmin?: boolean }) {
  const includeAdmin = Boolean(options?.includeAdmin);
  return roles
    .map(role => ({
      value: normalizeRoleName(role.nombre),
      label: formatRoleLabel(role.nombre),
      id_rol: role.id_rol,
    }))
    .filter((role, index, array) => role.value !== 'admin' || includeAdmin)
    .filter((role, index, array) => array.findIndex(item => item.value === role.value) === index)
    .map(role => ({ value: role.value, label: role.label }));
}

export function buildTeamOptions(teams: TeamForUsersResponse[]) {
  return teams.map(team => ({
    value: String(team.id_equipo),
    label: safeString(team.nombre, `Equipo ${team.id_equipo}`),
  }));
}

export function mapLeagueUser(raw: LeagueUserApiResponse, roles: RoleResponse[] = []): LeagueUser {
  const relationId = 'id_usuario_rol' in raw ? raw.id_usuario_rol : undefined;
  const userId = safeNumber(raw.id_usuario);
  const rawName = 'nombre_usuario' in raw ? raw.nombre_usuario : raw.nombre;
  const rawRole = 'nombre_rol' in raw ? raw.nombre_rol : raw.rol;
  const role = normalizeRoleName(rawRole);
  const roleFromList = roles.find(item => item.id_rol === raw.id_rol);
  const active = Boolean(raw.activo);

  return {
    id: String(relationId ?? userId),
    userId,
    userRoleId: relationId,
    name: safeString(rawName, 'Usuario sin nombre'),
    email: safeString(raw.email, ''),
    role,
    roleId: safeNumber(raw.id_rol),
    roleLabel: roleFromList ? formatRoleLabel(roleFromList.nombre) : formatRoleLabel(role),
    status: active ? 'active' : 'pending',
    active,
  };
}

function validateInvite(form: InviteUserFormData, roles: RoleResponse[]): string | null {
  if (!form.name.trim()) return 'El nombre es obligatorio.';
  if (!form.email.trim()) return 'El email es obligatorio.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Introduce un email válido.';
  if (!form.role) return 'Selecciona un rol.';
  if (!findRoleId(roles, form.role)) return 'No se pudo resolver el rol seleccionado desde la API.';

  const needsTeam = ['coach', 'delegate', 'player'].includes(form.role);
  if (needsTeam && !form.teamId) return 'Selecciona un equipo para este rol.';

  if (form.role === 'player') {
    if (!form.playerType) return 'Selecciona el tipo de jugador.';
    if (!form.position) return 'Selecciona la posición.';

    if (form.jersey.trim()) {
      const dorsal = Number(form.jersey);
      if (!Number.isInteger(dorsal) || dorsal < 1 || dorsal > 99) {
        return 'El dorsal debe ser un número entre 1 y 99.';
      }
    }
  }

  return null;
}

function buildInvitePayload(form: InviteUserFormData, roles: RoleResponse[]): InviteUserPayload {
  const roleId = findRoleId(roles, form.role);

  if (!roleId) {
    throw new Error('No se pudo resolver el ID del rol seleccionado.');
  }

  const teamId = form.teamId ? Number(form.teamId) : null;
  const dorsal = form.jersey.trim() || null;

  return {
    nombre: form.name.trim(),
    email: form.email.trim().toLowerCase(),
    id_rol: roleId,
    id_equipo: teamId,
    // El backend espera `dorsal` como string, aunque sea numérico visualmente.
    // No convertir a Number: evita error 422 `Input should be a valid string`.
    dorsal: form.role === 'player' ? dorsal : null,
    posicion: form.role === 'player' ? form.position || null : null,
    tipo_jugador: form.role === 'player' ? form.playerType || null : null,
  };
}

export async function fetchLeagueUsersService(ligaId: number): Promise<ServiceResult<LeagueUser[]>> {
  try {
    const roles = await fetchRoles();
    const users = await fetchLeagueUsers(ligaId);
    return { success: true, data: users.map(user => mapLeagueUser(user, roles)) };
  } catch (error) {
    const message = getErrorMessage(error, 'No se pudieron cargar los usuarios.');
    logger.warn('users/fetchLeagueUsersService', message, { ligaId });
    return { success: false, error: message };
  }
}

export async function fetchRolesService(): Promise<ServiceResult<RoleResponse[]>> {
  try {
    const data = await fetchRoles();
    return { success: true, data };
  } catch (error) {
    const message = getErrorMessage(error, 'No se pudieron cargar los roles.');
    logger.warn('users/fetchRolesService', message);
    return { success: false, error: message };
  }
}

export async function fetchTeamsByLeagueService(ligaId: number): Promise<ServiceResult<TeamForUsersResponse[]>> {
  try {
    const data = await fetchTeamsByLeague(ligaId);
    return { success: true, data };
  } catch (error) {
    const message = getErrorMessage(error, 'No se pudieron cargar los equipos.');
    logger.warn('users/fetchTeamsByLeagueService', message, { ligaId });
    return { success: false, data: [], error: message };
  }
}

export async function inviteLeagueUserService(
  ligaId: number,
  form: InviteUserFormData,
  roles: RoleResponse[],
): Promise<ServiceResult> {
  const validation = validateInvite(form, roles);
  if (validation) return { success: false, error: validation };

  try {
    await inviteUserToLeague(ligaId, buildInvitePayload(form, roles));
    return { success: true };
  } catch (error) {
    const message = getErrorMessage(error, 'No se pudo enviar la invitación.');
    logger.warn('users/inviteLeagueUserService', message, { ligaId, role: form.role });
    return { success: false, error: message };
  }
}

export async function updateLeagueUserService(
  ligaId: number,
  user: LeagueUser,
  form: ManageUserFormData,
  roles: RoleResponse[],
): Promise<ServiceResult> {
  try {
    const roleId = findRoleId(roles, form.role);

    if (!roleId) {
      return { success: false, error: 'No se pudo resolver el rol seleccionado desde la API.' };
    }

    if (roleId !== user.roleId) {
      await updateUsuarioRol(ligaId, user.userId, { id_rol: roleId });
    }

    if (form.active !== user.active) {
      await updateUsuarioEstado(ligaId, user.userId, { activo: form.active });
    }

    return { success: true };
  } catch (error) {
    const message = getErrorMessage(error, 'No se pudo actualizar el usuario.');
    logger.warn('users/updateLeagueUserService', message, { ligaId, userId: user.userId });
    return { success: false, error: message };
  }
}

export async function removeLeagueUserService(ligaId: number, user: LeagueUser): Promise<ServiceResult> {
  try {
    await deleteUsuarioLiga(ligaId, user.userId);
    return { success: true };
  } catch (error) {
    const message = getErrorMessage(error, 'No se pudo eliminar el usuario de la liga.');
    logger.warn('users/removeLeagueUserService', message, { ligaId, userId: user.userId });
    return { success: false, error: message };
  }
}
