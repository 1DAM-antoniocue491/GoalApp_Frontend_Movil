/** Modal React Native para gestionar rol/estado de un usuario de liga. */

import React, { useEffect, useState } from 'react';
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
}

function roleIcon(role: string): keyof typeof Ionicons.glyphMap {
  switch (role) {
    case 'admin': return 'shield-outline';
    case 'coach': return 'ribbon-outline';
    case 'delegate': return 'clipboard-outline';
    case 'player': return 'football-outline';
    default: return 'eye-outline';
  }
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
  const [form, setForm] = useState<ManageUserFormData>({ role: '', active: true });

  useEffect(() => {
    if (user) {
      setForm({ role: user.role, active: user.active });
    }
  }, [user]);

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  async function handleUpdate() {
    const result = await onUpdate(user.id, form);
    if (result !== false) onClose();
  }

  function handleRemove() {
    Alert.alert(
      'Eliminar usuario',
      `¿Quieres eliminar a ${user.name} de esta liga?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const result = await onRemove(user.id);
            if (result !== false) onClose();
          },
        },
      ],
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable>
          <View
            style={{
              backgroundColor: Colors.bg.surface1,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              maxHeight: '88%',
            }}
          >
            <View className="px-6 pt-5 pb-4 flex-row items-start justify-between">
              <View style={{ flex: 1 }}>
                <Text style={{ color: Colors.text.primary, fontSize: theme.fontSize.xxl, fontWeight: '800' }}>
                  Gestionar usuario
                </Text>
                <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm, marginTop: 6 }}>
                  Cambia su rol, estado o elimínalo de la liga.
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                disabled={isSubmitting}
                className="items-center justify-center rounded-2xl ml-4"
                style={{ width: 48, height: 48, backgroundColor: Colors.bg.surface2 }}
              >
                <Ionicons name="close" size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 28 }}>
              <View className="flex-row items-center rounded-3xl p-4 mb-5" style={{ backgroundColor: Colors.bg.surface2 }}>
                <View
                  className="items-center justify-center rounded-full mr-4"
                  style={{ width: 52, height: 52, backgroundColor: 'rgba(196,241,53,0.12)' }}
                >
                  <Text style={{ color: Colors.brand.primary, fontWeight: '900', fontSize: theme.fontSize.lg }}>
                    {initials}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: Colors.text.primary, fontSize: theme.fontSize.md, fontWeight: '800' }} numberOfLines={1}>
                    {user.name}
                  </Text>
                  <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm, marginTop: 3 }} numberOfLines={1}>
                    {user.email}
                  </Text>
                  {user.teamName ? (
                    <Text style={{ color: Colors.text.disabled, fontSize: theme.fontSize.xs, marginTop: 4 }} numberOfLines={1}>
                      {user.teamName}{user.jersey ? ` · #${user.jersey}` : ''}{user.position ? ` · ${user.position}` : ''}
                    </Text>
                  ) : null}
                </View>
              </View>

              {error ? (
                <View
                  className="flex-row items-start rounded-2xl p-4 mb-5"
                  style={{ backgroundColor: 'rgba(255,69,52,0.10)', borderWidth: 1, borderColor: 'rgba(255,69,52,0.35)' }}
                >
                  <Ionicons name="alert-circle-outline" size={20} color={Colors.semantic.error} />
                  <Text style={{ flex: 1, color: Colors.semantic.error, fontSize: theme.fontSize.sm, marginLeft: 10 }}>
                    {error}
                  </Text>
                </View>
              ) : null}

              <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm, marginBottom: 10 }}>Rol en la liga</Text>
              <View className="flex-row flex-wrap mb-5" style={{ gap: 10 }}>
                {roleOptions.map(option => {
                  const selected = form.role === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setForm(prev => ({ ...prev, role: option.value as UserRole }))}
                      activeOpacity={0.85}
                      className="flex-row items-center rounded-2xl px-4 py-3"
                      style={{
                        backgroundColor: selected ? Colors.brand.primary : Colors.bg.surface2,
                        borderWidth: 1,
                        borderColor: selected ? Colors.brand.primary : Colors.bg.surface2,
                      }}
                    >
                      <Ionicons name={roleIcon(option.value)} size={17} color={selected ? '#000' : Colors.text.secondary} />
                      <Text style={{ color: selected ? '#000' : Colors.text.primary, marginLeft: 8, fontWeight: '800' }}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View
                className="flex-row items-center justify-between rounded-2xl px-4 mb-5"
                style={{ backgroundColor: Colors.bg.surface2, height: 58 }}
              >
                <View>
                  <Text style={{ color: Colors.text.primary, fontSize: theme.fontSize.md, fontWeight: '800' }}>
                    Usuario activo
                  </Text>
                  <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.xs, marginTop: 2 }}>
                    Controla si puede acceder a la liga.
                  </Text>
                </View>
                <Switch
                  value={form.active}
                  onValueChange={active => setForm(prev => ({ ...prev, active }))}
                  trackColor={{ false: Colors.bg.base, true: Colors.brand.primary }}
                  thumbColor={form.active ? '#000000' : Colors.text.secondary}
                />
              </View>

              <TouchableOpacity
                onPress={handleRemove}
                disabled={isSubmitting}
                className="flex-row items-center justify-center rounded-2xl mb-5"
                style={{ height: 50, backgroundColor: 'rgba(255,69,52,0.10)' }}
              >
                <Ionicons name="trash-outline" size={18} color={Colors.semantic.error} />
                <Text style={{ color: Colors.semantic.error, fontSize: theme.fontSize.md, fontWeight: '800', marginLeft: 8 }}>
                  Eliminar de la liga
                </Text>
              </TouchableOpacity>

              <View className="flex-row" style={{ gap: 12 }}>
                <TouchableOpacity
                  onPress={onClose}
                  disabled={isSubmitting}
                  className="flex-1 items-center justify-center rounded-2xl"
                  style={{ height: 54, backgroundColor: Colors.bg.surface2 }}
                >
                  <Text style={{ color: Colors.text.primary, fontSize: theme.fontSize.md, fontWeight: '800' }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleUpdate}
                  disabled={isSubmitting}
                  className="flex-1 flex-row items-center justify-center rounded-2xl"
                  style={{ height: 54, backgroundColor: Colors.brand.primary, opacity: isSubmitting ? 0.65 : 1 }}
                >
                  {isSubmitting ? <ActivityIndicator color="#000" /> : <Ionicons name="save-outline" size={18} color="#000" />}
                  <Text style={{ color: '#000', fontSize: theme.fontSize.md, fontWeight: '900', marginLeft: 8 }}>
                    {isSubmitting ? 'Guardando' : 'Guardar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
