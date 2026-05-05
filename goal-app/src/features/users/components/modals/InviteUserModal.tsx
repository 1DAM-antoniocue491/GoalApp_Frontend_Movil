/**
 * InviteUserModal
 *
 * Modal slide-up para invitar a un nuevo usuario a la liga.
 * El formulario es dinámico: los campos extra cambian según el rol elegido.
 *
 * Integración real:
 * - Este componente NO llama directamente a la API.
 * - Envía el formulario a UsersRolesScreen → useLeagueUsers → userService → users.api.
 * - No contiene equipos mock; las opciones vienen desde GET /equipos/?liga_id={ligaId}.
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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { styles } from '@/src/shared/styles';
import { Button } from '@/src/shared/components/ui/Button';
import { OptionSelectField, SelectOption } from '@/src/shared/components/ui/OptionSelectField';
import { PlayerExtraFields } from './PlayerExtraFields';
import type { InviteUserFormData, UserRole } from '../../types/users.types';

interface InviteUserModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: InviteUserFormData) => Promise<boolean> | boolean;
  teamOptions?: SelectOption[];
  roleOptions?: SelectOption[];
  isSubmitting?: boolean;
  error?: string | null;
}

const DEFAULT_ROLE_OPTIONS: SelectOption[] = [
  { value: 'coach', label: 'Entrenador' },
  { value: 'player', label: 'Jugador' },
  { value: 'delegate', label: 'Delegado' },
  { value: 'observer', label: 'Observador' },
];

const EMPTY_FORM: InviteUserFormData = {
  name: '',
  email: '',
  role: '',
  teamId: '',
  playerType: '',
  jersey: '',
  position: '',
};

export function InviteUserModal({
  visible,
  onClose,
  onSubmit,
  teamOptions = [],
  roleOptions = DEFAULT_ROLE_OPTIONS,
  isSubmitting = false,
  error,
}: InviteUserModalProps) {
  const [form, setForm] = useState<InviteUserFormData>(EMPTY_FORM);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setForm(EMPTY_FORM);
      setLocalError(null);
    }
  }, [visible]);

  function handleClose() {
    if (isSubmitting) return;
    setForm(EMPTY_FORM);
    setLocalError(null);
    onClose();
  }

  function handleChange(field: keyof InviteUserFormData, value: string) {
    setLocalError(null);
    setForm(prev => ({ ...prev, [field]: value }));
  }

  // Al cambiar de rol se limpian campos dependientes para evitar payloads inconsistentes.
  function handleRoleChange(value: string) {
    setLocalError(null);
    setForm(prev => ({
      ...prev,
      role: value as UserRole,
      teamId: '',
      playerType: '',
      jersey: '',
      position: '',
    }));
  }

  async function handleSubmit() {
    if (isSubmitting) return;

    if (!form.name.trim()) {
      setLocalError('Introduce el nombre completo.');
      return;
    }

    if (!form.email.trim()) {
      setLocalError('Introduce el correo electrónico.');
      return;
    }

    if (!form.role) {
      setLocalError('Selecciona un rol.');
      return;
    }

    const success = await onSubmit(form);
    if (success) handleClose();
  }

  const visibleError = localError ?? error;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.72)',
          justifyContent: 'flex-end',
        }}
        onPress={handleClose}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable>
            <View
              style={{
                backgroundColor: Colors.bg.surface1,
                borderTopLeftRadius: theme.borderRadius.xl,
                borderTopRightRadius: theme.borderRadius.xl,
                paddingHorizontal: theme.spacing.xl,
                paddingTop: theme.spacing.lg,
                paddingBottom: theme.spacing.xxl,
                borderWidth: 1,
                borderColor: Colors.bg.surface2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 20,
                maxHeight: '88%',
              }}
            >
              {/* Header */}
              <View className="flex-row items-center justify-between mb-2">
                <View style={{ flex: 1 }}>
                  <Text style={{ color: Colors.text.primary, fontSize: theme.fontSize.xl, fontWeight: '800' }}>
                    Invitar usuario
                  </Text>
                  <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm, marginTop: 4, lineHeight: 20 }}>
                    Se enviará una invitación real por correo para unirse a la liga.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleClose}
                  disabled={isSubmitting}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: Colors.bg.surface2,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: theme.spacing.md,
                  }}
                >
                  <Ionicons name="close" size={22} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {visibleError ? (
                <View
                  style={{
                    backgroundColor: 'rgba(255,69,52,0.10)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,69,52,0.35)',
                    borderRadius: theme.borderRadius.lg,
                    padding: theme.spacing.md,
                    marginTop: theme.spacing.md,
                    marginBottom: theme.spacing.lg,
                  }}
                >
                  <Text style={{ color: Colors.semantic.error, fontSize: theme.fontSize.sm, lineHeight: 20 }}>
                    {visibleError}
                  </Text>
                </View>
              ) : null}

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Nombre */}
                <View className="mb-4">
                  <Text className={styles.label} style={{ marginBottom: 6 }}>Nombre completo</Text>
                  <View className={styles.inputRow}>
                    <View className={styles.inputIcon}>
                      <Ionicons name="person-outline" size={17} color={Colors.text.secondary} />
                    </View>
                    <TextInput
                      className={styles.input}
                      placeholder="Nombre y apellidos"
                      placeholderTextColor={styles.inputPlaceholder}
                      value={form.name}
                      onChangeText={v => handleChange('name', v)}
                      autoCapitalize="words"
                      returnKeyType="next"
                      editable={!isSubmitting}
                    />
                  </View>
                </View>

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
                      editable={!isSubmitting}
                    />
                  </View>
                </View>

                {/* Rol */}
                <View className="mb-4">
                  <OptionSelectField
                    label="Rol en la liga"
                    value={form.role}
                    options={roleOptions.length > 0 ? roleOptions : DEFAULT_ROLE_OPTIONS}
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
                  onChange={(field, value) => handleChange(field as keyof InviteUserFormData, value)}
                />

                <View style={{ height: theme.spacing.sm }} />
              </ScrollView>

              {/* Footer */}
              <View className="flex-row gap-3" style={{ paddingTop: theme.spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Button label="Cancelar" variant="secondary" onPress={handleClose} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button label={isSubmitting ? 'Invitando...' : 'Invitar'} variant="primary" onPress={handleSubmit} />
                </View>
              </View>

              {isSubmitting ? (
                <View style={{ position: 'absolute', right: theme.spacing.xl, bottom: theme.spacing.sm }}>
                  <ActivityIndicator size="small" color={Colors.brand.primary} />
                </View>
              ) : null}
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
