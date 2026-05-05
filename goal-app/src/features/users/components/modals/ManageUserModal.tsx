/**
 * ManageUserModal
 *
 * Modal para gestionar un usuario existente dentro de la liga.
 * Replica la lógica web real:
 * - Actualizar rol: PUT /ligas/{ligaId}/usuarios/{usuarioId}/rol
 * - Actualizar estado: PUT /ligas/{ligaId}/usuarios/{usuarioId}/estado
 * - Eliminar usuario: DELETE /ligas/{ligaId}/usuarios/{usuarioId}
 *
 * No edita datos de equipo/jugador porque esos endpoints no están en el flujo web entregado.
 */

import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { Button } from '@/src/shared/components/ui/Button';
import { OptionSelectField, SelectOption } from '@/src/shared/components/ui/OptionSelectField';
import type { LeagueUser, ManageUserFormData, UserRole } from '../../types/users.types';

interface ManageUserModalProps {
  user: LeagueUser | null;
  visible: boolean;
  onClose: () => void;
  onUpdate: (userId: string, data: ManageUserFormData) => Promise<boolean> | boolean;
  onRemove: (userId: string) => Promise<boolean> | boolean;
  roleOptions?: SelectOption[];
  isUpdating?: boolean;
  isRemoving?: boolean;
  error?: string | null;
}

const FALLBACK_ROLE_OPTIONS: SelectOption[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'coach', label: 'Entrenador' },
  { value: 'player', label: 'Jugador' },
  { value: 'delegate', label: 'Delegado' },
  { value: 'observer', label: 'Observador' },
];

export function ManageUserModal({
  user,
  visible,
  onClose,
  onUpdate,
  onRemove,
  roleOptions = FALLBACK_ROLE_OPTIONS,
  isUpdating = false,
  isRemoving = false,
  error,
}: ManageUserModalProps) {
  const [form, setForm] = useState<ManageUserFormData>({
    role: '',
    active: true,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user && visible) {
      setForm({
        role: user.role,
        active: user.active,
      });
      setShowDeleteConfirm(false);
    }
  }, [user, visible]);

  if (!user) return null;

  const isBusy = isUpdating || isRemoving;
  const hasChanges = form.role !== user.role || form.active !== user.active;

  function handleChange(field: keyof ManageUserFormData, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleUpdate() {
    if (isBusy || !hasChanges || user === null) return;
    const success = await onUpdate(user.id, form);
    if (success) onClose();
  }

  async function handleRemove() {
    if (isBusy || user === null) return;
    const success = await onRemove(user.id);
    if (success) onClose();
  }

  const initials = (user.name || user.email || 'U')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.72)',
          justifyContent: 'flex-end',
        }}
        onPress={isBusy ? undefined : onClose}
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
              <View className="flex-row items-center justify-between mb-5">
                <Text style={{ color: Colors.text.primary, fontSize: theme.fontSize.xl, fontWeight: '800' }}>
                  Gestionar usuario
                </Text>
                <TouchableOpacity onPress={onClose} disabled={isBusy} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Ionicons name="close" size={22} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {/* Identidad del usuario */}
              <View
                className="flex-row items-center mb-5 p-4 rounded-2xl"
                style={{ backgroundColor: Colors.bg.surface2 }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: Colors.bg.base,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: theme.spacing.md,
                    borderWidth: 1,
                    borderColor: Colors.brand.primary,
                  }}
                >
                  <Text style={{ color: Colors.brand.primary, fontSize: theme.fontSize.md, fontWeight: '800' }}>
                    {initials}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: Colors.text.primary, fontSize: theme.fontSize.md, fontWeight: '700' }} numberOfLines={1}>
                    {user.name || 'Usuario sin nombre'}
                  </Text>
                  <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.xs, marginTop: 3 }} numberOfLines={1}>
                    {user.email || 'Sin email'}
                  </Text>
                </View>
              </View>

              {error ? (
                <View
                  style={{
                    backgroundColor: 'rgba(255,69,52,0.10)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,69,52,0.35)',
                    borderRadius: theme.borderRadius.lg,
                    padding: theme.spacing.md,
                    marginBottom: theme.spacing.lg,
                  }}
                >
                  <Text style={{ color: Colors.semantic.error, fontSize: theme.fontSize.sm, lineHeight: 20 }}>{error}</Text>
                </View>
              ) : null}

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Rol */}
                <View className="mb-4">
                  <OptionSelectField
                    label="Rol en la liga"
                    value={form.role}
                    options={roleOptions.length > 0 ? roleOptions : FALLBACK_ROLE_OPTIONS}
                    placeholder="Selecciona un rol"
                    onChange={v => handleChange('role', v as UserRole)}
                  />
                </View>

                {/* Estado */}
                <View
                  className="flex-row items-center justify-between mb-4 px-4 rounded-2xl"
                  style={{ backgroundColor: Colors.bg.surface2, minHeight: 58 }}
                >
                  <View>
                    <Text style={{ color: Colors.text.primary, fontSize: theme.fontSize.sm, fontWeight: '700' }}>
                      Estado del usuario
                    </Text>
                    <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.xs, marginTop: 2 }}>
                      {form.active ? 'Activo en la liga' : 'Pendiente o desactivado'}
                    </Text>
                  </View>
                  <Switch
                    value={form.active}
                    onValueChange={v => handleChange('active', v)}
                    disabled={isBusy}
                    trackColor={{ false: Colors.bg.base, true: Colors.brand.primary }}
                    thumbColor={form.active ? '#000000' : Colors.text.secondary}
                  />
                </View>

                {/* Acción destructiva */}
                {showDeleteConfirm ? (
                  <View
                    style={{
                      backgroundColor: 'rgba(255,69,52,0.10)',
                      borderWidth: 1,
                      borderColor: 'rgba(255,69,52,0.35)',
                      borderRadius: theme.borderRadius.lg,
                      padding: theme.spacing.md,
                      marginBottom: theme.spacing.md,
                    }}
                  >
                    <Text style={{ color: Colors.text.primary, fontSize: theme.fontSize.sm, fontWeight: '700', marginBottom: 4 }}>
                      ¿Eliminar de la liga?
                    </Text>
                    <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.xs, lineHeight: 18, marginBottom: theme.spacing.md }}>
                      Esta acción quitará a este usuario de la liga. No se puede deshacer.
                    </Text>
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => setShowDeleteConfirm(false)}
                        disabled={isBusy}
                        style={{ flex: 1, height: 42, borderRadius: theme.borderRadius.lg, backgroundColor: Colors.bg.surface2, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Text style={{ color: Colors.text.primary, fontWeight: '700' }}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleRemove}
                        disabled={isBusy}
                        style={{ flex: 1, height: 42, borderRadius: theme.borderRadius.lg, backgroundColor: Colors.semantic.error, alignItems: 'center', justifyContent: 'center' }}
                      >
                        {isRemoving ? <ActivityIndicator size="small" color="#000" /> : <Text style={{ color: '#000', fontWeight: '800' }}>Eliminar</Text>}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    className="flex-row items-center justify-center rounded-2xl mb-4"
                    style={{ backgroundColor: 'rgba(255,69,52,0.10)', height: 48 }}
                    onPress={() => setShowDeleteConfirm(true)}
                    disabled={isBusy}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={17} color={Colors.semantic.error} style={{ marginRight: 8 }} />
                    <Text style={{ color: Colors.semantic.error, fontSize: theme.fontSize.sm, fontWeight: '700' }}>
                      Eliminar de la liga
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>

              {/* Footer */}
              <View className="flex-row gap-3">
                <View style={{ flex: 1 }}>
                  <Button label="Cancelar" variant="secondary" onPress={onClose} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    label={isUpdating ? 'Actualizando...' : 'Actualizar'}
                    variant="primary"
                    onPress={handleUpdate}
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
