/** Hook de Usuarios y Roles con API real. */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  ApiRole,
  GenerateUnionCodeFormData,
  InviteUserFormData,
  LeagueUser,
  ManageUserFormData,
  SelectOption,
  TeamOptionApi,
  UnionCodeResponse,
} from '../types/users.types';
import {
  deleteUnionCodeService,
  fetchUsersBootstrapService,
  generateUnionCodeService,
  inviteUserService,
  removeUserService,
  roleOptionsFromApi,
  teamOptionsFromApi,
  updateUserService,
} from '../services/userService';

export interface UseLeagueUsersResult {
  users: LeagueUser[];
  filteredUsers: LeagueUser[];
  roles: ApiRole[];
  teams: TeamOptionApi[];
  roleOptions: SelectOption[];
  teamOptions: SelectOption[];
  search: string;
  setSearch: (value: string) => void;
  loading: boolean;
  refreshing: boolean;
  submitting: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  isSubmitting: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  inviteUser: (form: InviteUserFormData) => Promise<boolean>;
  updateUser: (userId: string, form: ManageUserFormData) => Promise<boolean>;
  removeUser: (userId: string) => Promise<boolean>;
  generateCode: (form: GenerateUnionCodeFormData) => Promise<UnionCodeResponse | null>;
  generateUnionCode: (form: GenerateUnionCodeFormData) => Promise<UnionCodeResponse | null>;
  deleteCode: (codigo: string) => Promise<boolean>;
}

function normalizeSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function useLeagueUsers(ligaId: number): UseLeagueUsersResult {
  const [users, setUsers] = useState<LeagueUser[]>([]);
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [teams, setTeams] = useState<TeamOptionApi[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleOptions = useMemo(() => roleOptionsFromApi(roles), [roles]);
  const teamOptions = useMemo(() => teamOptionsFromApi(teams), [teams]);

  const filteredUsers = useMemo(() => {
    const q = normalizeSearch(search);
    if (!q) return users;

    return users.filter(user => {
      const haystack = normalizeSearch(`${user.name} ${user.email} ${user.roleLabel} ${user.teamName ?? ''}`);
      return haystack.includes(q);
    });
  }, [users, search]);

  const load = useCallback(async () => {
    if (!ligaId || Number.isNaN(ligaId)) {
      setUsers([]);
      setRoles([]);
      setTeams([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setError(null);
    setRefreshing(true);

    const result = await fetchUsersBootstrapService(ligaId);

    if (!result.success || !result.data) {
      setUsers([]);
      setError(result.error ?? 'No se pudieron cargar los usuarios.');
    } else {
      setUsers(result.data.users);
      setRoles(result.data.roles);
      setTeams(result.data.teams);
    }

    setLoading(false);
    setRefreshing(false);
  }, [ligaId]);

  const inviteUser = useCallback(
    async (form: InviteUserFormData) => {
      setSubmitting(true);
      setError(null);
      const result = await inviteUserService(ligaId, form, roles);
      setSubmitting(false);

      if (!result.success) {
        setError(result.error ?? 'No se pudo invitar al usuario.');
        return false;
      }

      await load();
      return true;
    },
    [ligaId, roles, load],
  );

  const updateUser = useCallback(
    async (userId: string, form: ManageUserFormData) => {
      const user = users.find(item => item.id === userId || String(item.userId) === userId);
      if (!user) {
        setError('No se encontró el usuario seleccionado.');
        return false;
      }

      setSubmitting(true);
      setError(null);
      const result = await updateUserService(ligaId, user, form, roles);
      setSubmitting(false);

      if (!result.success) {
        setError(result.error ?? 'No se pudo actualizar el usuario.');
        return false;
      }

      await load();
      return true;
    },
    [ligaId, users, roles, load],
  );

  const removeUser = useCallback(
    async (userId: string) => {
      const user = users.find(item => item.id === userId || String(item.userId) === userId);
      if (!user) {
        setError('No se encontró el usuario seleccionado.');
        return false;
      }

      setSubmitting(true);
      setError(null);
      const result = await removeUserService(ligaId, user.userId);
      setSubmitting(false);

      if (!result.success) {
        setError(result.error ?? 'No se pudo eliminar el usuario.');
        return false;
      }

      await load();
      return true;
    },
    [ligaId, users, load],
  );

  const generateCode = useCallback(
    async (form: GenerateUnionCodeFormData) => {
      setSubmitting(true);
      setError(null);
      const result = await generateUnionCodeService(ligaId, form, roles);
      setSubmitting(false);

      if (!result.success) {
        setError(result.error ?? 'No se pudo generar el código.');
        return null;
      }

      return result.data ?? null;
    },
    [ligaId, roles],
  );

  const deleteCode = useCallback(
    async (codigo: string) => {
      setSubmitting(true);
      setError(null);
      const result = await deleteUnionCodeService(ligaId, codigo);
      setSubmitting(false);

      if (!result.success) {
        setError(result.error ?? 'No se pudo eliminar el código.');
        return false;
      }

      return true;
    },
    [ligaId],
  );

  useEffect(() => {
    load();
  }, [load]);

  return {
    users,
    filteredUsers,
    roles,
    teams,
    roleOptions,
    teamOptions,
    search,
    setSearch,
    loading,
    refreshing,
    submitting,
    isLoading: loading,
    isRefreshing: refreshing,
    isSubmitting: submitting,
    error,
    refresh: load,
    inviteUser,
    updateUser,
    removeUser,
    generateCode,
    generateUnionCode: generateCode,
    deleteCode,
  };
}
