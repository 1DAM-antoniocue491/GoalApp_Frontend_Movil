/** Hook de usuarios y roles con API real. Debe existir solo en minúscula. */

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
  buildOptimisticLeagueUser,
  deleteUnionCodeService,
  fetchLeagueUsersService,
  fetchRolesService,
  fetchTeamsForUsersService,
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
  isLoading: boolean;
  isRefreshing: boolean;
  isSubmitting: boolean;
  loading: boolean;
  refreshing: boolean;
  submitting: boolean;
  error: string | null;
  adminCount: number;
  refresh: () => Promise<void>;
  clearError: () => void;
  inviteUser: (form: InviteUserFormData) => Promise<boolean>;
  updateUser: (userId: string, form: ManageUserFormData) => Promise<boolean>;
  removeUser: (userId: string) => Promise<boolean>;
  generateUnionCode: (form: GenerateUnionCodeFormData) => Promise<UnionCodeResponse | null>;
  generateCode: (form: GenerateUnionCodeFormData) => Promise<UnionCodeResponse | null>;
  deleteCode: (codigo: string) => Promise<boolean>;
}

function matchesSearch(user: LeagueUser, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return [user.name, user.email, user.roleLabel, user.role, user.teamName, user.position]
    .filter(Boolean)
    .some(value => String(value).toLowerCase().includes(q));
}

export function useLeagueUsers(ligaId: number): UseLeagueUsersResult {
  const [users, setUsers] = useState<LeagueUser[]>([]);
  // Entradas optimistas: jugadores invitados visibles mientras el backend procesa
  const [pendingInvites, setPendingInvites] = useState<LeagueUser[]>([]);
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [teams, setTeams] = useState<TeamOptionApi[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleOptions = useMemo(() => roleOptionsFromApi(roles), [roles]);
  const teamOptions = useMemo(() => teamOptionsFromApi(teams), [teams]);

  // Merge usuarios reales + invitaciones pendientes que aún no aparecen en el backend
  const mergedUsers = useMemo(() => {
    if (pendingInvites.length === 0) return users;
    const realEmails = new Set(users.map(u => u.email.toLowerCase()));
    const stillPending = pendingInvites.filter(p => !realEmails.has(p.email.toLowerCase()));
    return stillPending.length > 0 ? [...users, ...stillPending] : users;
  }, [users, pendingInvites]);

  // Limpiar pendientes cuando el backend ya los incluye en la respuesta real
  useEffect(() => {
    if (pendingInvites.length === 0) return;
    const realEmails = new Set(users.map(u => u.email.toLowerCase()));
    const remaining = pendingInvites.filter(p => !realEmails.has(p.email.toLowerCase()));
    if (remaining.length !== pendingInvites.length) {
      setPendingInvites(remaining);
    }
  }, [users, pendingInvites]);

  const filteredUsers = useMemo(() => mergedUsers.filter(user => matchesSearch(user, search)), [mergedUsers, search]);
  const adminCount = useMemo(() => mergedUsers.filter(user => user.role === 'admin' && user.active).length, [mergedUsers]);

  const load = useCallback(async () => {
    if (!Number.isFinite(ligaId) || ligaId <= 0) {
      setUsers([]);
      setRoles([]);
      setTeams([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      setError(null);
      setIsRefreshing(true);

      const [usersResult, rolesResult, teamsResult] = await Promise.all([
        fetchLeagueUsersService(ligaId),
        fetchRolesService(),
        fetchTeamsForUsersService(ligaId),
      ]);

      if (usersResult.success) {
        setUsers(usersResult.data ?? []);
      } else {
        setUsers([]);
        setError(usersResult.error ?? 'No se pudieron cargar los usuarios.');
      }

      if (rolesResult.success) setRoles(rolesResult.data ?? []);
      if (teamsResult.success) setTeams(teamsResult.data ?? []);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [ligaId]);

  const inviteUser = useCallback(
    async (form: InviteUserFormData) => {
      setIsSubmitting(true);
      setError(null);

      const result = await inviteUserService(ligaId, form, roles);
      setIsSubmitting(false);

      if (!result.success) {
        setError(result.error ?? 'No se pudo invitar al usuario.');
        return false;
      }

      // Añadir entrada optimista para que el jugador sea visible inmediatamente
      // mientras el backend procesa la invitación y crea los registros de jugador.
      const optimistic = buildOptimisticLeagueUser(form, roles, teams);
      if (optimistic) {
        setPendingInvites(prev => {
          const emailLower = form.email.trim().toLowerCase();
          const exists = prev.some(p => p.email.toLowerCase() === emailLower);
          return exists ? prev : [...prev, optimistic];
        });
      }

      await load();
      return true;
    },
    [ligaId, roles, teams, load],
  );

  const updateUser = useCallback(
    async (userId: string, form: ManageUserFormData) => {
      const user = users.find(item => item.id === userId || String(item.userId) === String(userId));
      if (!user) {
        setError('Este usuario ya no está en la liga. Recarga la pantalla.');
        return false;
      }

      setIsSubmitting(true);
      setError(null);

      // Optimismo suave para estado: evita dobles taps visuales mientras llega el refresh real.
      setUsers(prev => prev.map(item => (
        item.id === user.id
          ? { ...item, active: form.active, status: form.active ? 'active' : 'pending', role: form.role || item.role }
          : item
      )));

      const result = await updateUserService(ligaId, user, form, roles);
      setIsSubmitting(false);

      if (!result.success) {
        setUsers(prev => prev.map(item => (item.id === user.id ? user : item)));
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
      const user = users.find(item => item.id === userId || String(item.userId) === String(userId));
      if (!user) {
        setError('Este usuario ya no está en la liga. Recarga la pantalla.');
        return false;
      }

      setIsSubmitting(true);
      setError(null);

      const result = await removeUserService(ligaId, user.userId);
      setIsSubmitting(false);

      if (!result.success) {
        setError(result.error ?? 'No se pudo eliminar el usuario.');
        return false;
      }

      // Eliminación local inmediata tras 200 OK para evitar un segundo tap sobre una fila ya borrada.
      setUsers(prev => prev.filter(item => item.id !== user.id));
      await load();
      return true;
    },
    [ligaId, users, load],
  );

  const generateUnionCode = useCallback(
    async (form: GenerateUnionCodeFormData) => {
      setIsSubmitting(true);
      setError(null);

      const result = await generateUnionCodeService(ligaId, form, roles);
      setIsSubmitting(false);

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
      setIsSubmitting(true);
      setError(null);

      const result = await deleteUnionCodeService(ligaId, codigo);
      setIsSubmitting(false);

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
    users: mergedUsers,
    filteredUsers,
    roles,
    teams,
    roleOptions,
    teamOptions,
    search,
    setSearch,
    isLoading,
    isRefreshing,
    isSubmitting,
    loading: isLoading,
    refreshing: isRefreshing,
    submitting: isSubmitting,
    error,
    adminCount,
    refresh: load,
    clearError: () => setError(null),
    inviteUser,
    updateUser,
    removeUser,
    generateUnionCode,
    generateCode: generateUnionCode,
    deleteCode,
  };
}
