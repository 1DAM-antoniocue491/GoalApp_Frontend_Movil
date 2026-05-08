/** Modal React Native para gestionar rol, estado y borrado de un usuario de liga. */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { getRoleBadgeConfig } from '@/src/shared/utils/roles';
import type { LeagueUser, ManageUserFormData, SelectOption, UserRole } from '../../types/users.types';

interface ManageUserModalProps {
  user: LeagueUser | null;
  visible: boolean;
  onClose: () => void;
  onUpdate: (userId: string, data: ManageUserFormData) => Promise<boolean> | boolean | Promise<void> | void;
  onRemove: (userId: string) => Promise<boolean> | boolean | Promise<void> | void;
  roleOptions: SelectOption[];
  isSubmitting?: boolean;
  error?: string | null;
  errorMessage?: string | null;
  currentUserId?: number | null;
  adminCount?: number;
}

function getSafeRole(role?: UserRole | ''): UserRole | '' {
  return role ?? '';
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
  errorMessage,
  currentUserId,
  adminCount = 0,
}: ManageUserModalProps) {
  const [form, setForm] = useState<ManageUserFormData>({ role: '', active: true });
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [removeSubmitting, setRemoveSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setForm({ role: getSafeRole(user.role), active: Boolean(user.active) });
    setStatusSubmitting(false);
    setRemoveSubmitting(false);
    setLocalError(null);
  }, [user]);

  const isSelf = Boolean(user && currentUserId && Number(user.userId) === Number(currentUserId));
  const isAdmin = user?.role === 'admin';
  const isLastAdmin = Boolean(isAdmin && adminCount <= 1);
  const deleteBlocked = Boolean((isSelf && isAdmin) || isLastAdmin);
  const busy = isSubmitting || statusSubmitting || removeSubmitting;

  const deleteBlockMessage = useMemo(() => {
    if (isSelf && isAdmin) return 'No puedes eliminarte a ti mismo como administrador.';
    if (isLastAdmin) return 'No se puede eliminar al único administrador de la liga.';
    return null;
  }, [isSelf, isAdmin, isLastAdmin]);

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  async function handleRoleUpdate() {
    if (!user) return;

    const payload: ManageUserFormData = {
      ...form,
      role: getSafeRole(form.role || user.role),
    };

    const result = await onUpdate(user.id, payload);
    if (result !== false) onClose();
  }

  async function handleStatusToggle(nextActive: boolean) {
    if (!user) return;

    const previous = form.active;
    const safeRole = getSafeRole(form.role || user.role);

    setLocalError(null);
    setForm(prev => ({ ...prev, active: nextActive }));
    setStatusSubmitting(true);

    const result = await onUpdate(user.id, {
      role: safeRole,
      active: nextActive,
    });

    setStatusSubmitting(false);

    if (result === false) {
      setForm(prev => ({ ...prev, active: previous }));
      setLocalError('No se pudo actualizar el estado del usuario.');
      return;
    }

    // Confirmación visual móvil: cerrar al completar con éxito.
    onClose();
  }

  function handleRemove() {
    if (!user) return;

    if (deleteBlocked) {
      Alert.alert('Acción bloqueada', deleteBlockMessage ?? 'No puedes eliminar este usuario.');
      return;
    }

    Alert.alert('Eliminar usuario', `¿Quieres eliminar a ${user.name} de esta liga?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setRemoveSubmitting(true);
          const result = await onRemove(user.id);
          setRemoveSubmitting(false);
          if (result !== false) onClose();
        },
      },
    ]);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={modalStyles.backdrop} onPress={busy ? undefined : onClose}>
        <Pressable>
          <View style={modalStyles.sheet}>
            <View className="px-6 pt-5 pb-4 flex-row items-start justify-between">
              <View style={{ flex: 1 }}>
                <Text style={modalStyles.title}>Gestionar usuario</Text>
                <Text style={modalStyles.subtitle}>Cambia su rol o toca el interruptor para activar/desactivar.</Text>
              </View>
              <TouchableOpacity onPress={onClose} disabled={busy} style={modalStyles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 28 }}>
              <View className="flex-row items-center rounded-3xl p-4 mb-5" style={{ backgroundColor: Colors.bg.surface2 }}>
                <View style={modalStyles.avatar}>
                  <Text style={modalStyles.avatarText}>{initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={modalStyles.userName} numberOfLines={1}>{user.name}</Text>
                  <Text style={modalStyles.userMeta} numberOfLines={1}>{user.email}</Text>
                  {user.teamName ? (
                    <Text style={modalStyles.userTeam} numberOfLines={1}>
                      {user.teamName}{user.jersey ? ` · #${user.jersey}` : ''}{user.position ? ` · ${user.position}` : ''}
                    </Text>
                  ) : null}
                </View>
              </View>

              {(errorMessage || error || localError) ? (
                <View style={modalStyles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={20} color={Colors.semantic.error} />
                  <Text style={modalStyles.errorText}>{errorMessage || error || localError}</Text>
                </View>
              ) : null}

              <Text style={modalStyles.sectionLabel}>Rol en la liga</Text>
              <View className="flex-row flex-wrap mb-5" style={{ gap: 10 }}>
                {roleOptions.map(option => {
                  const value = option.value as UserRole;
                  const selected = form.role === value;
                  const config = getRoleBadgeConfig(value);

                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setForm(prev => ({ ...prev, role: value }))}
                      disabled={busy}
                      activeOpacity={0.85}
                      style={[modalStyles.roleButton, selected ? { backgroundColor: Colors.brand.primary } : null]}
                    >
                      <Ionicons name={config.icon} size={17} color={selected ? '#000' : config.textColor} />
                      <Text style={[modalStyles.roleText, selected ? { color: '#000' } : null]}>{option.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={modalStyles.stateBox}>
                <View style={{ flex: 1, paddingVertical: 12 }}>
                  <Text style={modalStyles.stateTitle}>Usuario {form.active ? 'activo' : 'inactivo'}</Text>
                  <Text style={modalStyles.stateSubtitle}>Toca una vez para actualizarlo en la API.</Text>
                </View>
                {statusSubmitting ? (
                  <ActivityIndicator color={Colors.brand.primary} />
                ) : (
                  <Switch
                    value={form.active}
                    onValueChange={handleStatusToggle}
                    disabled={isSubmitting}
                    trackColor={{ false: Colors.bg.base, true: Colors.brand.primary }}
                    thumbColor={form.active ? '#000000' : Colors.text.secondary}
                  />
                )}
              </View>

              {deleteBlockMessage ? (
                <View style={modalStyles.warningBox}>
                  <Ionicons name="lock-closed-outline" size={18} color={Colors.semantic.warning} />
                  <Text style={modalStyles.warningText}>{deleteBlockMessage}</Text>
                </View>
              ) : null}

              <View className="flex-row gap-3 mt-1">
                <TouchableOpacity onPress={onClose} disabled={busy} activeOpacity={0.85} style={modalStyles.secondaryButton}>
                  <Text style={modalStyles.secondaryText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleRoleUpdate} disabled={busy} activeOpacity={0.85} style={modalStyles.primaryButton}>
                  {isSubmitting ? <ActivityIndicator color="#000" style={{ marginRight: 8 }} /> : null}
                  <Text style={modalStyles.primaryText}>Actualizar</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleRemove}
                disabled={busy || deleteBlocked}
                activeOpacity={0.8}
                style={[modalStyles.deleteButton, deleteBlocked ? { opacity: 0.45 } : null]}
              >
                {removeSubmitting ? <ActivityIndicator color={Colors.semantic.error} style={{ marginRight: 8 }} /> : <Ionicons name="trash-outline" size={18} color={Colors.semantic.error} style={{ marginRight: 8 }} />}
                <Text style={modalStyles.deleteText}>{removeSubmitting ? 'Eliminando...' : 'Eliminar de la liga'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default ManageUserModal;

const modalStyles = {
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' as const },
  sheet: { backgroundColor: Colors.bg.surface1, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '88%' as const },
  title: { color: Colors.text.primary, fontSize: theme.fontSize.xxl, fontWeight: '900' as const },
  subtitle: { color: Colors.text.secondary, fontSize: theme.fontSize.sm, marginTop: 6, lineHeight: 20 },
  closeButton: { width: 48, height: 48, borderRadius: 18, backgroundColor: Colors.bg.surface2, alignItems: 'center' as const, justifyContent: 'center' as const, marginLeft: 16 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(196,241,53,0.12)', alignItems: 'center' as const, justifyContent: 'center' as const, marginRight: 14 },
  avatarText: { color: Colors.brand.primary, fontWeight: '900' as const, fontSize: theme.fontSize.lg },
  userName: { color: Colors.text.primary, fontSize: theme.fontSize.md, fontWeight: '800' as const },
  userMeta: { color: Colors.text.secondary, fontSize: theme.fontSize.sm, marginTop: 3 },
  userTeam: { color: Colors.text.disabled, fontSize: theme.fontSize.xs, marginTop: 4 },
  sectionLabel: { color: Colors.text.secondary, fontSize: theme.fontSize.sm, marginBottom: 10 },
  roleButton: { flexDirection: 'row' as const, alignItems: 'center' as const, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: Colors.bg.surface2, gap: 8 },
  roleText: { color: Colors.text.primary, fontSize: theme.fontSize.sm, fontWeight: '800' as const },
  stateBox: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, backgroundColor: Colors.bg.surface2, borderRadius: 18, paddingHorizontal: 16, marginBottom: 20 },
  stateTitle: { color: Colors.text.primary, fontSize: theme.fontSize.md, fontWeight: '800' as const },
  stateSubtitle: { color: Colors.text.secondary, fontSize: theme.fontSize.xs, marginTop: 2 },
  errorBox: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, borderRadius: 16, padding: 14, marginBottom: 18, backgroundColor: 'rgba(255,69,52,0.10)', borderWidth: 1, borderColor: 'rgba(255,69,52,0.35)' },
  errorText: { flex: 1, color: Colors.semantic.error, fontSize: theme.fontSize.sm, marginLeft: 10 },
  warningBox: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, borderRadius: 16, padding: 14, marginBottom: 18, backgroundColor: 'rgba(255,214,10,0.10)', borderWidth: 1, borderColor: 'rgba(255,214,10,0.35)' },
  warningText: { flex: 1, color: Colors.semantic.warning, fontSize: theme.fontSize.sm, marginLeft: 10 },
  secondaryButton: { flex: 1, height: 52, borderRadius: 18, backgroundColor: Colors.bg.surface2, alignItems: 'center' as const, justifyContent: 'center' as const },
  secondaryText: { color: Colors.text.primary, fontSize: theme.fontSize.sm, fontWeight: '800' as const },
  primaryButton: { flex: 1, height: 52, borderRadius: 18, backgroundColor: Colors.brand.primary, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const },
  primaryText: { color: '#000', fontSize: theme.fontSize.sm, fontWeight: '900' as const },
  deleteButton: { height: 52, borderRadius: 18, backgroundColor: 'rgba(255,69,52,0.10)', alignItems: 'center' as const, justifyContent: 'center' as const, flexDirection: 'row' as const, marginTop: 16 },
  deleteText: { color: Colors.semantic.error, fontSize: theme.fontSize.sm, fontWeight: '800' as const },
};
