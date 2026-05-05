/**
 * users.api.ts
 *
 * Capa HTTP del módulo Usuarios y roles.
 * Usa exclusivamente apiClient para conservar token, base URL, timeout y retry.
 */

import { apiClient } from '@/src/shared/api/client';
import type {
  InviteUserPayload,
  LeagueUserApiResponse,
  RoleResponse,
  TeamForUsersResponse,
  UpdateUserRolePayload,
  UpdateUserStatusPayload,
  UsuarioLigaResponse,
  UserWithRoleResponse,
} from '../types/users.types';

export async function fetchRoles(): Promise<RoleResponse[]> {
  const response = await apiClient.get<RoleResponse[]>('/roles/');
  return response.data;
}

export async function fetchTeamsByLeague(ligaId: number): Promise<TeamForUsersResponse[]> {
  const response = await apiClient.get<TeamForUsersResponse[]>(`/equipos/?liga_id=${encodeURIComponent(String(ligaId))}`);
  return response.data;
}

/**
 * Endpoint principal usado por web para la pantalla de usuarios.
 */
export async function fetchUsersByLeague(ligaId: number): Promise<UserWithRoleResponse[]> {
  const response = await apiClient.get<UserWithRoleResponse[]>(`/usuarios/ligas/${ligaId}/usuarios`);
  return response.data;
}

/**
 * Endpoint alternativo usado por memberApi web.
 * Se usa como fallback si el endpoint principal falla o cambia el contrato.
 */
export async function fetchUsuariosLiga(ligaId: number): Promise<UsuarioLigaResponse[]> {
  const response = await apiClient.get<UsuarioLigaResponse[]>(`/ligas/${ligaId}/usuarios`);
  return response.data;
}

export async function fetchLeagueUsers(ligaId: number): Promise<LeagueUserApiResponse[]> {
  try {
    return await fetchUsersByLeague(ligaId);
  } catch {
    return await fetchUsuariosLiga(ligaId);
  }
}

export async function inviteUserToLeague(ligaId: number, payload: InviteUserPayload): Promise<void> {
  await apiClient.post(`/invitaciones/ligas/${ligaId}/invitar`, payload);
}

export async function updateUsuarioRol(
  ligaId: number,
  usuarioId: number,
  payload: UpdateUserRolePayload,
): Promise<LeagueUserApiResponse> {
  const response = await apiClient.put<LeagueUserApiResponse>(`/ligas/${ligaId}/usuarios/${usuarioId}/rol`, payload);
  return response.data;
}

export async function updateUsuarioEstado(
  ligaId: number,
  usuarioId: number,
  payload: UpdateUserStatusPayload,
): Promise<LeagueUserApiResponse> {
  const response = await apiClient.put<LeagueUserApiResponse>(`/ligas/${ligaId}/usuarios/${usuarioId}/estado`, payload);
  return response.data;
}

export async function deleteUsuarioLiga(ligaId: number, usuarioId: number): Promise<{ mensaje?: string }> {
  const response = await apiClient.delete<{ mensaje?: string }>(`/ligas/${ligaId}/usuarios/${usuarioId}`);
  return response.data;
}
