import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';

function EmptyLeaguesStateComponent() {
  return (
    <View
      className="rounded-lg border px-6 py-10 items-center"
      style={{
        backgroundColor: Colors.bg.surface1,
        borderColor: Colors.bg.surface2,
      }}
    >
      <View
        className="h-24 w-24 rounded-full items-center justify-center mb-6"
        style={{
          backgroundColor: Colors.bg.base,
          borderWidth: 1,
          borderColor: Colors.bg.surface2,
        }}
      >
        <Ionicons
          name="trophy-outline"
          size={44}
          color={Colors.brand.primary}
        />
      </View>

      <Text
        style={{
          color: Colors.text.primary,
          fontSize: theme.fontSize.xxl,
          lineHeight: 28,
          fontWeight: '700',
          textAlign: 'center',
        }}
      >
        Aún no tienes ligas
      </Text>

      <Text
        style={{
          color: Colors.text.secondary,
          fontSize: theme.fontSize.sm + 1,
          lineHeight: 22,
          textAlign: 'center',
          marginTop: theme.spacing.md,
          maxWidth: 280,
        }}
      >
        Crea una nueva liga o únete con un código de invitación para empezar.
      </Text>
    </View>
  );
}

export const EmptyLeaguesState = memo(EmptyLeaguesStateComponent);