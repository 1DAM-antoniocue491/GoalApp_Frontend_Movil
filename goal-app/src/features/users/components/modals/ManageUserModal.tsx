/**
 * ManageUserModal
 *
 * Gestiona un usuario existente dentro de una liga:
 * - actualizar rol
 * - activar/desactivar
 * - eliminar de la liga
 *
 * No intenta actualizar equipo/dorsal porque los endpoints web entregados no
 * exponen esa mutación desde gestión de usuario.
 */

import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/src/shared/components/ui/Button';
import { OptionSelectField, SelectOption } from '@/src/shared/components/ui/OptionSelectField';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import type { LeagueUser, ManageUserFormData, UserRole } from '../../types/users.types';

interface ManageUserModalProps {
  user: LeagueUser;
  visible: boolean;
  onClose: () => void;
  onUpdate: (user: LeagueUser, data: ManageUserFormData) => Promise<boolean> | boolean;
  onRemove: (user: LeagueUser) => Promise<boolean> | boolean;
  roleOptions: SelectOption[];
  isSubmitting?: boolean;
  error?: string | null;
}

export function ManageUserModal({
  user,
  visible,
  onClose,
  onUpdate,
  onRemove,
  roleOptions,
  isSubmitting = false,
  error,
}: ManageUserModalProps) {
  const [form, setForm] = useState<ManageUserFormData>({
    role: '',
    active: true,
  });
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setForm({ role: user.role, active: user.active });
      setLocalError(null);
    }
  }, [user]);

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map(word => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  async function handleUpdate() {
    setLocalError(null);
    if (!form.role && user === null) return setLocalError('Selecciona un rol válido');

    const ok = await onUpdate(user, form);
    if (ok) onClose();
  }

  function handleRemove() {
    Alert.alert(
      'Eliminar usuario',
      `¿Seguro que quieres eliminar a ${user.name} de la liga?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const ok = await onRemove(user);
            if (ok) onClose();
          },
        },
      ],
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={modalStyles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable>
            <View style={modalStyles.sheet}>
              <View className="flex-row items-center justify-between mb-5">
                <Text style={modalStyles.title}>Gestionar usuario</Text>
                <TouchableOpacity onPress={onClose} hitSlop={12}>
                  <Ionicons name="close" size={22} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <View style={modalStyles.identityCard}>
                <View style={modalStyles.avatar}>
                  <Text style={modalStyles.avatarText}>{initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={modalStyles.name} numberOfLines={1}>{user.name}</Text>
                  <Text style={modalStyles.email} numberOfLines={1}>{user.email}</Text>
                  <Text style={modalStyles.meta}>{user.roleLabel} · {user.active ? 'Activo' : 'Pendiente'}</Text>
                </View>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View className="mb-4">
                  <OptionSelectField
                    label="Rol en la liga"
                    value={form.role}
                    options={roleOptions}
                    placeholder="Selecciona un rol"
                    onChange={value => setForm(prev => ({ ...prev, role: value as UserRole }))}
                  />
                </View>

                <View style={modalStyles.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={modalStyles.switchTitle}>Usuario activo</Text>
                    <Text style={modalStyles.switchHint}>Controla si el usuario puede participar en la liga.</Text>
                  </View>
                  <Switch
                    value={form.active}
                    onValueChange={active => setForm(prev => ({ ...prev, active }))}
                    trackColor={{ false: Colors.bg.base, true: Colors.brand.primary }}
                    thumbColor={form.active ? '#000000' : Colors.text.secondary}
                  />
                </View>

                <TouchableOpacity
                  style={modalStyles.deleteButton}
                  onPress={handleRemove}
                  activeOpacity={0.85}
                  disabled={isSubmitting}
                >
                  <Ionicons name="trash-outline" size={17} color={Colors.semantic.error} style={{ marginRight: 8 }} />
                  <Text style={modalStyles.deleteText}>Eliminar de la liga</Text>
                </TouchableOpacity>

                {(localError || error) && <Text style={modalStyles.error}>{localError ?? error}</Text>}
              </ScrollView>

              <View className="flex-row gap-3 mt-4">
                <View style={{ flex: 1 }}>
                  <Button label="Cancelar" variant="secondary" onPress={onClose} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    label={isSubmitting ? 'Actualizando...' : 'Actualizar'}
                    variant="primary"
                    onPress={handleUpdate}
                    disabled={isSubmitting}
                  />
                </View>
              </View>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const modalStyles = {
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.70)',
    justifyContent: 'flex-end' as const,
  },
  sheet: {
    maxHeight: '88%' as const,
    backgroundColor: Colors.bg.surface1,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  title: {
    color: Colors.text.primary,
    fontSize: theme.fontSize.xl,
    fontWeight: '700' as const,
  },
  identityCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.bg.surface2,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.bg.base,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: theme.spacing.md,
  },
  avatarText: {
    color: Colors.brand.primary,
    fontSize: theme.fontSize.md,
    fontWeight: '800' as const,
  },
  name: {
    color: Colors.text.primary,
    fontSize: theme.fontSize.md,
    fontWeight: '700' as const,
  },
  email: {
    color: Colors.text.secondary,
    fontSize: theme.fontSize.xs,
    marginTop: 2,
  },
  meta: {
    color: Colors.text.disabled,
    fontSize: theme.fontSize.xs,
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: Colors.bg.surface2,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  switchTitle: {
    color: Colors.text.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: '700' as const,
  },
  switchHint: {
    color: Colors.text.secondary,
    fontSize: theme.fontSize.xs,
    marginTop: 3,
  },
  deleteButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: 'rgba(255,69,52,0.10)',
    minHeight: 50,
    marginBottom: theme.spacing.md,
  },
  deleteText: {
    color: Colors.semantic.error,
    fontSize: theme.fontSize.sm,
    fontWeight: '700' as const,
  },
  error: {
    color: Colors.semantic.error,
    fontSize: theme.fontSize.sm,
    marginBottom: theme.spacing.md,
  },
};
