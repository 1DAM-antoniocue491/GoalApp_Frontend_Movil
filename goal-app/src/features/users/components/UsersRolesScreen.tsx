/**
 * Pantalla principal de Usuarios y Roles.
 *
 * Sin mocks locales: usuarios, roles, equipos e invitaciones se cargan desde API real.
 */

import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { useActiveLeague } from '@/src/state/activeLeague/activeLeagueStore';
import { useLeagueUsers } from '../hooks/useLeagueUsers';
import { UsersSummary } from './UsersSummary';
import { UserRowCard } from './UserRowCard';
import { InviteUserModal } from './modals/InviteUserModal';
import { ManageUserModal } from './modals/ManageUserModal';
import { GenerateUnionCodeModal } from './modals/GenerateUnionCodeModal';
import type { LeagueUser } from '../types/users.types';

export function UsersRolesScreen() {
  const router = useRouter();
  const { session } = useActiveLeague();
  const ligaId = session?.leagueId ? Number(session.leagueId) : 0;

  const {
    users,
    filteredUsers,
    roleOptions,
    teamOptions,
    search,
    setSearch,
    isLoading,
    isRefreshing,
    isSubmitting,
    error,
    refresh,
    inviteUser,
    updateUser,
    removeUser,
    generateUnionCode,
    deleteCode,
  } = useLeagueUsers(ligaId);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [unionCodeOpen, setUnionCodeOpen] = useState(false);
  const [managingUser, setManagingUser] = useState<LeagueUser | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  if (!ligaId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.base }}>
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="warning-outline" size={44} color={Colors.semantic.warning} />
          <Text style={{ color: Colors.text.primary, fontSize: theme.fontSize.lg, fontWeight: '800', marginTop: 16 }}>
            No hay liga activa
          </Text>
          <Text style={{ color: Colors.text.secondary, textAlign: 'center', marginTop: 8 }}>
            Selecciona una liga para gestionar usuarios y roles.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.base }}>
      <View
        className="flex-row items-center justify-between px-6 py-5"
        style={{ borderBottomWidth: 1, borderBottomColor: Colors.bg.surface2 }}
      >
        <View className="flex-row items-center" style={{ flex: 1 }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} className="mr-4">
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: Colors.text.primary, fontSize: theme.fontSize.xxl, fontWeight: '900' }} numberOfLines={1}>
              Usuarios y roles
            </Text>
            <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm, marginTop: 2 }} numberOfLines={1}>
              {session?.leagueName ?? 'Liga activa'}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center" style={{ gap: 10 }}>
          <TouchableOpacity
            onPress={() => setUnionCodeOpen(true)}
            activeOpacity={0.85}
            className="items-center justify-center rounded-2xl"
            style={{ width: 46, height: 46, backgroundColor: Colors.bg.surface1, borderWidth: 1, borderColor: Colors.bg.surface2 }}
          >
            <Ionicons name="key-outline" size={21} color={Colors.brand.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setInviteOpen(true)}
            activeOpacity={0.85}
            className="flex-row items-center justify-center rounded-2xl px-4"
            style={{ height: 46, backgroundColor: Colors.brand.primary }}
          >
            <Ionicons name="person-add-outline" size={18} color="#000" />
            <Text style={{ color: '#000', fontSize: theme.fontSize.sm, fontWeight: '900', marginLeft: 8 }}>
              Invitar
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={Colors.brand.primary} />
          <Text style={{ color: Colors.text.secondary, marginTop: 12 }}>Cargando usuarios...</Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 64 }}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={Colors.brand.primary} />}
        >
          <UsersSummary users={users} />

          <View
            className="flex-row items-center rounded-2xl px-4 mb-5"
            style={{ backgroundColor: Colors.bg.surface1, height: 54, borderWidth: 1, borderColor: Colors.bg.surface2 }}
          >
            <Ionicons name="search-outline" size={20} color={Colors.text.disabled} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar usuario, email, rol o equipo..."
              placeholderTextColor={Colors.text.disabled}
              className="flex-1 ml-3"
              style={{ color: Colors.text.primary, fontSize: theme.fontSize.md }}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={10}>
                <Ionicons name="close-circle" size={18} color={Colors.text.disabled} />
              </TouchableOpacity>
            ) : null}
          </View>

          {error ? (
            <View
              className="flex-row items-start rounded-2xl p-4 mb-5"
              style={{ backgroundColor: 'rgba(255,69,52,0.10)', borderWidth: 1, borderColor: 'rgba(255,69,52,0.35)' }}
            >
              <Ionicons name="alert-circle-outline" size={20} color={Colors.semantic.error} />
              <Text style={{ flex: 1, color: Colors.semantic.error, fontSize: theme.fontSize.sm, marginLeft: 10 }}>
                {error}
              </Text>
            </View>
          ) : null}

          <View className="flex-row items-center justify-between mb-3">
            <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm, fontWeight: '700' }}>
              {filteredUsers.length} miembro{filteredUsers.length !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity onPress={refresh} hitSlop={12}>
              <Ionicons name="refresh-outline" size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {filteredUsers.length > 0 ? (
            filteredUsers.map((user: LeagueUser) => (
              <UserRowCard key={user.id} user={user} onManage={setManagingUser} />
            ))
          ) : (
            <View className="items-center justify-center py-12">
              <Ionicons name="people-outline" size={46} color={Colors.text.disabled} />
              <Text style={{ color: Colors.text.primary, fontSize: theme.fontSize.md, fontWeight: '800', marginTop: 14 }}>
                No se encontraron usuarios
              </Text>
              <Text style={{ color: Colors.text.secondary, textAlign: 'center', marginTop: 6 }}>
                Prueba con otra búsqueda o invita a un nuevo miembro.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <InviteUserModal
        visible={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSubmit={inviteUser}
        roleOptions={roleOptions}
        teamOptions={teamOptions}
        isSubmitting={isSubmitting}
        error={error}
      />

      <GenerateUnionCodeModal
        visible={unionCodeOpen}
        onClose={() => setUnionCodeOpen(false)}
        onGenerate={generateUnionCode}
        onDeleteCode={deleteCode}
        roleOptions={roleOptions}
        teamOptions={teamOptions}
        isSubmitting={isSubmitting}
        error={error}
      />

      <ManageUserModal
        user={managingUser}
        visible={!!managingUser}
        onClose={() => setManagingUser(null)}
        onUpdate={updateUser}
        onRemove={removeUser}
        roleOptions={roleOptions}
        isSubmitting={isSubmitting}
        error={error}
      />
    </SafeAreaView>
  );
}
