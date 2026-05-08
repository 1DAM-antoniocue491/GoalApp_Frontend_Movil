/** Campos extra de invitación/código: equipo, tipo, dorsal y posición. */

import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { OptionSelectField, SelectOption } from '@/src/shared/components/ui/OptionSelectField';
import { styles } from '@/src/shared/styles';
import type { UserRole } from '../../types/users.types';
import { PLAYER_POSITIONS, PLAYER_TYPES } from '../../types/users.types';

interface PlayerExtraFieldsProps {
  role: UserRole | '';
  teamId: string;
  playerType: string;
  jersey: string;
  position: string;
  teamOptions: SelectOption[];
  onChange: (field: 'teamId' | 'playerType' | 'jersey' | 'position', value: string) => void;
}

export function PlayerExtraFields({
  role,
  teamId,
  playerType,
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
          placeholder="Selecciona un equipo"
          emptyText="No hay equipos creados en esta liga"
          searchable
          onChange={value => onChange('teamId', value)}
        />
      </View>

      {isPlayer ? (
        <>
          <View className="mb-4">
            <OptionSelectField
              label="Tipo de jugador"
              value={playerType}
              options={PLAYER_TYPES}
              placeholder="Selecciona el tipo"
              onChange={value => onChange('playerType', value)}
            />
          </View>

          <View className="flex-row gap-3 mb-4">
            <View style={{ flex: 1 }}>
              <Text className={styles.label} style={{ marginBottom: 6 }}>Dorsal</Text>
              <View className={styles.inputRow}>
                <TextInput
                  className={styles.input}
                  placeholder="10"
                  placeholderTextColor={styles.inputPlaceholder}
                  value={jersey}
                  onChangeText={value => onChange('jersey', value.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
            </View>

            <View style={{ flex: 2 }}>
              <OptionSelectField
                label="Posición"
                value={position}
                options={PLAYER_POSITIONS}
                placeholder="Selecciona posición"
                onChange={value => onChange('position', value)}
              />
            </View>
          </View>
        </>
      ) : null}
    </View>
  );
}

export default PlayerExtraFields;
