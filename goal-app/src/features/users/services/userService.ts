/** Servicio móvil de Usuarios y roles. Sin mocks y con mapeo defensivo de backend. */

import { logger } from '@/src/shared/utils/logger';
import { ApiError } from '@/src/shared/api/errors';
import { getRoleLabel, toUserRole, normalizeRole } from '@/src/shared/utils/roles';
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

let rolesCache: { data: ApiRole[]; timestamp: number } | null = null;
const ROLES_CACHE_MS = 60_000;

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const detail = (error as any)?.detail ?? error.message;

    if (typeof detail === 'string') return normalizeApiMessage(detail);
    if (Array.isArray(detail)) return normalizeApiMessage(detail[0]?.msg ?? error.message);
    if (detail && typeof detail === 'object') return normalizeApiMessage(detail.detail ?? detail.message ?? JSON.stringify(detail));

    return normalizeApiMessage(error.message);
  }

  if (error instanceof Error) return normalizeApiMessage(error.message);
  if (typeof error === 'string') return normalizeApiMessage(error);

  try {
    return normalizeApiMessage(JSON.stringify(error));
  } catch {
    return 'Error inesperado';
  }
}

function normalizeApiMessage(message: string): string {
  const value = String(message ?? '').trim();
  const lower = value.toLowerCase();

  if (lower.includes('no pertenece') && lower.includes('liga')) {
    return 'El usuario ya no pertenece a esta liga. Recarga la pantalla para sincronizar los datos.';
  }

  if (lower.includes('único administrador') || lower.includes('unico administrador')) {
    return 'No se puede eliminar al único administrador de la liga.';
  }

  if (lower.includes('internal server error')) {
    return 'El servidor no pudo completar la operación. Recarga y vuelve a intentarlo.';
  }

  if (lower.includes('already') || lower.includes('ya pertenece') || lower.includes('ya forma parte')) {
    return 'El usuario ya forma parte de esta liga.';
  }

  return value || 'Error inesperado';
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

function getRawTeamId(raw: LeagueUserApi): number | undefined {
  return raw.id_equipo == null ? undefined : Number(raw.id_equipo);
}

function getRawTeamName(raw: LeagueUserApi): string | undefined {
  return raw.nombre_equipo ?? undefined;
}

function getRawJersey(raw: LeagueUserApi): number | undefined {
  const dorsal = raw.dorsal;
  if (dorsal == null || dorsal === '') return undefined;
  const parsed = Number(dorsal);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getTeamForUser(
  userId: number,
  role: UserRole,
  teams: TeamOptionApi[],
  players: PlayerApi[],
  rawTeamId?: number,
) {
  if (rawTeamId) {
    const team = teams.find(item => Number(item.id_equipo) === Number(rawTeamId));
    return { team, teamId: rawTeamId };
  }

  if (role === 'player') {
    const player = players.find(item => Number(item.id_usuario) === Number(userId));
    const team = player ? teams.find(item => Number(item.id_equipo) === Number(player.id_equipo)) : undefined;

    return {
      team,
      teamId: player?.id_equipo,
      jersey: player?.dorsal == null ? undefined : Number(player.dorsal),
      position: player?.posicion ?? undefined,
    };
  }

  if (role === 'coach') {
    const team = teams.find(item => Number(item.id_entrenador) === Number(userId));
    return { team, teamId: team?.id_equipo };
  }

  if (role === 'delegate') {
    const team = teams.find(item => Number(item.id_delegado) === Number(userId));
    return { team, teamId: team?.id_equipo };
  }

  return { team: undefined, teamId: undefined };
}

export function mapLeagueUser(
  raw: LeagueUserApi,
  context?: { teams?: TeamOptionApi[]; players?: PlayerApi[] },
): LeagueUser {
  const roleRaw = getRawRole(raw);
  const role = toUserRole(roleRaw);
  const active = Boolean(raw.activo);
  const userId = Number(raw.id_usuario);
  const rawTeamId = getRawTeamId(raw);
  const teamData = getTeamForUser(userId, role, context?.teams ?? [], context?.players ?? [], rawTeamId);
  const rawJersey = getRawJersey(raw);

  return {
    id: String(getRawUserRoleId(raw) ?? raw.id_usuario),
    userId,
    userRoleId: getRawUserRoleId(raw),
    name: getRawName(raw) || 'Usuario sin nombre',
    email: raw.email ?? '',
    roleId: Number(raw.id_rol),
    role,
    roleRaw,
    roleLabel: getRoleLabel(roleRaw),
    status: active ? 'active' : 'pending',
    active,
    teamId: teamData.teamId != null ? String(teamData.teamId) : undefined,
    teamName: getRawTeamName(raw) ?? teamData.team?.nombre,
    jersey: rawJersey ?? teamData.jersey,
    position: raw.posicion ?? teamData.position,
    isCaptain: raw.tipo_jugador === 'capitan',
  };
}

export function roleOptionsFromApi(roles: ApiRole[], allowedRoles?: UserRole[]): SelectOption[] {
  const seen = new Set<string>();
  const allowed = allowedRoles ? new Set(allowedRoles) : null;

  return roles
    .map(role => ({ value: toUserRole(role.nombre), label: getRoleLabel(role.nombre) }))
    .filter(option => {
      if (seen.has(option.value)) return false;
      if (allowed && !allowed.has(option.value)) return false;
      seen.add(option.value);
      return true;
    });
}

export function teamOptionsFromApi(teams: TeamOptionApi[]): SelectOption[] {
  return teams.map(team => ({ value: String(team.id_equipo), label: team.nombre }));
}

export function findRoleId(roles: ApiRole[], role: UserRole | ''): number | null {
  if (!role) return null;
  const normalized = normalizeRole(role);
  const found = roles.find(item => normalizeRole(item.nombre) === normalized);
  return found?.id_rol ?? null;
}

async function getUsersByLeagueFast(ligaId: number): Promise<LeagueUserApi[]> {
  try {
    return await getUsersByLeague(ligaId);
  } catch (primaryError) {
    const status = primaryError instanceof ApiError ? primaryError.status : 0;

    logger.warn('[users/service]', 'Endpoint principal de usuarios falló. Probando fallback.', {
      ligaId,
      status,
      error: getErrorMessage(primaryError),
    });

    return getLeagueUsersFallback(ligaId);
  }
}

export async function fetchLeagueUsersService(ligaId: number): Promise<ServiceResult<LeagueUser[]>> {
  try {
    const [usersResult, teamsResult, playersResult] = await Promise.allSettled([
      getUsersByLeagueFast(ligaId),
      getTeamsByLeague(ligaId),
      getPlayersByLeague(ligaId),
    ]);

    if (usersResult.status === 'rejected') {
      return { success: false, error: getErrorMessage(usersResult.reason) };
    }

    const teams = teamsResult.status === 'fulfilled' ? teamsResult.value : [];
    const players = playersResult.status === 'fulfilled' ? playersResult.value : [];

    if (teamsResult.status === 'rejected') {
      logger.warn('[users/service]', 'No se pudieron cargar equipos para asociar usuarios', {
        ligaId,
        error: getErrorMessage(teamsResult.reason),
      });
    }

    if (playersResult.status === 'rejected') {
      logger.warn('[users/service]', 'No se pudieron cargar jugadores para asociar usuarios', {
        ligaId,
        error: getErrorMessage(playersResult.reason),
      });
    }

    return {
      success: true,
      data: usersResult.value.map(user => mapLeagueUser(user, { teams, players })),
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function fetchRolesService(): Promise<ServiceResult<ApiRole[]>> {
  try {
    const now = Date.now();
    if (rolesCache && now - rolesCache.timestamp < ROLES_CACHE_MS) {
      return { success: true, data: rolesCache.data };
    }

    const roles = await getRoles();
    rolesCache = { data: roles, timestamp: now };
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

  if (!form.name.trim()) return { success: false, error: 'El nombre es obligatorio.' };
  if (!form.email.trim()) return { success: false, error: 'El email es obligatorio.' };
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
    if (!Number.isFinite(ligaId) || ligaId <= 0) return { success: false, error: 'Liga no válida.' };
    if (!Number.isFinite(user.userId) || user.userId <= 0) return { success: false, error: 'Usuario no válido.' };

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
    if (!Number.isFinite(ligaId) || ligaId <= 0) return { success: false, error: 'Liga no válida.' };
    if (!Number.isFinite(userId) || userId <= 0) return { success: false, error: 'Usuario no válido.' };

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
      id_equipo: needsTeam ? Number(form.teamId) : null,
      dorsal: isPlayer ? form.jersey.trim() : null,
      posicion: isPlayer ? form.position : null,
      tipo_jugador: isPlayer ? form.playerType || null : null,
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
