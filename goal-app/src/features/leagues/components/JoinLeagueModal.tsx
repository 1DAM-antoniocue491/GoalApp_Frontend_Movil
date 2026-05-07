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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';

interface JoinLeagueModalProps {
  visible: boolean;
  onConfirm: (code: string) => void | Promise<void>;
  onCancel: () => void;
  errorMessage?: string | null;
}

function JoinLeagueModalComponent({ visible, onConfirm, onCancel, errorMessage }: JoinLeagueModalProps) {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const slideAnim = useRef(new Animated.Value(100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setCode('');
      setSubmitting(false);
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
        Animated.timing(opacityAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 100, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, opacityAnim, slideAnim]);

  const normalizedPreview = code.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const isValid = /^[A-Z0-9]{6,12}$/.test(normalizedPreview);

  const handleConfirm = useCallback(async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    await onConfirm(normalizedPreview);
    setSubmitting(false);
  }, [isValid, submitting, normalizedPreview, onConfirm]);

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Animated.View
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)', opacity: opacityAnim }}
        >
          <Pressable style={{ flex: 1 }} onPress={submitting ? undefined : onCancel} />

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
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.bg.surface2, alignSelf: 'center', marginBottom: 24 }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: Colors.text.primary, fontSize: 24, fontWeight: '800' }}>Unirme a una liga</Text>
              <TouchableOpacity
                onPress={submitting ? undefined : onCancel}
                style={{ height: 42, width: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg.surface2 }}
              >
                <Ionicons name="close" size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: Colors.text.secondary, fontSize: 15, lineHeight: 22, marginBottom: 18 }}>
              Introduce el código de unión que te ha compartido el administrador de la liga.
            </Text>

            {errorMessage ? (
              <View style={{ borderRadius: 14, borderWidth: 1, borderColor: Colors.semantic.error, backgroundColor: 'rgba(255,69,52,0.10)', padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="alert-circle-outline" size={18} color={Colors.semantic.error} style={{ marginRight: 8 }} />
                <Text style={{ color: Colors.semantic.error, flex: 1 }}>{errorMessage}</Text>
              </View>
            ) : null}

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 16,
                borderWidth: 1.5,
                paddingHorizontal: 16,
                height: 58,
                marginBottom: 10,
                backgroundColor: Colors.bg.base,
                borderColor: code.length > 0 ? Colors.brand.primary : Colors.bg.surface2,
              }}
            >
              <Ionicons name="key-outline" size={20} color={code.length > 0 ? Colors.brand.primary : Colors.text.disabled} style={{ marginRight: 12 }} />
              <TextInput
                style={{ flex: 1, color: Colors.text.primary, fontSize: 16, fontWeight: '700', letterSpacing: 2 }}
                placeholder="ABC123"
                placeholderTextColor={Colors.text.disabled}
                value={code}
                onChangeText={setCode}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              {code.length > 0 ? (
                <TouchableOpacity onPress={() => setCode('')}>
                  <Ionicons name="close-circle" size={20} color={Colors.text.disabled} />
                </TouchableOpacity>
              ) : null}
            </View>

            <Text style={{ color: Colors.text.disabled, fontSize: theme.fontSize.xs, lineHeight: 18, marginBottom: 26 }}>
              El código debe tener entre 6 y 12 caracteres alfanuméricos.
            </Text>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={submitting ? undefined : onCancel}
                style={{ flex: 1, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg.surface2 }}
              >
                <Text style={{ color: Colors.text.secondary, fontSize: 15, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={isValid ? 0.88 : 1}
                onPress={handleConfirm}
                disabled={!isValid || submitting}
                style={{
                  flex: 2,
                  height: 56,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isValid ? Colors.brand.primary : `${Colors.brand.primary}40`,
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                <Text style={{ color: '#0A0A0C', fontSize: 15, fontWeight: '800', opacity: isValid ? 1 : 0.5 }}>
                  {submitting ? 'Uniendo...' : 'Unirme a la liga'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#0A0A0C" style={{ opacity: isValid ? 1 : 0.5 }} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export const JoinLeagueModal = memo(JoinLeagueModalComponent);
