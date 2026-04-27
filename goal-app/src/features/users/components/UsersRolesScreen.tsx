/**
 * UsersRolesScreen
 *
 * Pantalla principal de usuarios y roles dentro de una liga.
 * Permite: ver el resumen de miembros, buscar, invitar usuarios nuevos
 * y gestionar los existentes.
 *
 * Reutiliza:
 * - SearchInput (shared) → buscador de usuarios
 * - SectionTitle (shared) → título de sección
 * - UsersSummary → bloque de métricas
 * - UserRowCard → fila de cada usuario
 * - InviteUserModal → modal para invitar
 * - ManageUserModal → modal para gestionar
 * - Colors, theme (shared)
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
// SafeAreaView de react-native-safe-area-context respeta correctamente
// las zonas seguras en iOS y Android, incluyendo notch, Dynamic Island y barras de sistema
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SearchInput } from '@/src/shared/components/ui/SearchInput';
import { SectionTitle } from '@/src/shared/components/ui/SectionTitle';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { UsersSummary } from './UsersSummary';
import { UserRowCard } from './UserRowCard';
import { InviteUserModal } from './modals/InviteUserModal';
import { ManageUserModal } from './modals/ManageUserModal';
import type { LeagueUser, InviteUserFormData, ManageUserFormData } from '../types/users.types';
import { ScrollEdgeButton } from '@/src/shared/components/navigation/ScrollEdgeButton';


// ─── Mock data ─────────────────────────────────────────────────────────────────
// TODO: reemplazar con hook useLeagueUsers cuando el servicio esté disponible

const MOCK_USERS: LeagueUser[] = [
  {
    id: 'u1',
    name: 'Carlos Martínez',
    email: 'carlos@goalapp.com',
    role: 'admin',
    status: 'active',
  },
  {
    id: 'u2',
    name: 'Ana García',
    email: 'ana@goalapp.com',
    role: 'coach',
    status: 'active',
    teamId: 'team_1',
    teamName: 'Real Madrid CF',
  },
  {
    id: 'u3',
    name: 'Luis Rodríguez',
    email: 'luis@goalapp.com',
    role: 'player',
    status: 'active',
    teamId: 'team_1',
    teamName: 'Real Madrid CF',
    jersey: 10,
    position: 'Mediapunta',
    isCaptain: true,
  },
  {
    id: 'u4',
    name: 'Marta López',
    email: 'marta@goalapp.com',
    role: 'delegate',
    status: 'pending',
    teamId: 'team_2',
    teamName: 'FC Barcelona',
  },
  {
    id: 'u5',
    name: 'Pedro Sánchez',
    email: 'pedro@goalapp.com',
    role: 'observer',
    status: 'pending',
  },
];

// ─── Componente ───────────────────────────────────────────────────────────────

export function UsersRolesScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<LeagueUser[]>(MOCK_USERS);
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [managingUser, setManagingUser] = useState<LeagueUser | null>(null);

  // Ref del ScrollView para que ScrollEdgeButton pueda llamar a scrollTo
  const scrollRef = useRef<ScrollView>(null);
  // Posición vertical actual del scroll (actualizada en onScroll)
  const [scrollY, setScrollY] = useState(0);
  // Altura total del contenido renderizado (actualizada en onContentSizeChange)
  const [contentHeight, setContentHeight] = useState(0);
  // Altura visible del ScrollView (actualizada en onLayout)
  const [viewportHeight, setViewportHeight] = useState(0);

  // Filtrado por búsqueda en nombre o email
  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  function handleInviteSubmit(data: InviteUserFormData) {
    // TODO: llamar a usersService.invite(data) cuando esté disponible
    console.log('Invitar usuario:', data);
    setInviteOpen(false);
  }

  function handleUpdateUser(userId: string, data: ManageUserFormData) {
    // TODO: llamar a usersService.update(userId, data)
    console.log('Actualizar usuario:', userId, data);
    setManagingUser(null);
  }

  function handleRemoveUser(userId: string) {
    // TODO: llamar a usersService.remove(userId)
    console.log('Eliminar usuario:', userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    setManagingUser(null);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.base }}>

      {/* ── Header ── */}
      <View
        className="flex-row items-center justify-between px-6 py-4"
        style={{ borderBottomWidth: 1, borderBottomColor: Colors.bg.surface2 }}
      >
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
          </TouchableOpacity>
          <SectionTitle title="Usuarios y roles" />
        </View>

        {/* Botón principal: Invitar usuario */}
        <TouchableOpacity
          onPress={() => setInviteOpen(true)}
          activeOpacity={0.8}
          style={{
            // style: fondo brand.primary + padding exacto — no representable solo con className
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: Colors.brand.primary,
            borderRadius: theme.borderRadius.lg,
            paddingHorizontal: theme.spacing.md,
            height: 36,
            gap: 6,
          }}
        >
          <Ionicons name="person-add-outline" size={16} color="#000" />
          <Text style={{ color: '#000', fontSize: theme.fontSize.sm, fontWeight: '700' }}>
            Invitar
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.xl }}
        keyboardShouldPersistTaps="handled"

        // scrollEventThrottle=16 garantiza actualizaciones ~60fps sin saturar el bridge
        scrollEventThrottle={16}
        onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
        // Capturamos la altura total del contenido para saber cuándo hay scroll real
        onContentSizeChange={(_, h) => setContentHeight(h)}
        // Capturamos la altura del área visible para calcular el surplus scrollable
        onLayout={(e) => setViewportHeight(e.nativeEvent.layout.height)}
      >
        {/* Resumen de métricas */}
        <UsersSummary users={users} />

        {/* Buscador */}
        <View className="mb-5">
          <SearchInput
            value={search}
            placeholder="Buscar por nombre o email..."
            onChangeText={setSearch}
            onClear={() => setSearch('')}
          />
        </View>

        {/* Encabezado de lista */}
        <View className="flex-row items-center justify-between mb-3">
          <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm }}>
            {filteredUsers.length} miembro{filteredUsers.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Lista de usuarios */}
        {filteredUsers.length > 0 ? (
          filteredUsers.map(user => (
            <UserRowCard
              key={user.id}
              user={user}
              onManage={setManagingUser}
            />
          ))
        ) : (
          // Estado vacío
          <View className="items-center py-12">
            <Ionicons name="people-outline" size={44} color={Colors.text.disabled} />
            <Text style={{ color: Colors.text.disabled, fontSize: theme.fontSize.sm, marginTop: theme.spacing.md }}>
              No se encontraron usuarios
            </Text>
          </View>
        )}
      </ScrollView>

      {/*
              ScrollEdgeButton flota fuera del ScrollView para que su position:absolute
              se resuelva respecto al View padre (flex:1) y no quede enterrado dentro
              del contenido scrollable.
            */}
      <ScrollEdgeButton
        scrollRef={scrollRef}
        scrollY={scrollY}
        contentHeight={contentHeight}
        viewportHeight={viewportHeight}
      />


      {/* ── Modal Invitar usuario ── */}
      <InviteUserModal
        visible={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSubmit={handleInviteSubmit}
      />

      {/* ── Modal Gestionar usuario ── */}
      <ManageUserModal
        user={managingUser}
        visible={!!managingUser}
        onClose={() => setManagingUser(null)}
        onUpdate={handleUpdateUser}
        onRemove={handleRemoveUser}
      />
    </SafeAreaView>
  );
}
