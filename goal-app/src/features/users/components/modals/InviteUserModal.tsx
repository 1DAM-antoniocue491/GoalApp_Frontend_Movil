/** Modal React Native para invitar usuario por correo con API real. */

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
  playerType: '',
  jersey: '',
  position: '',
};

function roleIcon(role: string): keyof typeof Ionicons.glyphMap {
  switch (role) {
    case 'admin': return 'shield-outline';
    case 'coach': return 'ribbon-outline';
    case 'delegate': return 'clipboard-outline';
    case 'player': return 'football-outline';
    default: return 'eye-outline';
  }
}

function NeedsTeamNotice() {
  return (
    <View
      className="flex-row items-start rounded-2xl p-3 mb-4"
      style={{ backgroundColor: 'rgba(0,180,216,0.10)', borderWidth: 1, borderColor: 'rgba(0,180,216,0.25)' }}
    >
      <Ionicons name="information-circle-outline" size={18} color={Colors.brand.secondary} />
      <Text style={{ flex: 1, color: Colors.text.secondary, fontSize: theme.fontSize.xs, marginLeft: 8 }}>
        Este rol necesita estar asociado a un equipo para funcionar correctamente en la liga.
      </Text>
    </View>
  );
}

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
  const selectedRole = form.role;
  const needsTeam = selectedRole === 'coach' || selectedRole === 'delegate' || selectedRole === 'player';
  const isPlayer = selectedRole === 'player';

  useEffect(() => {
    if (!visible) setForm(EMPTY_FORM);
  }, [visible]);

  function update<K extends keyof InviteUserFormData>(field: K, value: InviteUserFormData[K]) {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'role') {
        next.teamId = '';
        next.jersey = '';
        next.position = '';
        next.playerType = '';
      }
      return next;
    });
  }

  async function handleSubmit() {
    const result = await onSubmit(form);
    if (result !== false) onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' }} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable>
            <View
              style={{
                backgroundColor: Colors.bg.surface1,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                maxHeight: '92%',
              }}
            >
              <View className="px-6 pt-5 pb-4 flex-row items-start justify-between">
                <View style={{ flex: 1 }}>
                  <Text style={{ color: Colors.text.primary, fontSize: theme.fontSize.xxl, fontWeight: '800' }}>
                    Invitar usuario
                  </Text>
                  <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm, marginTop: 6 }}>
                    Envía una invitación real por correo para unirse a la liga.
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

              <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 28 }} keyboardShouldPersistTaps="handled">
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

                <View className="mb-4">
                  <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm, marginBottom: 8 }}>Nombre completo</Text>
                  <View className="flex-row items-center rounded-2xl px-4" style={{ backgroundColor: Colors.bg.surface2, height: 54 }}>
                    <Ionicons name="person-outline" size={18} color={Colors.text.secondary} />
                    <TextInput
                      value={form.name}
                      onChangeText={value => update('name', value)}
                      placeholder="Nombre del usuario"
                      placeholderTextColor={Colors.text.disabled}
                      className="flex-1 ml-3"
                      style={{ color: Colors.text.primary, fontSize: theme.fontSize.md }}
                    />
                  </View>
                </View>

                <View className="mb-5">
                  <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm, marginBottom: 8 }}>Correo electrónico</Text>
                  <View className="flex-row items-center rounded-2xl px-4" style={{ backgroundColor: Colors.bg.surface2, height: 54 }}>
                    <Ionicons name="mail-outline" size={18} color={Colors.text.secondary} />
                    <TextInput
                      value={form.email}
                      onChangeText={value => update('email', value)}
                      placeholder="correo@ejemplo.com"
                      placeholderTextColor={Colors.text.disabled}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      className="flex-1 ml-3"
                      style={{ color: Colors.text.primary, fontSize: theme.fontSize.md }}
                    />
                  </View>
                </View>

                <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm, marginBottom: 10 }}>Rol en la liga</Text>
                <View className="flex-row flex-wrap mb-5" style={{ gap: 10 }}>
                  {roleOptions.map(option => {
                    const selected = selectedRole === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        onPress={() => update('role', option.value as UserRole)}
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

                {needsTeam ? <NeedsTeamNotice /> : null}

                {needsTeam ? (
                  <View className="mb-5">
                    <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm, marginBottom: 10 }}>Equipo</Text>
                    <View className="flex-row flex-wrap" style={{ gap: 10 }}>
                      {teamOptions.map(option => {
                        const selected = form.teamId === option.value;
                        return (
                          <TouchableOpacity
                            key={option.value}
                            onPress={() => update('teamId', option.value)}
                            activeOpacity={0.85}
                            className="rounded-2xl px-4 py-3"
                            style={{
                              backgroundColor: selected ? 'rgba(196,241,53,0.18)' : Colors.bg.surface2,
                              borderWidth: 1,
                              borderColor: selected ? Colors.brand.primary : Colors.bg.surface2,
                            }}
                          >
                            <Text style={{ color: selected ? Colors.brand.primary : Colors.text.primary, fontWeight: '700' }}>
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ) : null}

                {isPlayer ? (
                  <PlayerExtraFields
                    jersey={form.jersey}
                    position={form.position}
                    playerType={form.playerType}
                    onJerseyChange={value => update('jersey', value)}
                    onPositionChange={value => update('position', value)}
                    onPlayerTypeChange={value => update('playerType', value)}
                  />
                ) : null}

                <View className="flex-row mt-6" style={{ gap: 12 }}>
                  <TouchableOpacity
                    onPress={onClose}
                    disabled={isSubmitting}
                    className="flex-1 items-center justify-center rounded-2xl"
                    style={{ height: 54, backgroundColor: Colors.bg.surface2 }}
                  >
                    <Text style={{ color: Colors.text.primary, fontSize: theme.fontSize.md, fontWeight: '800' }}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 flex-row items-center justify-center rounded-2xl"
                    style={{ height: 54, backgroundColor: Colors.brand.primary, opacity: isSubmitting ? 0.65 : 1 }}
                  >
                    {isSubmitting ? <ActivityIndicator color="#000" /> : <Ionicons name="send-outline" size={18} color="#000" />}
                    <Text style={{ color: '#000', fontSize: theme.fontSize.md, fontWeight: '900', marginLeft: 8 }}>
                      {isSubmitting ? 'Enviando' : 'Invitar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
