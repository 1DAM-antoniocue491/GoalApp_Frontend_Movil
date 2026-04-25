/**
 * ManageUserModal
 *
 * Modal para gestionar un usuario existente dentro de la liga.
 * Permite: actualizar rol, datos de equipo, datos de jugador y eliminar.
 *
 * Reutiliza:
 * - OptionSelectField → selects de rol y equipo
 * - Button → footer Cancelar / Actualizar
 * - Colors, theme, styles (shared)
 */

import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { styles } from '@/src/shared/styles';
import { Button } from '@/src/shared/components/ui/Button';
import { OptionSelectField, SelectOption } from '@/src/shared/components/ui/OptionSelectField';
import type { LeagueUser, ManageUserFormData, UserRole } from '../../types/users.types';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ManageUserModalProps {
  user: LeagueUser | null;
  visible: boolean;
  onClose: () => void;
  onUpdate: (userId: string, data: ManageUserFormData) => void;
  onRemove: (userId: string) => void;
  teamOptions?: SelectOption[];
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const ROLE_OPTIONS: SelectOption[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'coach', label: 'Entrenador' },
  { value: 'player', label: 'Jugador' },
  { value: 'delegate', label: 'Delegado' },
  { value: 'observer', label: 'Observador' },
];

const DEFAULT_TEAM_OPTIONS: SelectOption[] = [
  { value: 'team_1', label: 'Real Madrid CF' },
  { value: 'team_2', label: 'FC Barcelona' },
  { value: 'team_3', label: 'Atlético de Madrid' },
];

// ─── Componente ───────────────────────────────────────────────────────────────

export function ManageUserModal({
  user,
  visible,
  onClose,
  onUpdate,
  onRemove,
  teamOptions = DEFAULT_TEAM_OPTIONS,
}: ManageUserModalProps) {
  const [form, setForm] = useState<ManageUserFormData>({
    role: '',
    teamId: '',
    jersey: '',
    position: '',
    isCaptain: false,
  });

  // Sincronizar el form cuando cambia el usuario seleccionado
  useEffect(() => {
    if (user) {
      setForm({
        role: user.role,
        teamId: user.teamId ?? '',
        jersey: user.jersey?.toString() ?? '',
        position: user.position ?? '',
        isCaptain: user.isCaptain ?? false,
      });
    }
  }, [user]);

  if (!user) return null;

  const isPlayer = form.role === 'player';
  const needsTeam = form.role === 'player' || form.role === 'coach' || form.role === 'delegate';

  function handleChange(field: keyof ManageUserFormData, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  // Iniciales del nombre para el avatar fallback
  const initials = user.name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable
        style={{
          // style: rgba no tiene clase Tailwind directa
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.70)',
          justifyContent: 'flex-end',
        }}
        onPress={onClose}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable>
            <View
              style={{
                // style: borderRadius solo en esquinas superiores
                backgroundColor: Colors.bg.surface1,
                borderTopLeftRadius: theme.borderRadius.xl,
                borderTopRightRadius: theme.borderRadius.xl,
                paddingHorizontal: theme.spacing.xl,
                paddingTop: theme.spacing.lg,
                paddingBottom: theme.spacing.xxl,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 20,
              }}
            >
              {/* ── Header ── */}
              <View className="flex-row items-center justify-between mb-5">
                <Text style={{ color: Colors.text.primary, fontSize: theme.fontSize.xl, fontWeight: '700' }}>
                  Gestionar usuario
                </Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Ionicons name="close" size={22} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {/* ── Identidad del usuario ── */}
              <View
                className="flex-row items-center mb-5 p-4 rounded-2xl"
                style={{ backgroundColor: Colors.bg.surface2 }}
              >
                {/* Avatar con iniciales */}
                <View
                  style={{
                    // style: tamaño exacto y color de fondo dinámico
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: Colors.bg.base,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: theme.spacing.md,
                  }}
                >
                  <Text style={{ color: Colors.brand.primary, fontSize: theme.fontSize.md, fontWeight: '700' }}>
                    {initials}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: Colors.text.primary, fontSize: theme.fontSize.md, fontWeight: '600' }}>
                    {user.name}
                  </Text>
                  <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.xs, marginTop: 2 }}>
                    {user.email}
                  </Text>
                </View>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* Rol */}
                <View className="mb-4">
                  <OptionSelectField
                    label="Rol en la liga"
                    value={form.role}
                    options={ROLE_OPTIONS}
                    placeholder="Selecciona un rol"
                    onChange={v => handleChange('role', v as UserRole)}
                  />
                </View>

                {/* Equipo (si aplica) */}
                {needsTeam && (
                  <View className="mb-4">
                    <OptionSelectField
                      label="Equipo"
                      value={form.teamId}
                      options={teamOptions}
                      placeholder="Selecciona un equipo"
                      onChange={v => handleChange('teamId', v)}
                    />
                  </View>
                )}

                {/* Campos de jugador */}
                {isPlayer && (
                  <>
                    <View className="flex-row gap-3 mb-4">
                      <View style={{ flex: 1 }}>
                        <Text className={styles.label} style={{ marginBottom: 6 }}>Dorsal</Text>
                        <View className={styles.inputRow}>
                          <TextInput
                            className={styles.input}
                            placeholder="Ej: 10"
                            placeholderTextColor={styles.inputPlaceholder}
                            value={form.jersey}
                            onChangeText={v => handleChange('jersey', v)}
                            keyboardType="numeric"
                            maxLength={2}
                          />
                        </View>
                      </View>
                      <View style={{ flex: 2 }}>
                        <Text className={styles.label} style={{ marginBottom: 6 }}>Posición</Text>
                        <View className={styles.inputRow}>
                          <TextInput
                            className={styles.input}
                            placeholder="Ej: Delantero"
                            placeholderTextColor={styles.inputPlaceholder}
                            value={form.position}
                            onChangeText={v => handleChange('position', v)}
                          />
                        </View>
                      </View>
                    </View>

                    {/* Capitán — toggle */}
                    <View
                      className="flex-row items-center justify-between mb-4 px-4 rounded-2xl"
                      style={{ backgroundColor: Colors.bg.surface2, height: 52 }}
                    >
                      <Text style={{ color: Colors.text.primary, fontSize: theme.fontSize.sm, fontWeight: '500' }}>
                        Capitán del equipo
                      </Text>
                      <Switch
                        value={form.isCaptain}
                        onValueChange={v => handleChange('isCaptain', v)}
                        trackColor={{ false: Colors.bg.base, true: Colors.brand.primary }}
                        // style: color dinámico para el thumb según estado
                        thumbColor={form.isCaptain ? '#000000' : Colors.text.secondary}
                      />
                    </View>
                  </>
                )}

                {/* Eliminar de la liga — acción destructiva */}
                <TouchableOpacity
                  className="flex-row items-center justify-center rounded-2xl mb-4"
                  style={{ backgroundColor: 'rgba(255,69,52,0.10)', height: 48 }}
                  onPress={() => onRemove(user.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={17} color={Colors.semantic.error} style={{ marginRight: 8 }} />
                  <Text style={{ color: Colors.semantic.error, fontSize: theme.fontSize.sm, fontWeight: '600' }}>
                    Eliminar de la liga
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              {/* Footer */}
              <View className="flex-row gap-3">
                <View style={{ flex: 1 }}>
                  <Button label="Cancelar" variant="secondary" onPress={onClose} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button label="Actualizar" variant="primary" onPress={() => onUpdate(user.id, form)} />
                </View>
              </View>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
