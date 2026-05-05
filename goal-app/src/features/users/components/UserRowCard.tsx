/**
 * UserRowCard
 *
 * Fila premium para un usuario de la liga.
 * No contiene lógica de API: solo muestra datos normalizados de LeagueUser.
 */

import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import type { LeagueUser, UserRole } from '../types/users.types';

const ROLE_CONFIG: Record<UserRole, { label: string; icon: keyof typeof Ionicons.glyphMap; bgColor: string; textColor: string }> = {
  admin: {
    label: 'Administrador',
    icon: 'shield-checkmark-outline',
    bgColor: 'rgba(196,241,53,0.14)',
    textColor: Colors.brand.primary,
  },
  coach: {
    label: 'Entrenador',
    icon: 'clipboard-outline',
    bgColor: 'rgba(24,162,251,0.12)',
    textColor: Colors.brand.accent,
  },
  player: {
    label: 'Jugador',
    icon: 'football-outline',
    bgColor: 'rgba(0,180,216,0.12)',
    textColor: Colors.brand.secondary,
  },
  delegate: {
    label: 'Delegado',
    icon: 'id-card-outline',
    bgColor: 'rgba(255,214,10,0.12)',
    textColor: Colors.semantic.warning,
  },
  observer: {
    label: 'Observador',
    icon: 'eye-outline',
    bgColor: 'rgba(161,161,170,0.12)',
    textColor: Colors.text.secondary,
  },
};

const STATUS_COLOR = {
  active: Colors.semantic.success,
  pending: Colors.semantic.warning,
} as const;

const STATUS_LABEL = {
  active: 'Activo',
  pending: 'Pendiente',
} as const;

interface UserRowCardProps {
  user: LeagueUser;
  onManage: (user: LeagueUser) => void;
}

function RoleBadge({ user }: { user: LeagueUser }) {
  const roleConfig = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.observer;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: roleConfig.bgColor,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 5,
        borderRadius: theme.borderRadius.full,
      }}
    >
      <Ionicons name={roleConfig.icon} size={13} color={roleConfig.textColor} style={{ marginRight: 5 }} />
      <Text style={{ color: roleConfig.textColor, fontSize: theme.fontSize.xs, fontWeight: '700' }}>
        {user.roleLabel || roleConfig.label}
      </Text>
    </View>
  );
}

function StatusDotLabel({ user }: { user: LeagueUser }) {
  const statusColor = STATUS_COLOR[user.status] ?? Colors.text.disabled;
  const statusLabel = STATUS_LABEL[user.status] ?? user.status;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View
        style={{
          width: 7,
          height: 7,
          borderRadius: 4,
          backgroundColor: statusColor,
          marginRight: 6,
        }}
      />
      <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.xs, fontWeight: '600' }}>
        {statusLabel}
      </Text>
    </View>
  );
}

function UserRowCardComponent({ user, onManage }: UserRowCardProps) {
  const roleConfig = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.observer;

  const initials = (user.name || user.email || 'U')
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View
      className="rounded-2xl p-4 mb-3"
      style={{
        backgroundColor: Colors.bg.surface1,
        borderWidth: 1,
        borderColor: Colors.bg.surface2,
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
        elevation: 4,
      }}
    >
      <View className="flex-row items-center">
        {/* Avatar con iniciales */}
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: roleConfig.bgColor,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: theme.spacing.md,
            borderWidth: 1,
            borderColor: roleConfig.textColor,
          }}
        >
          <Text style={{ color: roleConfig.textColor, fontSize: theme.fontSize.sm, fontWeight: '800' }}>
            {initials || 'U'}
          </Text>
        </View>

        {/* Info principal */}
        <View style={{ flex: 1 }}>
          <Text
            style={{ color: Colors.text.primary, fontSize: theme.fontSize.md, fontWeight: '700', marginBottom: 3 }}
            numberOfLines={1}
          >
            {user.name || 'Usuario sin nombre'}
            {user.isCaptain ? <Text style={{ color: Colors.semantic.warning }}> ©</Text> : null}
          </Text>
          <Text
            style={{ color: Colors.text.secondary, fontSize: theme.fontSize.xs }}
            numberOfLines={1}
          >
            {user.email || 'Sin email'}
          </Text>
        </View>

        {/* Botón Gestionar */}
        <TouchableOpacity
          onPress={() => onManage(user)}
          activeOpacity={0.8}
          style={{
            marginLeft: theme.spacing.sm,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: Colors.bg.surface2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="settings-outline" size={19} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Rol + estado */}
      <View className="flex-row items-center justify-between pt-4 mt-4" style={{ borderTopWidth: 1, borderTopColor: Colors.bg.surface2 }}>
        <RoleBadge user={user} />
        <StatusDotLabel user={user} />
      </View>

      {/* Info del equipo si el backend la devuelve en el futuro */}
      {user.teamName ? (
        <View className="flex-row items-center mt-3">
          <Ionicons name="people-outline" size={14} color={Colors.text.disabled} style={{ marginRight: 6 }} />
          <Text style={{ color: Colors.text.disabled, fontSize: theme.fontSize.xs }} numberOfLines={1}>
            {user.teamName}
            {user.jersey ? ` · #${user.jersey}` : ''}
            {user.position ? ` · ${user.position}` : ''}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export const UserRowCard = memo(UserRowCardComponent);
