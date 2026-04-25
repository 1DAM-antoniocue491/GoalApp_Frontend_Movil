/**
 * PlayerExtraFields
 *
 * Campos adicionales del formulario de invitación que aparecen
 * dinámicamente según el rol seleccionado.
 *
 * - Jugador → tipo de jugador, dorsal, posición, equipo
 * - Entrenador / Delegado → solo equipo
 * - Observador → nada extra
 *
 * Reutiliza OptionSelectField para los selects de equipo y tipo de jugador.
 */

import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { OptionSelectField, SelectOption } from '@/src/shared/components/ui/OptionSelectField';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { styles } from '@/src/shared/styles';
import type { UserRole } from '../../types/users.types';

interface PlayerExtraFieldsProps {
  role: UserRole | '';
  teamId: string;
  playerType: string;
  jersey: string;
  position: string;
  teamOptions: SelectOption[];
  onChange: (field: string, value: string) => void;
}

const PLAYER_TYPE_OPTIONS: SelectOption[] = [
  { value: 'portero', label: 'Portero' },
  { value: 'defensa', label: 'Defensa' },
  { value: 'centrocampista', label: 'Centrocampista' },
  { value: 'delantero', label: 'Delantero' },
];

const POSITION_OPTIONS: SelectOption[] = [
  { value: 'PO', label: 'Portero' },
  { value: 'LD', label: 'Lateral derecho' },
  { value: 'LI', label: 'Lateral izquierdo' },
  { value: 'CB', label: 'Central' },
  { value: 'MCD', label: 'Mediocentro defensivo' },
  { value: 'MC', label: 'Mediocentro' },
  { value: 'MP', label: 'Mediapunta' },
  { value: 'EXD', label: 'Extremo derecho' },
  { value: 'EXI', label: 'Extremo izquierdo' },
  { value: 'DC', label: 'Delantero centro' },
];

export function PlayerExtraFields({
  role,
  teamId,
  playerType,
  jersey,
  position,
  teamOptions,
  onChange,
}: PlayerExtraFieldsProps) {
  // Roles que requieren seleccionar equipo
  const needsTeam = role === 'player' || role === 'coach' || role === 'delegate';
  const isPlayer = role === 'player';

  if (!needsTeam) return null;

  return (
    <View>
      {/* Equipo — visible para jugador, entrenador y delegado */}
      <View className="mb-4">
        <OptionSelectField
          label="Equipo"
          value={teamId}
          options={teamOptions}
          placeholder="Selecciona un equipo"
          onChange={v => onChange('teamId', v)}
        />
      </View>

      {/* Campos exclusivos del jugador */}
      {isPlayer && (
        <>
          <View className="mb-4">
            <OptionSelectField
              label="Tipo de jugador"
              value={playerType}
              options={PLAYER_TYPE_OPTIONS}
              placeholder="Selecciona el tipo"
              onChange={v => onChange('playerType', v)}
            />
          </View>

          <View className="flex-row gap-3 mb-4">
            {/* Dorsal */}
            <View style={{ flex: 1 }}>
              <Text className={styles.label} style={{ marginBottom: 6 }}>
                Dorsal
              </Text>
              <View className={styles.inputRow}>
                <TextInput
                  className={styles.input}
                  placeholder="Ej: 10"
                  placeholderTextColor={styles.inputPlaceholder}
                  value={jersey}
                  onChangeText={v => onChange('jersey', v)}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
            </View>

            {/* Posición */}
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
        </>
      )}
    </View>
  );
}
