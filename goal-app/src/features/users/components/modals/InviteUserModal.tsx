/**
 * InviteUserModal
 *
 * Modal slide-up para invitar a un nuevo usuario a la liga.
 * El formulario es dinámico: los campos extra cambian según el rol elegido.
 *
 * Reutiliza:
 * - OptionSelectField → selector de rol
 * - PlayerExtraFields → campos dinámicos por rol
 * - Button → footer Cancelar / Invitar
 * - Colors, theme, styles (shared)
 */

import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { styles } from '@/src/shared/styles';
import { Button } from '@/src/shared/components/ui/Button';
import { OptionSelectField, SelectOption } from '@/src/shared/components/ui/OptionSelectField';
import { PlayerExtraFields } from './PlayerExtraFields';
import type { InviteUserFormData, UserRole } from '../../types/users.types';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface InviteUserModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: InviteUserFormData) => void;
  teamOptions?: SelectOption[];
}

// ─── Constantes ───────────────────────────────────────────────────────────────

// Admin excluido: se asigna al crear la liga, no por invitación
const ROLE_OPTIONS: SelectOption[] = [
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

const EMPTY_FORM: InviteUserFormData = {
  email: '',
  role: '',
  teamId: '',
  playerType: '',
  jersey: '',
  position: '',
};

// ─── Componente ───────────────────────────────────────────────────────────────

export function InviteUserModal({
  visible,
  onClose,
  onSubmit,
  teamOptions = DEFAULT_TEAM_OPTIONS,
}: InviteUserModalProps) {
  const [form, setForm] = useState<InviteUserFormData>(EMPTY_FORM);

  function handleClose() {
    setForm(EMPTY_FORM);
    onClose();
  }

  function handleChange(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  // Al cambiar de rol se limpian los campos dependientes para evitar datos inconsistentes
  function handleRoleChange(value: string) {
    setForm(prev => ({
      ...prev,
      role: value as UserRole,
      teamId: '',
      playerType: '',
      jersey: '',
      position: '',
    }));
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable
        style={{
          // style: rgba no tiene clase Tailwind directa
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.70)',
          justifyContent: 'flex-end',
        }}
        onPress={handleClose}
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
              <View className="flex-row items-center justify-between mb-2">
                <Text style={{ color: Colors.text.primary, fontSize: theme.fontSize.xl, fontWeight: '700' }}>
                  Invitar usuario
                </Text>
                <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Ionicons name="close" size={22} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm, marginBottom: theme.spacing.xl, lineHeight: 20 }}>
                El usuario recibirá un correo de invitación a la liga.
              </Text>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* Email */}
                <View className="mb-4">
                  <Text className={styles.label} style={{ marginBottom: 6 }}>Correo electrónico</Text>
                  <View className={styles.inputRow}>
                    <View className={styles.inputIcon}>
                      <Ionicons name="mail-outline" size={17} color={Colors.text.secondary} />
                    </View>
                    <TextInput
                      className={styles.input}
                      placeholder="usuario@email.com"
                      placeholderTextColor={styles.inputPlaceholder}
                      value={form.email}
                      onChangeText={v => handleChange('email', v)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      returnKeyType="next"
                    />
                  </View>
                </View>

                {/* Rol */}
                <View className="mb-4">
                  <OptionSelectField
                    label="Rol en la liga"
                    value={form.role}
                    options={ROLE_OPTIONS}
                    placeholder="Selecciona un rol"
                    onChange={handleRoleChange}
                  />
                </View>

                {/* Campos dinámicos según rol */}
                <PlayerExtraFields
                  role={form.role as UserRole}
                  teamId={form.teamId}
                  playerType={form.playerType}
                  jersey={form.jersey}
                  position={form.position}
                  teamOptions={teamOptions}
                  onChange={handleChange}
                />

                {/* Espacio inferior antes del footer */}
                <View style={{ height: theme.spacing.sm }} />
              </ScrollView>

              {/* Footer */}
              <View className="flex-row gap-3">
                <View style={{ flex: 1 }}>
                  <Button label="Cancelar" variant="secondary" onPress={handleClose} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button label="Invitar" variant="primary" onPress={() => onSubmit(form)} />
                </View>
              </View>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
