/**
 * UsersSummary
 *
 * Bloque de resumen con métricas reales de usuarios de la liga:
 * total, activos, pendientes y administradores activos.
 */

import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import type { LeagueUser } from '../types/users.types';

interface UsersSummaryProps {
  users: LeagueUser[];
}

function UsersSummaryComponent({ users }: UsersSummaryProps) {
  const total = users.length;
  const activos = users.filter(u => u.active).length;
  const pendientes = users.filter(u => !u.active).length;
  const admins = users.filter(u => u.role === 'admin' && u.active).length;

  const stats = [
    { label: 'Total', value: total, color: Colors.text.primary, icon: 'people-outline' as const },
    { label: 'Activos', value: activos, color: Colors.semantic.success, icon: 'checkmark-circle-outline' as const },
    { label: 'Pendientes', value: pendientes, color: Colors.semantic.warning, icon: 'time-outline' as const },
    { label: 'Admins', value: admins, color: Colors.brand.primary, icon: 'shield-checkmark-outline' as const },
  ];

  return (
    <View className="flex-row flex-wrap" style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.xl }}>
      {stats.map(stat => (
        <View
          key={stat.label}
          style={{
            width: '48.5%',
            backgroundColor: Colors.bg.surface1,
            borderRadius: theme.borderRadius.xl,
            borderWidth: 1,
            borderColor: Colors.bg.surface2,
            padding: theme.spacing.md,
            minHeight: 96,
          }}
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: Colors.bg.surface2,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: theme.spacing.sm,
            }}
          >
            <Ionicons name={stat.icon} size={17} color={stat.color} />
          </View>
          <Text style={{ color: stat.color, fontSize: theme.fontSize.xxl, fontWeight: '800', lineHeight: 30 }}>
            {stat.value}
          </Text>
          <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.xs, marginTop: 2 }}>
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export const UsersSummary = memo(UsersSummaryComponent);
