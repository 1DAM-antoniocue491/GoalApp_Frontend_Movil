import React, { memo } from 'react';
import { Text, View } from 'react-native';
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
  const admins = users.filter(user => user.role === 'admin').length;

  const stats = [
    { label: 'Total', value: total, color: Colors.text.primary },
    { label: 'Activos', value: active, color: Colors.semantic.success },
    { label: 'Pendientes', value: pending, color: Colors.semantic.warning },
    { label: 'Admins', value: admins, color: Colors.brand.primary },
  ];

  return (
    <View className="flex-row flex-wrap mb-5" style={{ gap: 10 }}>
      {stats.map(stat => (
        <View
          key={stat.label}
          className="rounded-2xl items-center justify-center"
          style={{
            width: '47.8%',
            backgroundColor: Colors.bg.surface1,
            borderWidth: 1,
            borderColor: Colors.bg.surface2,
            paddingVertical: theme.spacing.lg,
          }}
        >
          <Text style={{ color: stat.color, fontSize: theme.fontSize.xxl, fontWeight: '900', lineHeight: 30 }}>
            {stat.value}
          </Text>
          <Text style={{ color: Colors.text.disabled, fontSize: theme.fontSize.xs, marginTop: 4 }}>
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export const UsersSummary = memo(UsersSummaryComponent);
