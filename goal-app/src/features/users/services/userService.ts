/**
 * Servicio móvil de Usuarios y roles.
 *
 * Responsabilidad:
 * - Normalizar respuestas distintas del backend.
 * - Resolver IDs de roles desde GET /roles/ sin hardcodearlos.
 * - Envolver mutaciones con ServiceResult para no romper la UI.
 */

import { logger } from '@/src/shared/utils/logger';
import {
  deleteLeagueUser,
  deleteUnionCode,
  generateUnionCode,
  getLeagueUsersFallback,
  getRoles,
  getTeamsByLeague,
  getUsersByLeague,
  inviteUserToLeague,
  updateLeagueUserRole,
  updateLeagueUserStatus,
} from '../api/users.api';
import type {
  ApiRole,
  GenerateUnionCodeFormData,
  GenerateUnionCodePayload,
  InviteUserFormData,
  InviteUserPayload,
  LeagueUser,
  LeagueUserApi,
  ManageUserFormData,
  ServiceResult,
  TeamOptionApi,
  UnionCodeResponse,
  UserRole,
} from '../types/users.types';
import { ROLE_LABELS } from '../types/users.types';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return 'Error inesperado';
  }
}

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function normalizeRole(value: unknown): UserRole {
  const role = normalizeText(value);

  if (['admin', 'administrador'].includes(role)) return 'admin';
  if (['coach', 'entrenador'].includes(role)) return 'coach';
  if (['player', 'jugador'].includes(role)) return 'player';
  if (['delegate', 'delegado', 'delegado_campo'].includes(role)) return 'delegate';
  if (['observer', 'observador', 'viewer', 'seguidor'].includes(role)) return 'observer';

  return 'observer';
}

export function getRoleLabel(value: unknown): string {
  return ROLE_LABELS[normalizeRole(value)] ?? String(value ?? 'Observador');
}

function getRawRole(raw: LeagueUserApi): string {
  return 'rol' in raw ? raw.rol : raw.nombre_rol;
}

function getRawName(raw: LeagueUserApi): string {
  return 'nombre' in raw ? raw.nombre : raw.nombre_usuario;
}

function getRawUserRoleId(raw: LeagueUserApi): number | undefined {
  return 'id_usuario_rol' in raw ? raw.id_usuario_rol : undefined;
}

export function mapLeagueUser(raw: LeagueUserApi): LeagueUser {
  const roleRaw = getRawRole(raw);
  const role = normalizeRole(roleRaw);
  const active = Boolean(raw.activo);

  return {
    id: String(getRawUserRoleId(raw) ?? raw.id_usuario),
    userId: Number(raw.id_usuario),
    userRoleId: getRawUserRoleId(raw),
    name: getRawName(raw) || 'Usuario sin nombre',
    email: raw.email ?? '',
    roleId: Number(raw.id_rol),
    role,
    roleRaw,
    roleLabel: getRoleLabel(roleRaw),
    status: active ? 'active' : 'pending',
    active,
  };
}

export function roleOptionsFromApi(roles: ApiRole[]) {
  return roles.map(role => ({
    value: normalizeRole(role.nombre),
    label: getRoleLabel(role.nombre),
  }));
}

export function teamOptionsFromApi(teams: TeamOptionApi[]) {
  return teams.map(team => ({
    value: String(team.id_equipo),
    label: team.nombre,
  }));
}

export function findRoleId(roles: ApiRole[], role: UserRole | ''): number | null {
  if (!role) return null;
  const normalized = normalizeRole(role);
  const found = roles.find(item => normalizeRole(item.nombre) === normalized);
  return found?.id_rol ?? null;
}

export async function fetchLeagueUsersService(ligaId: number): Promise<ServiceResult<LeagueUser[]>> {
  try {
    let users: LeagueUserApi[] = [];

    try {
      users = await getUsersByLeague(ligaId);
    } catch (primaryError) {
      logger.warn('[users/service]', 'Endpoint principal de usuarios falló. Probando fallback.', {
        ligaId,
        error: getErrorMessage(primaryError),
      });
      users = await getLeagueUsersFallback(ligaId);
    }

    return { success: true, data: users.map(mapLeagueUser) };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function fetchRolesService(): Promise<ServiceResult<ApiRole[]>> {
  try {
    const roles = await getRoles();
    return { success: true, data: roles };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function fetchTeamsForUsersService(ligaId: number): Promise<ServiceResult<TeamOptionApi[]>> {
  try {
    const teams = await getTeamsByLeague(ligaId);
    return { success: true, data: teams };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export function buildInvitePayload(form: InviteUserFormData, roles: ApiRole[]): ServiceResult<InviteUserPayload> {
  const idRol = findRoleId(roles, form.role);

  if (!form.name.trim()) return { success: false, error: 'El nombre es obligatorio' };
  if (!form.email.trim()) return { success: false, error: 'El email es obligatorio' };
  if (!idRol) return { success: false, error: 'Selecciona un rol válido' };

  const needsTeam = form.role === 'coach' || form.role === 'delegate' || form.role === 'player';
  const isPlayer = form.role === 'player';

  if (needsTeam && !form.teamId) return { success: false, error: 'Selecciona un equipo' };
  if (isPlayer && !form.jersey.trim()) return { success: false, error: 'Indica el dorsal del jugador' };
  if (isPlayer && !form.position) return { success: false, error: 'Selecciona la posición del jugador' };

  return {
    success: true,
    data: {
      nombre: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      id_rol: idRol,
      id_equipo: needsTeam ? Number(form.teamId) : null,
      // El backend espera dorsal como string/VARCHAR.
      dorsal: isPlayer ? form.jersey.trim() : null,
      posicion: isPlayer ? form.position : null,
      tipo_jugador: isPlayer ? form.playerType || null : null,
    },
  };
}

export async function inviteUserService(
  ligaId: number,
  form: InviteUserFormData,
  roles: ApiRole[],
): Promise<ServiceResult<void>> {
  const payload = buildInvitePayload(form, roles);
  if (!payload.success || !payload.data) return { success: false, error: payload.error };

  try {
    await inviteUserToLeague(ligaId, payload.data);
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function updateUserService(
  ligaId: number,
  user: LeagueUser,
  form: ManageUserFormData,
  roles: ApiRole[],
): Promise<ServiceResult<void>> {
  try {
    const idRol = findRoleId(roles, form.role);
    if (!idRol) return { success: false, error: 'Selecciona un rol válido' };

    if (idRol !== user.roleId) {
      await updateLeagueUserRole(ligaId, user.userId, idRol);
    }

    if (form.active !== user.active) {
      await updateLeagueUserStatus(ligaId, user.userId, form.active);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function removeUserService(ligaId: number, userId: number): Promise<ServiceResult<void>> {
  try {
    await deleteLeagueUser(ligaId, userId);
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export function buildGenerateCodePayload(
  form: GenerateUnionCodeFormData,
  roles: ApiRole[],
): ServiceResult<GenerateUnionCodePayload> {
  const idRol = findRoleId(roles, form.role);
  if (!idRol) return { success: false, error: 'Selecciona un rol válido' };

  const needsTeam = form.role === 'coach' || form.role === 'delegate' || form.role === 'player';
  const isPlayer = form.role === 'player';

  if (needsTeam && !form.teamId) return { success: false, error: 'Selecciona un equipo' };
  if (isPlayer && !form.jersey.trim()) return { success: false, error: 'Indica el dorsal del jugador' };
  if (isPlayer && !form.position) return { success: false, error: 'Selecciona la posición del jugador' };

  return {
    success: true,
    data: {
      id_rol: idRol,
      id_equipo: needsTeam ? Number(form.teamId) : null,
      dorsal: isPlayer ? form.jersey.trim() : null,
      posicion: isPlayer ? form.position : null,
    },
  };
}

export async function generateUnionCodeService(
  ligaId: number,
  form: GenerateUnionCodeFormData,
  roles: ApiRole[],
): Promise<ServiceResult<UnionCodeResponse>> {
  const payload = buildGenerateCodePayload(form, roles);
  if (!payload.success || !payload.data) return { success: false, error: payload.error };

  try {
    const code = await generateUnionCode(ligaId, payload.data);
    return { success: true, data: code };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function deleteUnionCodeService(ligaId: number, codigo: string): Promise<ServiceResult<void>> {
  try {
    await deleteUnionCode(ligaId, codigo);
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}
