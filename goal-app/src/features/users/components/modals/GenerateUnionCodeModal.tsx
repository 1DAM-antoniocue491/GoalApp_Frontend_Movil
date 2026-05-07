/**
 * GenerateUnionCodeModal
 *
 * Genera códigos de unión mediante POST /invitaciones/ligas/{ligaId}/generar-codigo.
 * El código se muestra en pantalla para que pueda copiarse manualmente.
 */

import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/src/shared/components/ui/Button';
import { OptionSelectField, SelectOption } from '@/src/shared/components/ui/OptionSelectField';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import type { GenerateUnionCodeFormData, UnionCodeResponse, UserRole } from '../../types/users.types';
import { PlayerExtraFields } from './PlayerExtraFields';

interface GenerateUnionCodeModalProps {
  visible: boolean;
  onClose: () => void;
  onGenerate: (data: GenerateUnionCodeFormData) => Promise<UnionCodeResponse | null>;
  roleOptions: SelectOption[];
  teamOptions: SelectOption[];
  isSubmitting?: boolean;
  error?: string | null;
}

const EMPTY_FORM: GenerateUnionCodeFormData = {
  role: '',
  teamId: '',
  jersey: '',
  position: '',
};

export function GenerateUnionCodeModal({
  visible,
  onClose,
  onGenerate,
  roleOptions,
  teamOptions,
  isSubmitting = false,
  error,
}: GenerateUnionCodeModalProps) {
  const [form, setForm] = useState<GenerateUnionCodeFormData>(EMPTY_FORM);
  const [generatedCode, setGeneratedCode] = useState<UnionCodeResponse | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setForm(EMPTY_FORM);
      setGeneratedCode(null);
      setLocalError(null);
    }
  }, [visible]);

  function handleChange(field: keyof GenerateUnionCodeFormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleRoleChange(value: string) {
    setForm(prev => ({ ...prev, role: value as UserRole, teamId: '', jersey: '', position: '' }));
    setGeneratedCode(null);
  }

  async function handleGenerate() {
    setLocalError(null);
    setGeneratedCode(null);

    if (!form.role) return setLocalError('Selecciona un rol para generar el código');

    const code = await onGenerate(form);
    if (code) setGeneratedCode(code);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={modalStyles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable>
            <View style={modalStyles.sheet}>
              <View className="flex-row items-center justify-between mb-2">
                <Text style={modalStyles.title}>Código de unión</Text>
                <TouchableOpacity onPress={onClose} hitSlop={12}>
                  <Ionicons name="close" size={22} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <Text style={modalStyles.subtitle}>
                Genera un código para que un usuario pueda unirse a esta liga desde onboarding.
              </Text>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View className="mb-4">
                  <OptionSelectField
                    label="Rol del usuario"
                    value={form.role}
                    options={roleOptions}
                    placeholder="Selecciona un rol"
                    onChange={handleRoleChange}
                  />
                </View>

                <PlayerExtraFields
                  role={form.role}
                  teamId={form.teamId}
                  jersey={form.jersey}
                  position={form.position}
                  teamOptions={teamOptions}
                  onChange={(field, value) => handleChange(field as keyof GenerateUnionCodeFormData, value)}
                />

                {(localError || error) && <Text style={modalStyles.error}>{localError ?? error}</Text>}

                {generatedCode && (
                  <View style={modalStyles.codeCard}>
                    <Text style={modalStyles.codeLabel}>Código generado</Text>
                    <Text style={modalStyles.codeText} selectable>{generatedCode.codigo}</Text>
                    <Text style={modalStyles.codeHint}>
                      Comparte este código con el usuario. Podrá introducirlo manualmente para unirse.
                    </Text>
                    {(generatedCode.expira_en || generatedCode.expiracion) && (
                      <Text style={modalStyles.expiration}>
                        Expira: {generatedCode.expira_en ?? generatedCode.expiracion}
                      </Text>
                    )}
                  </View>
                )}
              </ScrollView>

              <View className="flex-row gap-3 mt-4">
                <View style={{ flex: 1 }}>
                  <Button label="Cerrar" variant="secondary" onPress={onClose} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    label={isSubmitting ? 'Generando...' : 'Generar'}
                    variant="primary"
                    onPress={handleGenerate}
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
  subtitle: {
    color: Colors.text.secondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 20,
    marginBottom: theme.spacing.xl,
  },
  error: {
    color: Colors.semantic.error,
    fontSize: theme.fontSize.sm,
    marginBottom: theme.spacing.md,
  },
  codeCard: {
    backgroundColor: Colors.bg.surface2,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.brand.primary,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  codeLabel: {
    color: Colors.text.secondary,
    fontSize: theme.fontSize.xs,
    marginBottom: 6,
  },
  codeText: {
    color: Colors.brand.primary,
    fontSize: theme.fontSize.xxxl,
    fontWeight: '800' as const,
    letterSpacing: 2,
    textAlign: 'center' as const,
    marginVertical: theme.spacing.sm,
  },
  codeHint: {
    color: Colors.text.secondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 20,
    textAlign: 'center' as const,
  },
  expiration: {
    color: Colors.text.disabled,
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.sm,
    textAlign: 'center' as const,
  },
};
