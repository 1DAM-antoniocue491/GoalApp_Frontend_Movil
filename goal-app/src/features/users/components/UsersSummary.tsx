/**
 * UsersSummary
 *
 * Métricas reales de usuarios de la liga.
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
  const active = users.filter(user => user.active).length;
  const pending = users.filter(user => !user.active).length;
  const admins = users.filter(user => user.role === 'admin' && user.active).length;

  const stats = [
    { label: 'Total', value: total, color: Colors.text.primary },
    { label: 'Activos', value: active, color: Colors.semantic.success },
    { label: 'Pendientes', value: pending, color: Colors.semantic.warning },
    { label: 'Admins', value: admins, color: Colors.brand.primary },
  ];

  return (
    <View style={summaryStyles.grid}>
      {stats.map(stat => (
        <View key={stat.label} style={summaryStyles.card}>
          <Text style={[summaryStyles.value, { color: stat.color }]}>{stat.value}</Text>
          <Text style={summaryStyles.label}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

const summaryStyles = {
  grid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  card: {
    flexGrow: 1,
    flexBasis: '47%' as const,
    backgroundColor: Colors.bg.surface1,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.bg.surface2,
    paddingVertical: theme.spacing.md,
    alignItems: 'center' as const,
  },
  value: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '800' as const,
    lineHeight: 30,
  },
  label: {
    color: Colors.text.disabled,
    fontSize: theme.fontSize.xs,
    marginTop: 2,
    fontWeight: '600' as const,
  },
};

export const UsersSummary = memo(UsersSummaryComponent);
