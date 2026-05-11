/** Modal React Native para invitar usuarios por correo. */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { styles } from '@/src/shared/styles';
import { getRoleBadgeConfig } from '@/src/shared/utils/roles';
import type { InviteUserFormData, SelectOption, UserRole } from '../../types/users.types';
import { PlayerExtraFields } from './PlayerExtraFields';

interface InviteUserModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: InviteUserFormData) => Promise<boolean> | boolean | Promise<void> | void;
  roleOptions: SelectOption[];
  teamOptions: SelectOption[];
  isSubmitting?: boolean;
  error?: string | null;
}

const EMPTY_FORM: InviteUserFormData = {
  name: '',
  email: '',
  role: '',
  teamId: '',
  playerType: 'normal',
  jersey: '',
  position: '',
};

export function InviteUserModal({
  visible,
  onClose,
  onSubmit,
  roleOptions,
  teamOptions,
  isSubmitting = false,
  error,
}: InviteUserModalProps) {
  const [form, setForm] = useState<InviteUserFormData>(EMPTY_FORM);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setForm(EMPTY_FORM);
      setLocalError(null);
    }
  }, [visible]);

  function handleChange(field: keyof InviteUserFormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleRoleChange(role: UserRole) {
    setForm(prev => ({
      ...prev,
      role,
      teamId: '',
      playerType: 'normal',
      jersey: '',
      position: '',
    }));
    setLocalError(null);
  }

  async function handleSubmit() {
    setLocalError(null);

    if (!form.name.trim()) return setLocalError('El nombre es obligatorio.');
    if (!form.email.trim()) return setLocalError('El correo electrónico es obligatorio.');
    if (!form.role) return setLocalError('Selecciona un rol.');

    const result = await onSubmit(form);
    if (result !== false) onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={modalStyles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable>
            <View style={modalStyles.sheet}>
              <View className="flex-row items-start justify-between mb-4">
                <View style={{ flex: 1 }}>
                  <Text style={modalStyles.title}>Invitar usuario</Text>
                  <Text style={modalStyles.subtitle}>Envía una invitación real por correo para unirse a la liga.</Text>
                </View>
                <TouchableOpacity onPress={onClose} disabled={isSubmitting} hitSlop={12} style={modalStyles.closeButton}>
                  <Ionicons name="close" size={22} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={modalStyles.sectionLabel}>Rol en la liga</Text>
                <View className="flex-row flex-wrap mb-5" style={{ gap: 10 }}>
                  {roleOptions.map(option => {
                    const value = option.value as UserRole;
                    const selected = form.role === value;
                    const config = getRoleBadgeConfig(value);

                    return (
                      <TouchableOpacity
                        key={option.value}
                        onPress={() => handleRoleChange(value)}
                        disabled={isSubmitting}
                        activeOpacity={0.85}
                        style={[modalStyles.roleButton, selected ? { backgroundColor: Colors.brand.primary } : null]}
                      >
                        <Ionicons name={config.icon} size={17} color={selected ? '#000' : config.textColor} />
                        <Text style={[modalStyles.roleText, selected ? { color: '#000' } : null]}>{option.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View className="mb-4">
                  <Text className={styles.label} style={{ marginBottom: 6 }}>Nombre completo</Text>
                  <View className={styles.inputRow}>
                    <Ionicons name="person-outline" size={18} color={Colors.text.secondary} />
                    <TextInput
                      className={styles.input}
                      placeholder="Nombre del usuario"
                      placeholderTextColor={styles.inputPlaceholder}
                      value={form.name}
                      onChangeText={value => handleChange('name', value)}
                    />
                  </View>
                </View>

                <View className="mb-4">
                  <Text className={styles.label} style={{ marginBottom: 6 }}>Correo electrónico</Text>
                  <View className={styles.inputRow}>
                    <Ionicons name="mail-outline" size={18} color={Colors.text.secondary} />
                    <TextInput
                      className={styles.input}
                      placeholder="usuario@ejemplo.com"
                      placeholderTextColor={styles.inputPlaceholder}
                      value={form.email}
                      onChangeText={value => handleChange('email', value)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <PlayerExtraFields
                  role={form.role}
                  teamId={form.teamId}
                  playerType={form.playerType}
                  jersey={form.jersey}
                  position={form.position}
                  teamOptions={teamOptions}
                  onChange={(field, value) => handleChange(field, value)}
                />

                {(localError || error) ? (
                  <View style={modalStyles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={18} color={Colors.semantic.error} />
                    <Text style={modalStyles.errorText}>{localError || error}</Text>
                  </View>
                ) : null}
              </ScrollView>

              <View className="flex-row gap-3 mt-4">
                <TouchableOpacity onPress={onClose} disabled={isSubmitting} style={modalStyles.secondaryButton}>
                  <Text style={modalStyles.secondaryText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting} style={modalStyles.primaryButton}>
                  {isSubmitting ? <ActivityIndicator color="#000" style={{ marginRight: 8 }} /> : null}
                  <Text style={modalStyles.primaryText}>{isSubmitting ? 'Enviando...' : 'Invitar'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

export default InviteUserModal;

const modalStyles = {
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end' as const,
  },
  sheet: {
    maxHeight: '90%' as const,
    backgroundColor: Colors.bg.surface1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  title: { color: Colors.text.primary, fontSize: theme.fontSize.xxl, fontWeight: '900' as const },
  subtitle: { color: Colors.text.secondary, fontSize: theme.fontSize.sm, marginTop: 6, lineHeight: 20 },
  closeButton: { width: 48, height: 48, borderRadius: 18, backgroundColor: Colors.bg.surface2, alignItems: 'center' as const, justifyContent: 'center' as const },
  sectionLabel: { color: Colors.text.secondary, fontSize: theme.fontSize.sm, marginBottom: 10 },
  roleButton: { flexDirection: 'row' as const, alignItems: 'center' as const, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: Colors.bg.surface2, gap: 8 },
  roleText: { color: Colors.text.primary, fontSize: theme.fontSize.sm, fontWeight: '800' as const },
  errorBox: { flexDirection: 'row' as const, gap: 8, borderWidth: 1, borderColor: 'rgba(255,69,52,0.35)', backgroundColor: 'rgba(255,69,52,0.10)', borderRadius: 16, padding: theme.spacing.md, marginBottom: theme.spacing.md },
  errorText: { flex: 1, color: Colors.semantic.error, fontSize: theme.fontSize.sm },
  secondaryButton: { flex: 1, height: 52, borderRadius: 18, backgroundColor: Colors.bg.surface2, alignItems: 'center' as const, justifyContent: 'center' as const },
  secondaryText: { color: Colors.text.primary, fontSize: theme.fontSize.sm, fontWeight: '800' as const },
  primaryButton: { flex: 1.25, height: 52, borderRadius: 18, backgroundColor: Colors.brand.primary, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const },
  primaryText: { color: '#000', fontSize: theme.fontSize.sm, fontWeight: '900' as const },
};
