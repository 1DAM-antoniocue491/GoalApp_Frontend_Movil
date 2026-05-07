/**
 * useLeagueUsers
 *
 * Hook único para la pantalla Usuarios y roles.
 * Carga datos reales de API: usuarios, roles y equipos.
 * No usa mocks locales.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  ApiRole,
  GenerateUnionCodeFormData,
  InviteUserFormData,
  LeagueUser,
  ManageUserFormData,
  TeamOptionApi,
  UnionCodeResponse,
} from '../types/users.types';
import {
  fetchLeagueUsersService,
  fetchRolesService,
  fetchTeamsForUsersService,
  generateUnionCodeService,
  inviteUserService,
  removeUserService,
  updateUserService,
} from '../services/userService';

interface UseLeagueUsersResult {
  users: LeagueUser[];
  roles: ApiRole[];
  teams: TeamOptionApi[];
  isLoading: boolean;
  isRefreshing: boolean;
  isSubmitting: boolean;
  error: string | null;
  search: string;
  setSearch: (value: string) => void;
  filteredUsers: LeagueUser[];
  refresh: () => Promise<void>;
  inviteUser: (data: InviteUserFormData) => Promise<boolean>;
  updateUser: (user: LeagueUser, data: ManageUserFormData) => Promise<boolean>;
  removeUser: (user: LeagueUser) => Promise<boolean>;
  generateUnionCode: (data: GenerateUnionCodeFormData) => Promise<UnionCodeResponse | null>;
}

export function useLeagueUsers(ligaId: number): UseLeagueUsersResult {
  const [users, setUsers] = useState<LeagueUser[]>([]);
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [teams, setTeams] = useState<TeamOptionApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async (mode: 'initial' | 'refresh' = 'refresh') => {
    if (!ligaId || !Number.isFinite(ligaId)) {
      setError('No hay una liga activa seleccionada');
      setUsers([]);
      setRoles([]);
      setTeams([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (mode === 'initial') setIsLoading(true);
    else setIsRefreshing(true);

    setError(null);

    const [usersResult, rolesResult, teamsResult] = await Promise.all([
      fetchLeagueUsersService(ligaId),
      fetchRolesService(),
      fetchTeamsForUsersService(ligaId),
    ]);

    if (usersResult.success) setUsers(usersResult.data ?? []);
    else setError(usersResult.error ?? 'No se pudieron cargar los usuarios');

    if (rolesResult.success) setRoles(rolesResult.data ?? []);
    else setError(prev => prev ?? rolesResult.error ?? 'No se pudieron cargar los roles');

    if (teamsResult.success) setTeams(teamsResult.data ?? []);
    // Equipos es secundario: solo afecta a invitaciones por equipo.

    setIsLoading(false);
    setIsRefreshing(false);
  }, [ligaId]);

  useEffect(() => {
    loadData('initial');
  }, [loadData]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(user =>
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.roleLabel.toLowerCase().includes(q),
    );
  }, [search, users]);

  const inviteUser = useCallback(async (data: InviteUserFormData) => {
    setIsSubmitting(true);
    setError(null);

    const result = await inviteUserService(ligaId, data, roles);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error ?? 'No se pudo invitar al usuario');
      return false;
    }

    await loadData('refresh');
    return true;
  }, [ligaId, loadData, roles]);

  const updateUser = useCallback(async (user: LeagueUser, data: ManageUserFormData) => {
    setIsSubmitting(true);
    setError(null);

    const result = await updateUserService(ligaId, user, data, roles);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error ?? 'No se pudo actualizar el usuario');
      return false;
    }

    await loadData('refresh');
    return true;
  }, [ligaId, loadData, roles]);

  const removeUser = useCallback(async (user: LeagueUser) => {
    setIsSubmitting(true);
    setError(null);

    const result = await removeUserService(ligaId, user.userId);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error ?? 'No se pudo eliminar el usuario');
      return false;
    }

    await loadData('refresh');
    return true;
  }, [ligaId, loadData]);

  const generateUnionCode = useCallback(async (data: GenerateUnionCodeFormData) => {
    setIsSubmitting(true);
    setError(null);

    const result = await generateUnionCodeService(ligaId, data, roles);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error ?? 'No se pudo generar el código');
      return null;
    }

    return result.data ?? null;
  }, [ligaId, roles]);

  return {
    users,
    roles,
    teams,
    isLoading,
    isRefreshing,
    isSubmitting,
    error,
    search,
    setSearch,
    filteredUsers,
    refresh: () => loadData('refresh'),
    inviteUser,
    updateUser,
    removeUser,
    generateUnionCode,
  };
}
