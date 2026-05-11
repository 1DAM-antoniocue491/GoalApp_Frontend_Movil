import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import type { SelectOption } from '@/src/shared/components/ui/OptionSelectField';
import type { LiveMatchPlayer } from './RegisterEventModal';

export function toPlayerOptions(players?: LiveMatchPlayer[]): SelectOption[] {
  return (players ?? []).map((player) => ({
    value: String(player.id_jugador),
    label: `${player.dorsal ? `${player.dorsal} · ` : ''}${player.nombre}`,
  }));
}

export function TeamPicker({
  homeTeam,
  awayTeam,
  value,
  onChange,
  disabled = false,
}: {
  homeTeam: string;
  awayTeam: string;
  value: 'home' | 'away';
  onChange: (value: 'home' | 'away') => void;
  disabled?: boolean;
}) {
  return (
    <View className="flex-row" style={{ gap: 10 }}>
      {(['home', 'away'] as const).map((side) => {
        const active = value === side;
        return (
          <TouchableOpacity
            key={side}
            disabled={disabled}
            onPress={() => onChange(side)}
            activeOpacity={0.9}
            style={{
              flex: 1,
              minHeight: 56,
              borderRadius: theme.borderRadius.lg,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: active ? `${Colors.brand.primary}20` : Colors.bg.surface2,
              borderWidth: 1,
              borderColor: active ? Colors.brand.primary : 'transparent',
              opacity: disabled ? 0.55 : 1,
              paddingHorizontal: 8,
            }}
          >
            <Text numberOfLines={1} style={{ color: active ? Colors.brand.primary : Colors.text.secondary, fontWeight: '900' }}>
              {side === 'home' ? homeTeam : awayTeam}
            </Text>
            <Text style={{ color: Colors.text.disabled, fontSize: 11, marginTop: 2 }}>
              {side === 'home' ? 'Local' : 'Visitante'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function FieldTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ color: Colors.text.secondary, marginBottom: 8, fontSize: 13, fontWeight: '900' }}>
      {children}
    </Text>
  );
}
