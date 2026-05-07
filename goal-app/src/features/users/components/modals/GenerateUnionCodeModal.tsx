/** Modal React Native para generar códigos de unión. */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import type {
  GenerateUnionCodeFormData,
  SelectOption,
  UnionCodeResponse,
  UserRole,
} from '../../types/users.types';
import { PlayerExtraFields } from './PlayerExtraFields';

interface GenerateUnionCodeModalProps {
  visible: boolean;
  onClose: () => void;
  onGenerate: (data: GenerateUnionCodeFormData) => Promise<UnionCodeResponse | null>;
  onDeleteCode?: (codigo: string) => Promise<boolean> | boolean;
  roleOptions: SelectOption[];
  teamOptions: SelectOption[];
  isSubmitting?: boolean;
  error?: string | null;
}

const EMPTY_FORM: GenerateUnionCodeFormData = {
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

function formatExpiration(response: UnionCodeResponse | null): string | null {
  const raw = response?.expira_en ?? response?.expiracion ?? null;
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function GenerateUnionCodeModal({
  visible,
  onClose,
  onGenerate,
  onDeleteCode,
  roleOptions,
  teamOptions,
  isSubmitting = false,
  error,
}: GenerateUnionCodeModalProps) {
  const [form, setForm] = useState<GenerateUnionCodeFormData>(EMPTY_FORM);
  const [generatedCode, setGeneratedCode] = useState<UnionCodeResponse | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  const selectedRole = form.role;
  const needsTeam = selectedRole === 'coach' || selectedRole === 'delegate' || selectedRole === 'player';
  const isPlayer = selectedRole === 'player';
  const expiration = useMemo(() => formatExpiration(generatedCode), [generatedCode]);

  useEffect(() => {
    if (!visible) {
      setForm(EMPTY_FORM);
      setGeneratedCode(null);
      setLocalError(null);
      setCopiedFeedback(false);
    }
  }, [visible]);

  function update<K extends keyof GenerateUnionCodeFormData>(field: K, value: GenerateUnionCodeFormData[K]) {
    setLocalError(null);
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

  async function handleGenerate() {
    if (!form.role) {
      setLocalError('Selecciona el rol que tendrá el usuario.');
      return;
    }

    const response = await onGenerate(form);
    if (response?.codigo) {
      setGeneratedCode(response);
    }
  }

  async function handleShare() {
    if (!generatedCode?.codigo) return;
    await Share.share({
      title: 'Código de unión a liga',
      message: `Usa este código para unirte a la liga: ${generatedCode.codigo}`,
    });
    setCopiedFeedback(true);
    setTimeout(() => setCopiedFeedback(false), 1800);
  }

  async function handleDelete() {
    if (!generatedCode?.codigo || !onDeleteCode) return;
    const success = await onDeleteCode(generatedCode.codigo);
    if (success) {
      setGeneratedCode(null);
      setForm(EMPTY_FORM);
    }
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
              maxHeight: '92%',
            }}
          >
            <View className="px-6 pt-5 pb-4 flex-row items-start justify-between">
              <View style={{ flex: 1 }}>
                <Text style={{ color: Colors.text.primary, fontSize: theme.fontSize.xxl, fontWeight: '800' }}>
                  {generatedCode ? 'Código generado' : 'Generar código'}
                </Text>
                <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm, marginTop: 6 }}>
                  Crea un código para que otra persona se una a esta liga con un rol concreto.
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

            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
              {generatedCode ? (
                <View>
                  <View
                    className="items-center rounded-3xl p-6 mb-5"
                    style={{
                      backgroundColor: 'rgba(196,241,53,0.10)',
                      borderWidth: 1,
                      borderColor: 'rgba(196,241,53,0.35)',
                    }}
                  >
                    <Ionicons name="key-outline" size={32} color={Colors.brand.primary} />
                    <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm, marginTop: 12 }}>Código de unión</Text>
                    <Text
                      selectable
                      style={{
                        color: Colors.brand.primary,
                        fontSize: 34,
                        fontWeight: '900',
                        letterSpacing: 3,
                        marginTop: 8,
                      }}
                    >
                      {generatedCode.codigo}
                    </Text>
                    {expiration ? (
                      <Text style={{ color: Colors.text.disabled, fontSize: theme.fontSize.xs, marginTop: 10 }}>
                        Válido hasta: {expiration}
                      </Text>
                    ) : null}
                  </View>

                  {copiedFeedback ? (
                    <View className="flex-row items-center rounded-2xl p-3 mb-4" style={{ backgroundColor: 'rgba(50,215,75,0.12)' }}>
                      <Ionicons name="checkmark-circle-outline" size={18} color={Colors.semantic.success} />
                      <Text style={{ color: Colors.semantic.success, fontSize: theme.fontSize.sm, marginLeft: 8 }}>
                        Código listo para compartir.
                      </Text>
                    </View>
                  ) : null}

                  {(error || localError) ? (
                    <View
                      className="flex-row items-start rounded-2xl p-4 mb-4"
                      style={{ backgroundColor: 'rgba(255,69,52,0.10)', borderWidth: 1, borderColor: 'rgba(255,69,52,0.35)' }}
                    >
                      <Ionicons name="alert-circle-outline" size={20} color={Colors.semantic.error} />
                      <Text style={{ flex: 1, color: Colors.semantic.error, fontSize: theme.fontSize.sm, marginLeft: 10 }}>
                        {localError ?? error}
                      </Text>
                    </View>
                  ) : null}

                  <View className="flex-row" style={{ gap: 12 }}>
                    <TouchableOpacity
                      onPress={handleShare}
                      className="flex-1 flex-row items-center justify-center rounded-2xl"
                      style={{ height: 54, backgroundColor: Colors.brand.primary }}
                    >
                      <Ionicons name="share-social-outline" size={18} color="#000" />
                      <Text style={{ color: '#000', fontSize: theme.fontSize.md, fontWeight: '900', marginLeft: 8 }}>
                        Compartir
                      </Text>
                    </TouchableOpacity>

                    {onDeleteCode ? (
                      <TouchableOpacity
                        onPress={handleDelete}
                        disabled={isSubmitting}
                        className="items-center justify-center rounded-2xl"
                        style={{ width: 58, height: 54, backgroundColor: 'rgba(255,69,52,0.12)' }}
                      >
                        <Ionicons name="trash-outline" size={20} color={Colors.semantic.error} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              ) : (
                <View>
                  <View className="rounded-2xl p-4 mb-5" style={{ backgroundColor: Colors.bg.surface2 }}>
                    <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm, lineHeight: 20 }}>
                      El usuario introducirá este código desde “Unirme a una liga”. El rol, equipo y datos de jugador se aplicarán automáticamente.
                    </Text>
                  </View>

                  {(error || localError) ? (
                    <View
                      className="flex-row items-start rounded-2xl p-4 mb-5"
                      style={{ backgroundColor: 'rgba(255,69,52,0.10)', borderWidth: 1, borderColor: 'rgba(255,69,52,0.35)' }}
                    >
                      <Ionicons name="alert-circle-outline" size={20} color={Colors.semantic.error} />
                      <Text style={{ flex: 1, color: Colors.semantic.error, fontSize: theme.fontSize.sm, marginLeft: 10 }}>
                        {localError ?? error}
                      </Text>
                    </View>
                  ) : null}

                  <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm, marginBottom: 10 }}>Rol del código</Text>
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

                  {needsTeam ? (
                    <View className="mb-5">
                      <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm, marginBottom: 10 }}>Equipo asignado</Text>
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
                      onPress={handleGenerate}
                      disabled={isSubmitting}
                      className="flex-1 flex-row items-center justify-center rounded-2xl"
                      style={{ height: 54, backgroundColor: Colors.brand.primary, opacity: isSubmitting ? 0.65 : 1 }}
                    >
                      {isSubmitting ? <ActivityIndicator color="#000" /> : <Ionicons name="key-outline" size={18} color="#000" />}
                      <Text style={{ color: '#000', fontSize: theme.fontSize.md, fontWeight: '900', marginLeft: 8 }}>
                        {isSubmitting ? 'Generando' : 'Generar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
