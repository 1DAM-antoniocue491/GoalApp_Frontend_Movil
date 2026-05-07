/** API móvil de Usuarios y Roles. */

import { apiClient } from '@/src/shared/api/client';
import type {
  ApiRole,
  GenerateUnionCodePayload,
  InviteUserPayload,
  LeagueUserApiA,
  LeagueUserApiB,
  PlayerApi,
  TeamOptionApi,
  UnionCodeResponse,
} from '../types/users.types';

export async function getRoles(): Promise<ApiRole[]> {
  const { data } = await apiClient.get<ApiRole[]>('/roles/');
  return Array.isArray(data) ? data : [];
}

export async function getTeamsByLeague(ligaId: number): Promise<TeamOptionApi[]> {
  const { data } = await apiClient.get<TeamOptionApi[]>(`/equipos/?liga_id=${ligaId}`);
  return Array.isArray(data) ? data : [];
}

export async function getPlayersByLeague(ligaId: number): Promise<PlayerApi[]> {
  const { data } = await apiClient.get<PlayerApi[]>(`/jugadores/?liga_id=${ligaId}`);
  return Array.isArray(data) ? data : [];
}

/** Endpoint principal usado por web para listar usuarios con rol. */
export async function getUsersByLeague(ligaId: number): Promise<LeagueUserApiA[]> {
  const { data } = await apiClient.get<LeagueUserApiA[]>(`/usuarios/ligas/${ligaId}/usuarios`);
  return Array.isArray(data) ? data : [];
}

/** Endpoint alternativo usado por web/memberApi. */
export async function getLeagueUsersFallback(ligaId: number): Promise<LeagueUserApiB[]> {
  const { data } = await apiClient.get<LeagueUserApiB[]>(`/ligas/${ligaId}/usuarios`);
  return Array.isArray(data) ? data : [];
}

export async function inviteUserToLeague(ligaId: number, payload: InviteUserPayload): Promise<void> {
  await apiClient.post(`/invitaciones/ligas/${ligaId}/invitar`, payload);
}

export async function updateLeagueUserRole(ligaId: number, usuarioId: number, idRol: number): Promise<void> {
  await apiClient.put(`/ligas/${ligaId}/usuarios/${usuarioId}/rol`, { id_rol: idRol });
}

export async function updateLeagueUserStatus(ligaId: number, usuarioId: number, activo: boolean): Promise<void> {
  await apiClient.put(`/ligas/${ligaId}/usuarios/${usuarioId}/estado`, { activo });
}

export async function deleteLeagueUser(ligaId: number, usuarioId: number): Promise<void> {
  await apiClient.delete(`/ligas/${ligaId}/usuarios/${usuarioId}`);
}

export async function generateUnionCode(
  ligaId: number,
  payload: GenerateUnionCodePayload,
): Promise<UnionCodeResponse> {
  const { data } = await apiClient.post<UnionCodeResponse>(`/invitaciones/ligas/${ligaId}/generar-codigo`, payload);
  return data;
}

export async function deleteUnionCode(ligaId: number, codigo: string): Promise<void> {
  await apiClient.delete(`/invitaciones/ligas/${ligaId}/codigos/${encodeURIComponent(codigo)}`);
}
