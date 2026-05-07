/**
 * Servicio móvil de Usuarios y Roles.
 *
 * Centraliza normalización de roles, asociación de equipos y construcción de payloads
 * para que la UI no dependa de la forma exacta de cada endpoint.
 */

import { logger } from '@/src/shared/utils/logger';
import {
  deleteLeagueUser,
  deleteUnionCode,
  generateUnionCode,
  getLeagueUsersFallback,
  getPlayersByLeague,
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
  PlayerApi,
  SelectOption,
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
  if (['delegate', 'delegado', 'delegado_campo', 'field_delegate', 'fielddelegate'].includes(role)) return 'delegate';
  if (['observer', 'observador', 'viewer', 'seguidor'].includes(role)) return 'observer';

  return 'observer';
}

export function getRoleLabel(value: unknown): string {
  return ROLE_LABELS[normalizeRole(value)] ?? 'Observador';
}

function getRawRole(raw: LeagueUserApi): string | null | undefined {
  return 'rol' in raw && raw.rol ? raw.rol : 'nombre_rol' in raw ? raw.nombre_rol : undefined;
}

function getRawName(raw: LeagueUserApi): string | null | undefined {
  return 'nombre' in raw && raw.nombre ? raw.nombre : 'nombre_usuario' in raw ? raw.nombre_usuario : undefined;
}

function getRawUserRoleId(raw: LeagueUserApi): number | undefined {
  return 'id_usuario_rol' in raw ? raw.id_usuario_rol : undefined;
}

function getRawTeamId(raw: LeagueUserApi): number | null | undefined {
  return 'id_equipo' in raw ? raw.id_equipo : undefined;
}

function getRawTeamName(raw: LeagueUserApi): string | null | undefined {
  return 'nombre_equipo' in raw ? raw.nombre_equipo : undefined;
}

function getRawJersey(raw: LeagueUserApi): string | undefined {
  if (!('dorsal' in raw) || raw.dorsal == null) return undefined;
  return String(raw.dorsal);
}

function getRawPosition(raw: LeagueUserApi): string | undefined {
  return 'posicion' in raw && raw.posicion ? raw.posicion : undefined;
}

function teamNameById(teams: TeamOptionApi[], id?: number | null): string | undefined {
  if (!id) return undefined;
  return teams.find(team => Number(team.id_equipo) === Number(id))?.nombre;
}

function playerByUserId(players: PlayerApi[], userId: number): PlayerApi | undefined {
  return players.find(player => Number(player.id_usuario) === Number(userId));
}

function teamFromAssignment(
  raw: LeagueUserApi,
  role: UserRole,
  teams: TeamOptionApi[],
  players: PlayerApi[],
): { teamId?: string; teamName?: string; jersey?: string; position?: string } {
  const rawTeamId = getRawTeamId(raw);
  const rawTeamName = getRawTeamName(raw) ?? teamNameById(teams, rawTeamId);

  if (rawTeamId || rawTeamName) {
    return {
      teamId: rawTeamId ? String(rawTeamId) : undefined,
      teamName: rawTeamName ?? undefined,
      jersey: getRawJersey(raw),
      position: getRawPosition(raw),
    };
  }

  if (role === 'player') {
    const player = playerByUserId(players, Number(raw.id_usuario));
    if (!player) return {};
    return {
      teamId: String(player.id_equipo),
      teamName: player.equipo?.nombre ?? teamNameById(teams, player.id_equipo),
      jersey: player.dorsal != null ? String(player.dorsal) : undefined,
      position: player.posicion ?? undefined,
    };
  }

  if (role === 'coach') {
    const team = teams.find(item => Number(item.id_entrenador) === Number(raw.id_usuario));
    return team ? { teamId: String(team.id_equipo), teamName: team.nombre } : {};
  }

  if (role === 'delegate') {
    const team = teams.find(item => Number(item.id_delegado) === Number(raw.id_usuario));
    return team ? { teamId: String(team.id_equipo), teamName: team.nombre } : {};
  }

  return {};
}

export function mapLeagueUser(raw: LeagueUserApi, teams: TeamOptionApi[] = [], players: PlayerApi[] = []): LeagueUser {
  const roleRaw = getRawRole(raw);
  const role = normalizeRole(roleRaw);
  const active = Boolean(raw.activo);
  const assignment = teamFromAssignment(raw, role, teams, players);

  return {
    id: String(getRawUserRoleId(raw) ?? raw.id_usuario),
    userId: Number(raw.id_usuario),
    userRoleId: getRawUserRoleId(raw),
    name: getRawName(raw) || 'Usuario sin nombre',
    email: raw.email ?? '',
    roleId: Number(raw.id_rol),
    role,
    roleRaw: roleRaw ?? null,
    roleLabel: getRoleLabel(roleRaw),
    status: active ? 'active' : 'pending',
    active,
    ...assignment,
  };
}

export function roleOptionsFromApi(roles: ApiRole[]): SelectOption[] {
  return roles.map(role => ({
    value: normalizeRole(role.nombre),
    label: getRoleLabel(role.nombre),
  }));
}

export function teamOptionsFromApi(teams: TeamOptionApi[]): SelectOption[] {
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

export async function fetchUsersBootstrapService(ligaId: number): Promise<
  ServiceResult<{
    users: LeagueUser[];
    roles: ApiRole[];
    teams: TeamOptionApi[];
  }>
> {
  try {
    const usersPromise = getUsersByLeague(ligaId).catch(async error => {
      logger.warn('[users/service]', 'Endpoint principal de usuarios falló. Probando fallback.', {
        ligaId,
        error: getErrorMessage(error),
      });
      return getLeagueUsersFallback(ligaId);
    });

    const [usersResult, rolesResult, teamsResult, playersResult] = await Promise.allSettled([
      usersPromise,
      getRoles(),
      getTeamsByLeague(ligaId),
      getPlayersByLeague(ligaId),
    ]);

    if (usersResult.status === 'rejected') {
      return { success: false, error: getErrorMessage(usersResult.reason) };
    }

    const roles = rolesResult.status === 'fulfilled' ? rolesResult.value : [];
    const teams = teamsResult.status === 'fulfilled' ? teamsResult.value : [];
    const players = playersResult.status === 'fulfilled' ? playersResult.value : [];
    const users = usersResult.value.map(user => mapLeagueUser(user, teams, players));

    return { success: true, data: { users, roles, teams } };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export function buildInvitePayload(form: InviteUserFormData, roles: ApiRole[]): ServiceResult<InviteUserPayload> {
  const idRol = findRoleId(roles, form.role);

  if (!form.name.trim()) return { success: false, error: 'El nombre es obligatorio.' };
  if (!form.email.trim()) return { success: false, error: 'El correo electrónico es obligatorio.' };
  if (!idRol) return { success: false, error: 'Selecciona un rol válido.' };

  const needsTeam = form.role === 'coach' || form.role === 'delegate' || form.role === 'player';
  const isPlayer = form.role === 'player';

  if (needsTeam && !form.teamId) return { success: false, error: 'Selecciona un equipo.' };
  if (isPlayer && !form.jersey.trim()) return { success: false, error: 'Indica el dorsal del jugador.' };
  if (isPlayer && !form.position) return { success: false, error: 'Selecciona la posición del jugador.' };

  return {
    success: true,
    data: {
      nombre: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      id_rol: idRol,
      id_equipo: needsTeam ? Number(form.teamId) : null,
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
    if (!idRol) return { success: false, error: 'Selecciona un rol válido.' };

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
  if (!idRol) return { success: false, error: 'Selecciona un rol válido.' };

  const needsTeam = form.role === 'coach' || form.role === 'delegate' || form.role === 'player';
  const isPlayer = form.role === 'player';

  if (needsTeam && !form.teamId) return { success: false, error: 'Selecciona un equipo.' };
  if (isPlayer && !form.jersey.trim()) return { success: false, error: 'Indica el dorsal del jugador.' };
  if (isPlayer && !form.position) return { success: false, error: 'Selecciona la posición del jugador.' };

  return {
    success: true,
    data: {
      id_rol: idRol,
      id_equipo: needsTeam ? Number(form.teamId) : undefined,
      dorsal: isPlayer ? form.jersey.trim() : undefined,
      posicion: isPlayer ? form.position : undefined,
      tipo_jugador: isPlayer ? form.playerType || undefined : undefined,
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
