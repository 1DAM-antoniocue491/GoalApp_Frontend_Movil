/**
 * UsersSummary
 *
 * Bloque de resumen con métricas de usuarios de la liga:
 * total, activos, pendientes y distribución por rol principal.
 *
 * Reutiliza Colors y theme (shared).
 */

import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import type { LeagueUser } from '../types/users.types';

interface UsersSummaryProps {
  users: LeagueUser[];
}

function UsersSummaryComponent({ users }: UsersSummaryProps) {
  const total = users.length;
  const activos = users.filter(u => u.status === 'active').length;
  const pendientes = users.filter(u => u.status === 'pending').length;

  const stats = [
    { label: 'Total', value: total, color: Colors.text.primary },
    { label: 'Activos', value: activos, color: Colors.semantic.success },
    { label: 'Pendientes', value: pendientes, color: Colors.semantic.warning },
  ];

  return (
    <View className="flex-row gap-3 mb-5">
      {stats.map(stat => (
        <View
          key={stat.label}
          style={{
            // style: flex para distribución igual + color del design system
            flex: 1,
            backgroundColor: Colors.bg.surface1,
            borderRadius: theme.borderRadius.lg,
            borderWidth: 1,
            borderColor: Colors.bg.surface2,
            paddingVertical: theme.spacing.md,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: stat.color, fontSize: theme.fontSize.xxl, fontWeight: '700', lineHeight: 30 }}>
            {stat.value}
          </Text>
          <Text style={{ color: Colors.text.disabled, fontSize: theme.fontSize.xs, marginTop: 2 }}>
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export const UsersSummary = memo(UsersSummaryComponent);
