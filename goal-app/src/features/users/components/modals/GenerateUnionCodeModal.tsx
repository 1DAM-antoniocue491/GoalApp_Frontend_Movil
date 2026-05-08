/** Modal React Native para generar códigos de unión. No importa servicios web. */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import { getRoleBadgeConfig } from '@/src/shared/utils/roles';
import type { GenerateUnionCodeFormData, SelectOption, UnionCodeResponse, UserRole } from '../../types/users.types';
import { PlayerExtraFields } from './PlayerExtraFields';

interface GenerateUnionCodeModalProps {
  visible: boolean;
  onClose: () => void;
  onGenerate: (data: GenerateUnionCodeFormData) => Promise<UnionCodeResponse | null>;
  onDelete?: (codigo: string) => Promise<boolean>;
  roleOptions: SelectOption[];
  teamOptions: SelectOption[];
  isSubmitting?: boolean;
  error?: string | null;
}

const EMPTY_FORM: GenerateUnionCodeFormData = {
  role: '',
  teamId: '',
  playerType: 'normal',
  jersey: '',
  position: '',
};

export function GenerateUnionCodeModal({
  visible,
  onClose,
  onGenerate,
  onDelete,
  roleOptions,
  teamOptions,
  isSubmitting = false,
  error,
}: GenerateUnionCodeModalProps) {
  const [form, setForm] = useState<GenerateUnionCodeFormData>(EMPTY_FORM);
  const [generatedCode, setGeneratedCode] = useState<UnionCodeResponse | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (visible) {
      setForm(EMPTY_FORM);
      setGeneratedCode(null);
      setLocalError(null);
      setDeleting(false);
    }
  }, [visible]);

  function handleChange(field: keyof GenerateUnionCodeFormData, value: string) {
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
    setGeneratedCode(null);
    setLocalError(null);
  }

  async function handleGenerate() {
    setLocalError(null);
    setGeneratedCode(null);

    if (!form.role) return setLocalError('Selecciona un rol para generar el código.');

    const code = await onGenerate(form);
    if (code) setGeneratedCode(code);
  }

  async function handleShare() {
    if (!generatedCode?.codigo) return;
    await Share.share({
      title: 'Código de unión a liga',
      message: `Únete a la liga usando este código: ${generatedCode.codigo}`,
    });
  }

  async function handleDelete() {
    if (!generatedCode?.codigo || !onDelete) return;
    setDeleting(true);
    const ok = await onDelete(generatedCode.codigo);
    setDeleting(false);
    if (ok) setGeneratedCode(null);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={modalStyles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable>
            <View style={modalStyles.sheet}>
              <View className="flex-row items-start justify-between mb-4">
                <View style={{ flex: 1 }}>
                  <Text style={modalStyles.title}>{generatedCode ? 'Código generado' : 'Código de unión'}</Text>
                  <Text style={modalStyles.subtitle}>Genera un código para que otra persona se una desde onboarding.</Text>
                </View>
                <TouchableOpacity onPress={onClose} disabled={isSubmitting || deleting} hitSlop={12} style={modalStyles.closeButton}>
                  <Ionicons name="close" size={22} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {!generatedCode ? (
                  <>
                    <Text style={modalStyles.sectionLabel}>Rol que recibirá el usuario</Text>
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

                    <PlayerExtraFields
                      role={form.role}
                      teamId={form.teamId}
                      playerType={form.playerType}
                      jersey={form.jersey}
                      position={form.position}
                      teamOptions={teamOptions}
                      onChange={(field, value) => handleChange(field, value)}
                    />
                  </>
                ) : (
                  <View style={modalStyles.codeCard}>
                    <Text style={modalStyles.codeLabel}>Código de unión</Text>
                    <Text style={modalStyles.codeText} selectable>{generatedCode.codigo}</Text>
                    <Text style={modalStyles.codeHint}>Mantén pulsado el código para copiarlo o compártelo desde el botón.</Text>

                    {(generatedCode.expira_en || generatedCode.expiracion) ? (
                      <Text style={modalStyles.expiration}>Expira: {generatedCode.expira_en ?? generatedCode.expiracion}</Text>
                    ) : null}

                    <View className="flex-row gap-3 mt-4">
                      <TouchableOpacity style={modalStyles.secondaryAction} onPress={handleShare} activeOpacity={0.85}>
                        <Ionicons name="share-social-outline" size={17} color={Colors.text.primary} />
                        <Text style={modalStyles.secondaryActionText}>Compartir</Text>
                      </TouchableOpacity>

                      {onDelete ? (
                        <TouchableOpacity style={modalStyles.dangerAction} onPress={handleDelete} disabled={deleting} activeOpacity={0.85}>
                          {deleting ? <ActivityIndicator color={Colors.semantic.error} /> : <Ionicons name="trash-outline" size={17} color={Colors.semantic.error} />}
                          <Text style={modalStyles.dangerActionText}>{deleting ? 'Eliminando...' : 'Eliminar'}</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                )}

                {(localError || error) ? (
                  <View style={modalStyles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={18} color={Colors.semantic.error} />
                    <Text style={modalStyles.errorText}>{localError || error}</Text>
                  </View>
                ) : null}
              </ScrollView>

              <View className="flex-row gap-3 mt-4">
                <TouchableOpacity onPress={onClose} disabled={isSubmitting || deleting} style={modalStyles.secondaryButton}>
                  <Text style={modalStyles.secondaryText}>Cerrar</Text>
                </TouchableOpacity>
                {!generatedCode ? (
                  <TouchableOpacity onPress={handleGenerate} disabled={isSubmitting} style={modalStyles.primaryButton}>
                    {isSubmitting ? <ActivityIndicator color="#000" style={{ marginRight: 8 }} /> : null}
                    <Text style={modalStyles.primaryText}>{isSubmitting ? 'Generando...' : 'Generar'}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

export default GenerateUnionCodeModal;

const modalStyles = {
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' as const },
  sheet: { maxHeight: '90%' as const, backgroundColor: Colors.bg.surface1, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  title: { color: Colors.text.primary, fontSize: theme.fontSize.xxl, fontWeight: '900' as const },
  subtitle: { color: Colors.text.secondary, fontSize: theme.fontSize.sm, marginTop: 6, lineHeight: 20 },
  closeButton: { width: 48, height: 48, borderRadius: 18, backgroundColor: Colors.bg.surface2, alignItems: 'center' as const, justifyContent: 'center' as const },
  sectionLabel: { color: Colors.text.secondary, fontSize: theme.fontSize.sm, marginBottom: 10 },
  roleButton: { flexDirection: 'row' as const, alignItems: 'center' as const, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: Colors.bg.surface2, gap: 8 },
  roleText: { color: Colors.text.primary, fontSize: theme.fontSize.sm, fontWeight: '800' as const },
  codeCard: { backgroundColor: Colors.bg.surface2, borderRadius: 22, borderWidth: 1, borderColor: Colors.brand.primary, padding: theme.spacing.lg, marginBottom: theme.spacing.lg },
  codeLabel: { color: Colors.text.secondary, fontSize: theme.fontSize.xs, marginBottom: 6 },
  codeText: { color: Colors.brand.primary, fontSize: theme.fontSize.xxxl, fontWeight: '900' as const, letterSpacing: 2, textAlign: 'center' as const, marginVertical: theme.spacing.sm },
  codeHint: { color: Colors.text.secondary, fontSize: theme.fontSize.sm, lineHeight: 20, textAlign: 'center' as const },
  expiration: { color: Colors.text.disabled, fontSize: theme.fontSize.xs, textAlign: 'center' as const, marginTop: theme.spacing.sm },
  secondaryAction: { flex: 1, height: 44, borderRadius: 14, backgroundColor: Colors.bg.base, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 6 },
  secondaryActionText: { color: Colors.text.primary, fontSize: theme.fontSize.sm, fontWeight: '800' as const },
  dangerAction: { flex: 1, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,69,52,0.10)', flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 6 },
  dangerActionText: { color: Colors.semantic.error, fontSize: theme.fontSize.sm, fontWeight: '800' as const },
  errorBox: { flexDirection: 'row' as const, gap: 8, borderWidth: 1, borderColor: 'rgba(255,69,52,0.35)', backgroundColor: 'rgba(255,69,52,0.10)', borderRadius: 16, padding: theme.spacing.md, marginBottom: theme.spacing.md },
  errorText: { flex: 1, color: Colors.semantic.error, fontSize: theme.fontSize.sm },
  secondaryButton: { flex: 1, height: 52, borderRadius: 18, backgroundColor: Colors.bg.surface2, alignItems: 'center' as const, justifyContent: 'center' as const },
  secondaryText: { color: Colors.text.primary, fontSize: theme.fontSize.sm, fontWeight: '800' as const },
  primaryButton: { flex: 1.25, height: 52, borderRadius: 18, backgroundColor: Colors.brand.primary, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const },
  primaryText: { color: '#000', fontSize: theme.fontSize.sm, fontWeight: '900' as const },
};
