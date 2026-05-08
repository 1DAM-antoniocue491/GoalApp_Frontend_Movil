/** API móvil de Usuarios y roles. Usa apiClient; no hay mocks ni fetch directo. */

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
  return data;
}

export async function getTeamsByLeague(ligaId: number): Promise<TeamOptionApi[]> {
  const { data } = await apiClient.get<TeamOptionApi[]>(`/equipos/?liga_id=${ligaId}`);
  return data;
}

/** Se usa para asociar jugadores a su equipo real cuando la respuesta de usuarios no lo trae embebido. */
export async function getPlayersByLeague(ligaId: number): Promise<PlayerApi[]> {
  const { data } = await apiClient.get<PlayerApi[]>(`/jugadores/?liga_id=${ligaId}`);
  return data;
}

/** Endpoint principal usado por web para listar usuarios con rol. */
export async function getUsersByLeague(ligaId: number): Promise<LeagueUserApiA[]> {
  const { data } = await apiClient.get<LeagueUserApiA[]>(`/usuarios/ligas/${ligaId}/usuarios`);
  return data;
}

/** Endpoint alternativo usado por memberApi web. */
export async function getLeagueUsersFallback(ligaId: number): Promise<LeagueUserApiB[]> {
  const { data } = await apiClient.get<LeagueUserApiB[]>(`/ligas/${ligaId}/usuarios`);
  return data;
}

export async function inviteUserToLeague(ligaId: number, payload: InviteUserPayload): Promise<void> {
  await apiClient.post(`/invitaciones/ligas/${ligaId}/invitar`, payload);
}

export async function updateLeagueUserRole(
  ligaId: number,
  usuarioId: number,
  idRol: number,
): Promise<LeagueUserApiB> {
  const { data } = await apiClient.put<LeagueUserApiB>(`/ligas/${ligaId}/usuarios/${usuarioId}/rol`, {
    id_rol: idRol,
  });
  return data;
}

export async function updateLeagueUserStatus(
  ligaId: number,
  usuarioId: number,
  activo: boolean,
): Promise<LeagueUserApiB> {
  const { data } = await apiClient.put<LeagueUserApiB>(`/ligas/${ligaId}/usuarios/${usuarioId}/estado`, {
    activo,
  });
  return data;
}

export async function deleteLeagueUser(
  ligaId: number,
  usuarioId: number,
): Promise<{ mensaje?: string }> {
  const { data } = await apiClient.delete<{ mensaje?: string }>(`/ligas/${ligaId}/usuarios/${usuarioId}`);
  return data;
}

export async function generateUnionCode(
  ligaId: number,
  payload: GenerateUnionCodePayload,
): Promise<UnionCodeResponse> {
  const { data } = await apiClient.post<UnionCodeResponse>(`/invitaciones/ligas/${ligaId}/generar-codigo`, payload);
  return data;
}

export async function deleteUnionCode(
  ligaId: number,
  codigo: string,
): Promise<{ mensaje?: string; codigo?: string }> {
  const { data } = await apiClient.delete<{ mensaje?: string; codigo?: string }>(
    `/invitaciones/ligas/${ligaId}/codigos/${encodeURIComponent(codigo)}`,
  );
  return data;
}
