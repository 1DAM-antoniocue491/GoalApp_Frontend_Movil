/** Tarjeta React Native de un usuario de liga. */

import React, { memo } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RoleBadge } from '@/src/shared/components/ui/RoleBadge';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { getRoleBadgeConfig } from '@/src/shared/utils/roles';
import type { LeagueUser } from '../types/users.types';

interface UserRowCardProps {
  user: LeagueUser;
  onManage: (user: LeagueUser) => void;
  onToggleActive?: (user: LeagueUser) => void;
  isToggling?: boolean;
}

function UserRowCardComponent({ user, onManage, onToggleActive, isToggling = false }: UserRowCardProps) {
  const roleConfig = getRoleBadgeConfig(user.role);
  const statusColor = user.active ? Colors.semantic.success : Colors.semantic.warning;
  const statusLabel = user.active ? 'Activo' : 'Inactivo';
  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onManage(user)}
      className="rounded-3xl p-4 mb-3"
      style={cardStyles.card}
    >
      <View className="flex-row items-center">
        <View style={[cardStyles.avatar, { backgroundColor: roleConfig.bgColor }]}>
          <Text style={[cardStyles.avatarText, { color: roleConfig.textColor }]}>{initials}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={cardStyles.name} numberOfLines={1}>
            {user.name}{user.isCaptain ? <Text style={{ color: Colors.semantic.warning }}> ©</Text> : null}
          </Text>
          <Text style={cardStyles.email} numberOfLines={1}>{user.email}</Text>
        </View>

        <TouchableOpacity
          onPress={() => onManage(user)}
          activeOpacity={0.8}
          style={cardStyles.manageButton}
          hitSlop={8}
        >
          <Ionicons name="settings-outline" size={18} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center justify-between pt-3" style={{ gap: 10 }}>
        <RoleBadge
          label={roleConfig.label}
          bgColor={roleConfig.bgColor}
          textColor={roleConfig.textColor}
          icon={roleConfig.icon}
        />

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={!onToggleActive || isToggling}
          onPress={() => onToggleActive?.(user)}
          style={[cardStyles.statusPill, { backgroundColor: user.active ? 'rgba(45,212,104,0.12)' : 'rgba(255,214,10,0.12)' }]}
        >
          {isToggling ? (
            <ActivityIndicator color={statusColor} size="small" />
          ) : (
            <View style={[cardStyles.statusDot, { backgroundColor: statusColor }]} />
          )}
          <Text style={[cardStyles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </TouchableOpacity>
      </View>

      {user.teamName ? (
        <View className="flex-row items-center mt-3 pt-3" style={cardStyles.teamRow}>
          <Ionicons name="people-outline" size={14} color={Colors.text.disabled} style={{ marginRight: 6 }} />
          <Text style={cardStyles.teamText} numberOfLines={1}>
            {user.teamName}
            {user.jersey ? ` · #${user.jersey}` : ''}
            {user.position ? ` · ${user.position}` : ''}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

export const UserRowCard = memo(UserRowCardComponent);

const cardStyles = {
  card: {
    backgroundColor: Colors.bg.surface1,
    borderWidth: 1,
    borderColor: Colors.bg.surface2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: theme.spacing.md,
  },
  avatarText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '900' as const,
  },
  name: {
    color: Colors.text.primary,
    fontSize: theme.fontSize.md,
    fontWeight: '800' as const,
    marginBottom: 2,
  },
  email: {
    color: Colors.text.secondary,
    fontSize: theme.fontSize.xs,
  },
  manageButton: {
    marginLeft: theme.spacing.sm,
    width: 38,
    height: 38,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: Colors.bg.surface2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  statusPill: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 7,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 999,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '800' as const,
  },
  teamRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.bg.surface2,
  },
  teamText: {
    flex: 1,
    color: Colors.text.disabled,
    fontSize: theme.fontSize.xs,
  },
};
