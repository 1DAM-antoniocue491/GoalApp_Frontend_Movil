/** Tarjeta móvil para usuario de liga. */

import React, { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RoleBadge } from '@/src/shared/components/ui/RoleBadge';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import type { LeagueUser, UserRole } from '../types/users.types';

const ROLE_CONFIG: Record<UserRole, {
  label: string;
  bgColor: string;
  textColor: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = {
  admin: {
    label: 'Administrador',
    bgColor: 'rgba(196,241,53,0.15)',
    textColor: Colors.brand.primary,
    icon: 'shield-outline',
  },
  coach: {
    label: 'Entrenador',
    bgColor: 'rgba(0,180,216,0.15)',
    textColor: Colors.brand.secondary,
    icon: 'ribbon-outline',
  },
  delegate: {
    label: 'Delegado',
    bgColor: 'rgba(255,214,10,0.15)',
    textColor: Colors.semantic.warning,
    icon: 'clipboard-outline',
  },
  player: {
    label: 'Jugador',
    bgColor: 'rgba(24,162,251,0.15)',
    textColor: Colors.brand.accent,
    icon: 'football-outline',
  },
  observer: {
    label: 'Observador',
    bgColor: 'rgba(161,161,170,0.12)',
    textColor: Colors.text.secondary,
    icon: 'eye-outline',
  },
};

interface UserRowCardProps {
  user: LeagueUser;
  onManage: (user: LeagueUser) => void;
}

function UserRowCardComponent({ user, onManage }: UserRowCardProps) {
  const roleConfig = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.observer;
  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  const statusColor = user.active ? Colors.semantic.success : Colors.semantic.warning;
  const statusLabel = user.active ? 'Activo' : 'Pendiente';

  return (
    <View
      className="rounded-3xl p-4 mb-3"
      style={{
        backgroundColor: Colors.bg.surface1,
        borderWidth: 1,
        borderColor: Colors.bg.surface2,
      }}
    >
      <View className="flex-row items-center">
        <View
          className="items-center justify-center rounded-full mr-4"
          style={{ width: 50, height: 50, backgroundColor: roleConfig.bgColor }}
        >
          <Text style={{ color: roleConfig.textColor, fontSize: theme.fontSize.md, fontWeight: '900' }}>
            {initials}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.text.primary, fontSize: theme.fontSize.md, fontWeight: '800' }} numberOfLines={1}>
            {user.name}
          </Text>
          <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm, marginTop: 3 }} numberOfLines={1}>
            {user.email || 'Sin email'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => onManage(user)}
          activeOpacity={0.85}
          className="items-center justify-center rounded-2xl ml-3"
          style={{ width: 44, height: 44, backgroundColor: Colors.bg.surface2 }}
        >
          <Ionicons name="settings-outline" size={20} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center flex-wrap mt-4" style={{ gap: 10 }}>
        <RoleBadge
          label={roleConfig.label}
          bgColor={roleConfig.bgColor}
          textColor={roleConfig.textColor}
          icon={roleConfig.icon}
        />

        <View className="flex-row items-center self-start px-3 py-2 rounded-xl" style={{ backgroundColor: Colors.bg.surface2 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: statusColor, marginRight: 7 }} />
          <Text style={{ color: Colors.text.secondary, fontSize: 13, fontWeight: '700' }}>{statusLabel}</Text>
        </View>
      </View>

      {user.teamName ? (
        <View className="flex-row items-center mt-4 pt-4" style={{ borderTopWidth: 1, borderTopColor: Colors.bg.surface2 }}>
          <Ionicons name="people-outline" size={16} color={Colors.text.disabled} />
          <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm, marginLeft: 8, flex: 1 }} numberOfLines={1}>
            {user.teamName}{user.jersey ? ` · #${user.jersey}` : ''}{user.position ? ` · ${user.position}` : ''}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export const UserRowCard = memo(UserRowCardComponent);
