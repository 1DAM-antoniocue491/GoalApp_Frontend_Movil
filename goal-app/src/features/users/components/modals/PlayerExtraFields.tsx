/** Campos específicos para rol Jugador. */

import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import type { SelectOption } from '../../types/users.types';
import { PLAYER_POSITIONS, PLAYER_TYPES } from '../../types/users.types';

interface PlayerExtraFieldsProps {
  jersey: string;
  position: string;
  playerType: string;
  onJerseyChange: (value: string) => void;
  onPositionChange: (value: string) => void;
  onPlayerTypeChange: (value: string) => void;
}

function OptionChips({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}) {
  return (
    <View className="mb-4">
      <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm, marginBottom: 8 }}>{label}</Text>
      <View className="flex-row flex-wrap" style={{ gap: 8 }}>
        {options.map(option => {
          const selected = value === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              activeOpacity={0.85}
              onPress={() => onChange(option.value)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: theme.borderRadius.lg,
                backgroundColor: selected ? Colors.brand.primary : Colors.bg.surface2,
                borderWidth: 1,
                borderColor: selected ? Colors.brand.primary : Colors.bg.surface2,
              }}
            >
              <Text
                style={{
                  color: selected ? '#000000' : Colors.text.primary,
                  fontSize: theme.fontSize.sm,
                  fontWeight: '700',
                }}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function PlayerExtraFields({
  jersey,
  position,
  playerType,
  onJerseyChange,
  onPositionChange,
  onPlayerTypeChange,
}: PlayerExtraFieldsProps) {
  return (
    <View className="mt-2">
      <View className="mb-4">
        <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm, marginBottom: 8 }}>Dorsal</Text>
        <View
          className="flex-row items-center rounded-2xl px-4"
          style={{ backgroundColor: Colors.bg.surface2, height: 54 }}
        >
          <Ionicons name="shirt-outline" size={18} color={Colors.text.secondary} />
          <TextInput
            value={jersey}
            onChangeText={value => onJerseyChange(value.replace(/[^0-9]/g, '').slice(0, 3))}
            keyboardType="number-pad"
            placeholder="Ej: 10"
            placeholderTextColor={Colors.text.disabled}
            className="flex-1 ml-3"
            style={{ color: Colors.text.primary, fontSize: theme.fontSize.md }}
          />
        </View>
      </View>

      <OptionChips
        label="Posición"
        value={position}
        options={PLAYER_POSITIONS}
        onChange={onPositionChange}
      />

      <OptionChips
        label="Tipo de jugador"
        value={playerType}
        options={PLAYER_TYPES}
        onChange={onPlayerTypeChange}
      />
    </View>
  );
}
