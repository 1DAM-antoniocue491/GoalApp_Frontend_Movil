/**
 * PlayerExtraFields
 *
 * Campos adicionales del formulario de invitación/código.
 * Se alimenta con equipos reales desde GET /equipos/?liga_id={ligaId}.
 */

import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { OptionSelectField, SelectOption } from '@/src/shared/components/ui/OptionSelectField';
import { Colors } from '@/src/shared/constants/colors';
import { styles } from '@/src/shared/styles';
import type { UserRole } from '../../types/users.types';
import { PLAYER_POSITIONS } from '../../types/users.types';

interface PlayerExtraFieldsProps {
  role: UserRole | '';
  teamId: string;
  jersey: string;
  position: string;
  teamOptions: SelectOption[];
  onChange: (field: string, value: string) => void;
}

const POSITION_OPTIONS: SelectOption[] = PLAYER_POSITIONS.map(item => ({
  value: item.value,
  label: item.label,
}));

export function PlayerExtraFields({
  role,
  teamId,
  jersey,
  position,
  teamOptions,
  onChange,
}: PlayerExtraFieldsProps) {
  const needsTeam = role === 'player' || role === 'coach' || role === 'delegate';
  const isPlayer = role === 'player';

  if (!needsTeam) return null;

  return (
    <View>
      <View className="mb-4">
        <OptionSelectField
          label="Equipo"
          value={teamId}
          options={teamOptions}
          placeholder={teamOptions.length > 0 ? 'Selecciona un equipo' : 'No hay equipos disponibles'}
          onChange={v => onChange('teamId', v)}
        />
      </View>

      {isPlayer && (
        <View className="flex-row gap-3 mb-4">
          <View style={{ flex: 1 }}>
            <Text className={styles.label} style={{ marginBottom: 6 }}>Dorsal</Text>
            <View className={styles.inputRow}>
              <TextInput
                className={styles.input}
                placeholder="10"
                placeholderTextColor={styles.inputPlaceholder}
                value={jersey}
                onChangeText={v => onChange('jersey', v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
          </View>

          <View style={{ flex: 2 }}>
            <OptionSelectField
              label="Posición"
              value={position}
              options={POSITION_OPTIONS}
              placeholder="Selecciona posición"
              onChange={v => onChange('position', v)}
            />
          </View>
        </View>
      )}

      {needsTeam && teamOptions.length === 0 && (
        <Text style={{ color: Colors.semantic.warning, fontSize: 12, marginTop: -8, marginBottom: 12 }}>
          Crea al menos un equipo antes de invitar usuarios con equipo asociado.
        </Text>
      )}
    </View>
  );
}
