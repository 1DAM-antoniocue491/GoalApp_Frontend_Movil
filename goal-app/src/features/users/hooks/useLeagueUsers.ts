/**
 * UseLeagueUsers.ts
 *
 * Hook de orquestación para la pantalla Usuarios y roles.
 * Centraliza carga, refresco y mutaciones reales contra API.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { InviteUserFormData, LeagueUser, ManageUserFormData, RoleResponse, TeamForUsersResponse } from '../types/users.types';
import {
  buildRoleOptions,
  buildTeamOptions,
  fetchLeagueUsersService,
  fetchRolesService,
  fetchTeamsByLeagueService,
  inviteLeagueUserService,
  removeLeagueUserService,
  updateLeagueUserService,
} from '../services/userService';

interface UseLeagueUsersResult {
  users: LeagueUser[];
  roles: RoleResponse[];
  teams: TeamForUsersResponse[];
  roleOptions: { value: string; label: string }[];
  inviteRoleOptions: { value: string; label: string }[];
  teamOptions: { value: string; label: string }[];
  isLoading: boolean;
  isRefreshing: boolean;
  isInviting: boolean;
  isUpdating: boolean;
  isRemoving: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  inviteUser: (form: InviteUserFormData) => Promise<boolean>;
  updateUser: (userId: string, form: ManageUserFormData) => Promise<boolean>;
  removeUser: (userId: string) => Promise<boolean>;
  clearError: () => void;
}

export function useLeagueUsers(ligaId: number): UseLeagueUsersResult {
  const [users, setUsers] = useState<LeagueUser[]>([]);
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [teams, setTeams] = useState<TeamForUsersResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleOptions = useMemo(() => buildRoleOptions(roles, { includeAdmin: true }), [roles]);
  const inviteRoleOptions = useMemo(() => buildRoleOptions(roles, { includeAdmin: false }), [roles]);
  const teamOptions = useMemo(() => buildTeamOptions(teams), [teams]);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (!Number.isFinite(ligaId) || ligaId <= 0) {
      setUsers([]);
      setRoles([]);
      setTeams([]);
      setError('No hay una liga activa válida.');
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (mode === 'refresh') setIsRefreshing(true);
    else setIsLoading(true);

    setError(null);

    const [rolesResult, teamsResult, usersResult] = await Promise.all([
      fetchRolesService(),
      fetchTeamsByLeagueService(ligaId),
      fetchLeagueUsersService(ligaId),
    ]);

    if (rolesResult.success) setRoles(rolesResult.data ?? []);
    else setError(rolesResult.error ?? 'No se pudieron cargar los roles.');

    if (teamsResult.success) setTeams(teamsResult.data ?? []);
    // Los equipos son secundarios: si fallan, se puede seguir viendo usuarios.

    if (usersResult.success) setUsers(usersResult.data ?? []);
    else setError(usersResult.error ?? 'No se pudieron cargar los usuarios.');

    setIsLoading(false);
    setIsRefreshing(false);
  }, [ligaId]);

  useEffect(() => {
    load('initial');
  }, [load]);

  const refresh = useCallback(async () => {
    await load('refresh');
  }, [load]);

  const inviteUser = useCallback(async (form: InviteUserFormData) => {
    setIsInviting(true);
    setError(null);

    const result = await inviteLeagueUserService(ligaId, form, roles);

    if (result.success) {
      await refresh();
      setIsInviting(false);
      return true;
    }

    setError(result.error ?? 'No se pudo invitar al usuario.');
    setIsInviting(false);
    return false;
  }, [ligaId, refresh, roles]);

  const updateUser = useCallback(async (userId: string, form: ManageUserFormData) => {
    const user = users.find(item => item.id === userId || String(item.userId) === userId);

    if (!user) {
      setError('No se encontró el usuario seleccionado.');
      return false;
    }

    setIsUpdating(true);
    setError(null);

    const result = await updateLeagueUserService(ligaId, user, form, roles);

    if (result.success) {
      await refresh();
      setIsUpdating(false);
      return true;
    }

    setError(result.error ?? 'No se pudo actualizar el usuario.');
    setIsUpdating(false);
    return false;
  }, [ligaId, refresh, roles, users]);

  const removeUser = useCallback(async (userId: string) => {
    const user = users.find(item => item.id === userId || String(item.userId) === userId);

    if (!user) {
      setError('No se encontró el usuario seleccionado.');
      return false;
    }

    setIsRemoving(true);
    setError(null);

    const result = await removeLeagueUserService(ligaId, user);

    if (result.success) {
      await refresh();
      setIsRemoving(false);
      return true;
    }

    setError(result.error ?? 'No se pudo eliminar el usuario.');
    setIsRemoving(false);
    return false;
  }, [ligaId, refresh, users]);

  return {
    users,
    roles,
    teams,
    roleOptions,
    inviteRoleOptions,
    teamOptions,
    isLoading,
    isRefreshing,
    isInviting,
    isUpdating,
    isRemoving,
    error,
    refresh,
    inviteUser,
    updateUser,
    removeUser,
    clearError: () => setError(null),
  };
}
