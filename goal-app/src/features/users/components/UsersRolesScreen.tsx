/**
 * UsersRolesScreen
 *
 * Pantalla principal de usuarios y roles dentro de una liga.
 * Integra datos reales con API:
 * - GET /usuarios/ligas/{ligaId}/usuarios o fallback GET /ligas/{ligaId}/usuarios
 * - GET /roles/
 * - GET /equipos/?liga_id={ligaId}
 * - POST /invitaciones/ligas/{ligaId}/invitar
 * - PUT /ligas/{ligaId}/usuarios/{usuarioId}/rol
 * - PUT /ligas/{ligaId}/usuarios/{usuarioId}/estado
 * - DELETE /ligas/{ligaId}/usuarios/{usuarioId}
 */

import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useActiveLeague } from '@/src/state/activeLeague/activeLeagueStore';
import { SearchInput } from '@/src/shared/components/ui/SearchInput';
import { SectionTitle } from '@/src/shared/components/ui/SectionTitle';
import { ScrollEdgeButton } from '@/src/shared/components/navigation/ScrollEdgeButton';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';

import { useLeagueUsers } from '../hooks/useLeagueUsers';
import { UsersSummary } from './UsersSummary';
import { UserRowCard } from './UserRowCard';
import { InviteUserModal } from './modals/InviteUserModal';
import { ManageUserModal } from './modals/ManageUserModal';
import type { InviteUserFormData, LeagueUser, ManageUserFormData } from '../types/users.types';

function ScreenState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="items-center justify-center px-8" style={{ flex: 1, backgroundColor: Colors.bg.base }}>
      <View
        style={{
          width: 76,
          height: 76,
          borderRadius: 38,
          backgroundColor: Colors.bg.surface1,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: theme.spacing.lg,
          borderWidth: 1,
          borderColor: Colors.bg.surface2,
        }}
      >
        <Ionicons name={icon} size={36} color={Colors.text.secondary} />
      </View>
      <Text style={{ color: Colors.text.primary, fontSize: theme.fontSize.xl, fontWeight: '800', textAlign: 'center' }}>
        {title}
      </Text>
      <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm, textAlign: 'center', lineHeight: 20, marginTop: theme.spacing.sm }}>
        {description}
      </Text>
      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.85}
          style={{
            marginTop: theme.spacing.xl,
            backgroundColor: Colors.brand.primary,
            borderRadius: theme.borderRadius.full,
            paddingHorizontal: theme.spacing.xl,
            height: 48,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#000', fontWeight: '800', fontSize: theme.fontSize.sm }}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function UsersRolesScreen() {
  const router = useRouter();
  const { session } = useActiveLeague();
  const ligaId = session?.leagueId ? Number(session.leagueId) : 0;
  const isAdmin = session?.role === 'admin';

  const {
    users,
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
    clearError,
  } = useLeagueUsers(ligaId);

  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [managingUser, setManagingUser] = useState<LeagueUser | null>(null);

  // Ref del ScrollView para que ScrollEdgeButton pueda llamar a scrollTo.
  const scrollRef = useRef<ScrollView>(null);
  const [scrollY, setScrollY] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return users;
    return users.filter(user =>
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.roleLabel.toLowerCase().includes(q),
    );
  }, [users, search]);

  async function handleInviteSubmit(data: InviteUserFormData) {
    return inviteUser(data);
  }

  async function handleUpdateUser(userId: string, data: ManageUserFormData) {
    const ok = await updateUser(userId, data);
    if (ok) setManagingUser(null);
    return ok;
  }

  async function handleRemoveUser(userId: string) {
    const ok = await removeUser(userId);
    if (ok) setManagingUser(null);
    return ok;
  }

  if (!session || ligaId <= 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.base }}>
        <ScreenState
          icon="shield-outline"
          title="Selecciona una liga"
          description="Para gestionar usuarios y roles primero necesitas tener una liga activa."
          actionLabel="Volver"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.base }}>
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-6 py-4"
        style={{ borderBottomWidth: 1, borderBottomColor: Colors.bg.surface2 }}
      >
        <View className="flex-row items-center gap-3" style={{ flex: 1 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: Colors.bg.surface1,
            }}
          >
            <Ionicons name="arrow-back" size={21} color={Colors.text.primary} />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <SectionTitle title="Usuarios y roles" />
            <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.xs, marginTop: 2 }} numberOfLines={1}>
              {session.leagueName}
            </Text>
          </View>
        </View>

        {isAdmin ? (
          <TouchableOpacity
            onPress={() => {
              clearError();
              setInviteOpen(true);
            }}
            activeOpacity={0.85}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: Colors.brand.primary,
              borderRadius: theme.borderRadius.full,
              paddingHorizontal: theme.spacing.md,
              height: 38,
              gap: 6,
            }}
          >
            <Ionicons name="person-add-outline" size={16} color="#000" />
            <Text style={{ color: '#000', fontSize: theme.fontSize.sm, fontWeight: '800' }}>
              Invitar
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {isLoading ? (
        <ScreenState icon="people-outline" title="Cargando usuarios" description="Estamos consultando los usuarios reales de la liga." />
      ) : (
        <>
          <ScrollView
            ref={scrollRef}
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: theme.spacing.xl,
              paddingTop: theme.spacing.xl,
              paddingBottom: theme.spacing.xxl * 2,
            }}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={Colors.brand.primary} />
            }
            scrollEventThrottle={16}
            onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
            onContentSizeChange={(_, h) => setContentHeight(h)}
            onLayout={(e) => setViewportHeight(e.nativeEvent.layout.height)}
          >
            {/* Error controlado */}
            {error ? (
              <View
                style={{
                  backgroundColor: 'rgba(255,69,52,0.10)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,69,52,0.35)',
                  borderRadius: theme.borderRadius.xl,
                  padding: theme.spacing.md,
                  marginBottom: theme.spacing.lg,
                }}
              >
                <Text style={{ color: Colors.semantic.error, fontSize: theme.fontSize.sm, lineHeight: 20 }}>
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Resumen de métricas reales */}
            <UsersSummary users={users} />

            {/* Buscador */}
            <View className="mb-5">
              <SearchInput
                value={search}
                placeholder="Buscar por nombre, email o rol..."
                onChangeText={setSearch}
                onClear={() => setSearch('')}
              />
            </View>

            {/* Encabezado de lista */}
            <View className="flex-row items-center justify-between mb-3">
              <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm }}>
                {filteredUsers.length} miembro{filteredUsers.length !== 1 ? 's' : ''}
              </Text>
              {isRefreshing ? <ActivityIndicator size="small" color={Colors.brand.primary} /> : null}
            </View>

            {/* Lista de usuarios reales */}
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <UserRowCard
                  key={user.id}
                  user={user}
                  onManage={isAdmin ? setManagingUser : () => undefined}
                />
              ))
            ) : (
              <View className="items-center py-14">
                <View
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: 35,
                    backgroundColor: Colors.bg.surface1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: Colors.bg.surface2,
                  }}
                >
                  <Ionicons name="people-outline" size={34} color={Colors.text.disabled} />
                </View>
                <Text style={{ color: Colors.text.primary, fontSize: theme.fontSize.md, fontWeight: '700', marginTop: theme.spacing.md }}>
                  No se encontraron usuarios
                </Text>
                <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm, textAlign: 'center', marginTop: 6 }}>
                  Prueba con otra búsqueda o invita nuevos usuarios a la liga.
                </Text>
              </View>
            )}
          </ScrollView>

          <ScrollEdgeButton
            scrollRef={scrollRef}
            scrollY={scrollY}
            contentHeight={contentHeight}
            viewportHeight={viewportHeight}
          />
        </>
      )}

      {/* Modal Invitar usuario */}
      <InviteUserModal
        visible={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSubmit={handleInviteSubmit}
        teamOptions={teamOptions}
        roleOptions={inviteRoleOptions}
        isSubmitting={isInviting}
        error={error}
      />

      {/* Modal Gestionar usuario */}
      <ManageUserModal
        user={managingUser}
        visible={Boolean(managingUser)}
        onClose={() => setManagingUser(null)}
        onUpdate={handleUpdateUser}
        onRemove={handleRemoveUser}
        roleOptions={roleOptions}
        isUpdating={isUpdating}
        isRemoving={isRemoving}
        error={error}
      />
    </SafeAreaView>
  );
}
