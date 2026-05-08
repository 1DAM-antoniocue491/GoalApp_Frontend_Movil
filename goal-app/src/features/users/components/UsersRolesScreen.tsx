/** Pantalla principal de usuarios y roles. Todo usa API real. */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SearchInput } from '@/src/shared/components/ui/SearchInput';
import { SectionTitle } from '@/src/shared/components/ui/SectionTitle';
import { ScrollEdgeButton } from '@/src/shared/components/navigation/ScrollEdgeButton';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { useActiveLeague } from '@/src/state/activeLeague/activeLeagueStore';
import { toUserRole } from '@/src/shared/utils/roles';
import { roleOptionsFromApi, teamOptionsFromApi } from '../services/userService';
import { useLeagueUsers } from '../hooks/useLeagueUsers';
import { UsersSummary } from './UsersSummary';
import { UserRowCard } from './UserRowCard';
import { InviteUserModal } from './modals/InviteUserModal';
import { ManageUserModal } from './modals/ManageUserModal';
import { GenerateUnionCodeModal } from './modals/GenerateUnionCodeModal';
import type { InviteUserFormData, LeagueUser, ManageUserFormData, UserRole } from '../types/users.types';

function getCurrentUserId(session: unknown): number | null {
  const raw = (session as any)?.userId ?? (session as any)?.id_usuario ?? (session as any)?.user?.id_usuario ?? (session as any)?.user?.id;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function getAllowedInviteRoles(currentRole: UserRole): UserRole[] {
  if (currentRole === 'admin') return ['admin', 'coach', 'delegate', 'player', 'observer'];
  if (currentRole === 'coach') return ['delegate', 'player'];
  return [];
}

export function UsersRolesScreen() {
  const router = useRouter();
  const { session } = useActiveLeague();
  const ligaId = session?.leagueId ? Number(session.leagueId) : 0;
  const currentUserRole = toUserRole((session as any)?.role);
  const currentUserId = getCurrentUserId(session);

  const {
    users,
    roles,
    teams,
    filteredUsers,
    isLoading,
    isRefreshing,
    isSubmitting,
    error,
    search,
    setSearch,
    refresh,
    inviteUser,
    updateUser,
    removeUser,
    generateUnionCode,
    deleteCode,
    adminCount,
    clearError,
  } = useLeagueUsers(ligaId);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [unionCodeOpen, setUnionCodeOpen] = useState(false);
  const [managingUser, setManagingUser] = useState<LeagueUser | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const [scrollY, setScrollY] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const allowedInviteRoles = useMemo(() => getAllowedInviteRoles(currentUserRole), [currentUserRole]);
  const canInvite = allowedInviteRoles.length > 0;
  const roleOptions = useMemo(() => roleOptionsFromApi(roles, allowedInviteRoles), [roles, allowedInviteRoles]);
  const manageRoleOptions = useMemo(() => roleOptionsFromApi(roles), [roles]);
  const teamOptions = useMemo(() => teamOptionsFromApi(teams), [teams]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(timeout);
  }, [toast]);

  async function handleInviteSubmit(data: InviteUserFormData) {
    const ok = await inviteUser(data);
    if (ok) {
      setInviteOpen(false);
      setToast('Invitación enviada correctamente.');
    }
    return ok;
  }

  async function handleUpdateUser(userId: string, data: ManageUserFormData) {
    const ok = await updateUser(userId, data);
    if (ok) {
      setManagingUser(null);
      setToast('Usuario actualizado correctamente.');
    }
    return ok;
  }

  async function handleRemoveUser(userId: string) {
    const ok = await removeUser(userId);
    if (ok) {
      setManagingUser(null);
      setToast('Usuario eliminado de la liga.');
    }
    return ok;
  }

  async function handleToggleActive(user: LeagueUser) {
    if (togglingUserId || isSubmitting) return false;

    setTogglingUserId(user.id);
    const ok = await updateUser(user.id, { role: user.role, active: !user.active });
    setTogglingUserId(null);

    if (ok) setToast(user.active ? 'Usuario desactivado.' : 'Usuario activado.');
    return ok;
  }

  if (!ligaId) {
    return (
      <SafeAreaView style={screenStyles.safeArea}>
        <View style={screenStyles.centerState}>
          <Ionicons name="warning-outline" size={42} color={Colors.semantic.warning} />
          <Text style={screenStyles.stateTitle}>No hay liga activa</Text>
          <Text style={screenStyles.stateText}>Selecciona una liga para gestionar sus usuarios.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={screenStyles.safeArea}>
        <View style={screenStyles.centerState}>
          <ActivityIndicator color={Colors.brand.primary} />
          <Text style={screenStyles.stateText}>Cargando usuarios...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={screenStyles.safeArea}>
      <View style={screenStyles.header}>
        <View className="flex-row items-center gap-3" style={{ flex: 1 }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <SectionTitle title="Usuarios y roles" />
            <Text style={screenStyles.headerSubtitle} numberOfLines={1}>{session?.leagueName ?? 'Liga activa'}</Text>
          </View>
        </View>

        {canInvite ? (
          <View style={screenStyles.headerActions}>
            <TouchableOpacity
              style={screenStyles.iconButton}
              onPress={() => {
                clearError();
                setUnionCodeOpen(true);
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="key-outline" size={18} color={Colors.brand.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={screenStyles.primaryButton}
              onPress={() => {
                clearError();
                setInviteOpen(true);
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="person-add-outline" size={16} color="#000" />
              <Text style={screenStyles.primaryButtonText}>Invitar</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {toast ? (
        <View style={screenStyles.toast}>
          <Ionicons name="checkmark-circle-outline" size={18} color={Colors.semantic.success} />
          <Text style={screenStyles.toastText}>{toast}</Text>
        </View>
      ) : null}

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={screenStyles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={Colors.brand.primary} />}
        scrollEventThrottle={16}
        onScroll={event => setScrollY(event.nativeEvent.contentOffset.y)}
        onContentSizeChange={(_, height) => setContentHeight(height)}
        onLayout={event => setViewportHeight(event.nativeEvent.layout.height)}
      >
        <UsersSummary users={users} />

        <View className="mb-5">
          <SearchInput
            value={search}
            placeholder="Buscar por nombre, email, rol o equipo..."
            onChangeText={setSearch}
            onClear={() => setSearch('')}
          />
        </View>

        {error ? (
          <View style={screenStyles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={Colors.semantic.error} />
            <Text style={screenStyles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={screenStyles.listHeader}>
          <Text style={screenStyles.listTitle}>{filteredUsers.length} miembro{filteredUsers.length !== 1 ? 's' : ''}</Text>
          <TouchableOpacity onPress={refresh} hitSlop={12}>
            <Ionicons name="refresh-outline" size={18} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {filteredUsers.length > 0 ? (
          filteredUsers.map((user: LeagueUser) => (
            <UserRowCard
              key={user.id}
              user={user}
              onManage={setManagingUser}
              onToggleActive={handleToggleActive}
              isToggling={togglingUserId === user.id}
            />
          ))
        ) : (
          <View style={screenStyles.emptyState}>
            <Ionicons name="people-outline" size={44} color={Colors.text.disabled} />
            <Text style={screenStyles.emptyTitle}>No se encontraron usuarios</Text>
            <Text style={screenStyles.emptyText}>Prueba con otra búsqueda o invita a un nuevo miembro.</Text>
          </View>
        )}
      </ScrollView>

      <ScrollEdgeButton scrollRef={scrollRef} scrollY={scrollY} contentHeight={contentHeight} viewportHeight={viewportHeight} />

      <InviteUserModal
        visible={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSubmit={handleInviteSubmit}
        roleOptions={roleOptions}
        teamOptions={teamOptions}
        isSubmitting={isSubmitting}
        error={error}
      />

      <GenerateUnionCodeModal
        visible={unionCodeOpen}
        onClose={() => setUnionCodeOpen(false)}
        onGenerate={generateUnionCode}
        onDelete={deleteCode}
        roleOptions={roleOptions}
        teamOptions={teamOptions}
        isSubmitting={isSubmitting}
        error={error}
      />

      {managingUser ? (
        <ManageUserModal
          user={managingUser}
          visible={true}
          onClose={() => setManagingUser(null)}
          onUpdate={handleUpdateUser}
          onRemove={handleRemoveUser}
          roleOptions={manageRoleOptions}
          isSubmitting={isSubmitting}
          error={error}
          currentUserId={currentUserId}
          adminCount={adminCount}
        />
      ) : null}
    </SafeAreaView>
  );
}

export default UsersRolesScreen;

const screenStyles = {
  safeArea: { flex: 1, backgroundColor: Colors.bg.base },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bg.surface2,
    gap: theme.spacing.md,
  },
  headerSubtitle: { color: Colors.text.secondary, fontSize: theme.fontSize.xs, marginTop: 2 },
  headerActions: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: theme.spacing.sm },
  iconButton: { width: 38, height: 38, borderRadius: theme.borderRadius.lg, backgroundColor: Colors.bg.surface1, borderWidth: 1, borderColor: Colors.bg.surface2, alignItems: 'center' as const, justifyContent: 'center' as const },
  primaryButton: { flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: Colors.brand.primary, borderRadius: theme.borderRadius.lg, paddingHorizontal: theme.spacing.md, height: 38, gap: 6 },
  primaryButtonText: { color: '#000', fontSize: theme.fontSize.sm, fontWeight: '800' as const },
  toast: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginHorizontal: theme.spacing.xl, marginTop: theme.spacing.md, padding: theme.spacing.md, borderRadius: 16, backgroundColor: 'rgba(45,212,104,0.12)', borderWidth: 1, borderColor: 'rgba(45,212,104,0.35)' },
  toastText: { flex: 1, color: Colors.semantic.success, fontSize: theme.fontSize.sm, fontWeight: '700' as const },
  content: { paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.xl, paddingBottom: theme.spacing.xxl * 2 },
  listHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginBottom: theme.spacing.md },
  listTitle: { color: Colors.text.secondary, fontSize: theme.fontSize.sm, fontWeight: '600' as const },
  errorBox: { flexDirection: 'row' as const, gap: 8, alignItems: 'center' as const, backgroundColor: 'rgba(255,69,52,0.10)', borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, marginBottom: theme.spacing.md },
  errorText: { flex: 1, color: Colors.semantic.error, fontSize: theme.fontSize.sm },
  emptyState: { alignItems: 'center' as const, paddingVertical: theme.spacing.xxl },
  emptyTitle: { color: Colors.text.primary, fontSize: theme.fontSize.md, fontWeight: '700' as const, marginTop: theme.spacing.md },
  emptyText: { color: Colors.text.secondary, fontSize: theme.fontSize.sm, textAlign: 'center' as const, marginTop: 4 },
  centerState: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, padding: theme.spacing.xl },
  stateTitle: { color: Colors.text.primary, fontSize: theme.fontSize.lg, fontWeight: '700' as const, marginTop: theme.spacing.md },
  stateText: { color: Colors.text.secondary, fontSize: theme.fontSize.sm, textAlign: 'center' as const, marginTop: theme.spacing.sm },
};
