import React, { useRef, useCallback, useEffect, useState, memo } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Animated, Easing, Pressable,KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';

interface JoinLeagueModalProps {
  visible: boolean;
  onConfirm: (code: string) => void;
  onCancel: () => void;
}

function JoinLeagueModalComponent({ visible, onConfirm, onCancel }: JoinLeagueModalProps) {
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

  const handleConfirm = useCallback(() => {
    if (code.trim().length === 0) return;
    onConfirm(code.trim());
  }, [code, onConfirm]);

  const isValid = code.trim().length >= 3;

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
          <Pressable style={{ flex: 1 }} onPress={onCancel} />

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
            {/* Handle */}
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

            {/* Header row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: Colors.text.primary, fontSize: 22, fontWeight: '700' }}>
                Unirme a una liga
              </Text>
              <TouchableOpacity
                onPress={onCancel}
                style={{
                  height: 36,
                  width: 36,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: Colors.bg.surface2,
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
                marginBottom: 24,
              }}
            >
              Introduce tu código de invitación para acceder.
            </Text>

            {/* Code Input */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 16,
                borderWidth: 1.5,
                paddingHorizontal: 16,
                height: 58,
                marginBottom: 28,
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
                  fontWeight: '600',
                  letterSpacing: 1,
                }}
                placeholder="ABC-123-XYZ"
                placeholderTextColor={Colors.text.disabled}
                value={code}
                onChangeText={setCode}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              {code.length > 0 && (
                <TouchableOpacity onPress={() => setCode('')}>
                  <Ionicons name="close-circle" size={20} color={Colors.text.disabled} />
                </TouchableOpacity>
              )}
            </View>

            {/* Buttons */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={onCancel}
                style={{
                  flex: 1,
                  height: 56,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: Colors.bg.surface2,
                }}
              >
                <Text style={{ color: Colors.text.secondary, fontSize: 15, fontWeight: '600' }}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={isValid ? 0.88 : 1}
                onPress={handleConfirm}
                disabled={!isValid}
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
                <Text
                  style={{
                    color: '#0A0A0C',
                    fontSize: 15,
                    fontWeight: '700',
                    opacity: isValid ? 1 : 0.5,
                  }}
                >
                  Unirme a la liga
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color="#0A0A0C"
                  style={{ opacity: isValid ? 1 : 0.5 }}
                />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export const JoinLeagueModal = memo(JoinLeagueModalComponent);