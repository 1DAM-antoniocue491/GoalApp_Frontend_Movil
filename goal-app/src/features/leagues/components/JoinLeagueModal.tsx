import React, { useRef, useCallback, useEffect, useState, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';

interface JoinLeagueModalProps {
  visible: boolean;
  onConfirm: (code: string) => void | Promise<boolean>;
  onCancel: () => void;
  /** Error devuelto por useLeagues/joinLeagueByCode. */
  errorMessage?: string | null;
  /** Estado de envío para bloquear doble submit. */
  submitting?: boolean;
}

function normalizeCodeInput(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

function JoinLeagueModalComponent({
  visible,
  onConfirm,
  onCancel,
  errorMessage,
  submitting = false,
}: JoinLeagueModalProps) {
  const [code, setCode] = useState('');
  const slideAnim = useRef(new Animated.Value(100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setCode('');
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.back(1.05)),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 100,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacityAnim, slideAnim]);

  const normalizedCode = code.trim();
  const isValid = /^[A-Z0-9]{6,12}$/.test(normalizedCode);
  const canSubmit = isValid && !submitting;

  const handleChangeCode = useCallback((value: string) => {
    setCode(normalizeCodeInput(value));
  }, []);

  const handleConfirm = useCallback(() => {
    if (!canSubmit) return;
    onConfirm(normalizedCode);
  }, [canSubmit, normalizedCode, onConfirm]);

  const handleCancel = useCallback(() => {
    if (!submitting) onCancel();
  }, [onCancel, submitting]);

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.65)',
            opacity: opacityAnim,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={handleCancel} />

          <Animated.View
            style={{
              transform: [{ translateY: slideAnim }],
              backgroundColor: Colors.bg.surface1,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              paddingHorizontal: 24,
              paddingTop: 12,
              paddingBottom: 40,
              borderWidth: 1,
              borderColor: Colors.bg.surface2,
            }}
          >
            {/* Handle del bottom sheet. */}
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: Colors.bg.surface2,
                alignSelf: 'center',
                marginBottom: 24,
              }}
            />

            {/* Header del modal. */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <Text style={{ color: Colors.text.primary, fontSize: 22, fontWeight: '700' }}>
                Unirme a una liga
              </Text>
              <TouchableOpacity
                onPress={handleCancel}
                disabled={submitting}
                style={{
                  height: 36,
                  width: 36,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: Colors.bg.surface2,
                  opacity: submitting ? 0.5 : 1,
                }}
              >
                <Ionicons name="close" size={18} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <Text
              style={{
                color: Colors.text.secondary,
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 18,
              }}
            >
              Introduce el código de unión que te ha compartido el administrador de la liga.
            </Text>

            {errorMessage ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  borderWidth: 1,
                  borderColor: `${Colors.semantic.error}66`,
                  backgroundColor: `${Colors.semantic.error}14`,
                  borderRadius: 14,
                  padding: theme.spacing.md,
                  marginBottom: 16,
                }}
              >
                <Ionicons name="alert-circle-outline" size={20} color={Colors.semantic.error} />
                <Text style={{ flex: 1, color: Colors.semantic.error, fontSize: theme.fontSize.sm }}>
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {/* Código de unión. Se normaliza igual que web: alfanumérico en mayúsculas. */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 16,
                borderWidth: 1.5,
                paddingHorizontal: 16,
                height: 58,
                marginBottom: 8,
                backgroundColor: Colors.bg.base,
                borderColor: code.length > 0 ? Colors.brand.primary : Colors.bg.surface2,
              }}
            >
              <Ionicons
                name="key-outline"
                size={20}
                color={code.length > 0 ? Colors.brand.primary : Colors.text.disabled}
                style={{ marginRight: 12 }}
              />
              <TextInput
                style={{
                  flex: 1,
                  color: Colors.text.primary,
                  fontSize: 16,
                  fontWeight: '700',
                  letterSpacing: 2,
                }}
                placeholder="ABC12345"
                placeholderTextColor={Colors.text.disabled}
                value={code}
                onChangeText={handleChangeCode}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!submitting}
                maxLength={12}
              />
              {code.length > 0 && !submitting ? (
                <TouchableOpacity onPress={() => setCode('')}>
                  <Ionicons name="close-circle" size={20} color={Colors.text.disabled} />
                </TouchableOpacity>
              ) : null}
            </View>

            <Text
              style={{
                color: Colors.text.disabled,
                fontSize: theme.fontSize.xs,
                lineHeight: 18,
                marginBottom: 24,
              }}
            >
              El código debe tener entre 6 y 12 caracteres alfanuméricos.
            </Text>

            {/* Acciones del modal. */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={handleCancel}
                disabled={submitting}
                style={{
                  flex: 1,
                  height: 56,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: Colors.bg.surface2,
                  opacity: submitting ? 0.5 : 1,
                }}
              >
                <Text style={{ color: Colors.text.secondary, fontSize: 15, fontWeight: '600' }}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={canSubmit ? 0.88 : 1}
                onPress={handleConfirm}
                disabled={!canSubmit}
                style={{
                  flex: 2,
                  height: 56,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: canSubmit ? Colors.brand.primary : `${Colors.brand.primary}40`,
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#0A0A0C" />
                ) : (
                  <>
                    <Text
                      style={{
                        color: '#0A0A0C',
                        fontSize: 15,
                        fontWeight: '700',
                        opacity: canSubmit ? 1 : 0.5,
                      }}
                    >
                      Unirme a la liga
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color="#0A0A0C"
                      style={{ opacity: canSubmit ? 1 : 0.5 }}
                    />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export const JoinLeagueModal = memo(JoinLeagueModalComponent);
