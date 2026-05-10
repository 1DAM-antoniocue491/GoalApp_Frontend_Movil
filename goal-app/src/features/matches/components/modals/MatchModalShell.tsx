/**
 * MatchModalShell
 * Bottom sheet reutilizable para modales operativos de partido.
 *
 * React Native + Expo + NativeWind:
 * - usa Modal/KeyboardAvoidingView/ScrollView nativos;
 * - evita solapes con teclado, notch y navegación inferior;
 * - bloquea overlay/cierre cuando hay petición activa.
 */

import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';

interface MatchModalShellProps {
  visible: boolean;
  title: string;
  subtitle?: string | null;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  pending?: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function MatchModalShell({
  visible,
  title,
  subtitle,
  icon,
  iconColor = Colors.brand.primary,
  pending = false,
  onClose,
  children,
  footer,
}: MatchModalShellProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const closeIfIdle = () => {
    if (!pending) onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={closeIfIdle}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.68)' }}>
          <Pressable className="flex-1" disabled={pending} onPress={closeIfIdle} />

          <View
            className="overflow-hidden"
            style={{
              maxHeight: Math.max(420, height * 0.9),
              backgroundColor: Colors.bg.surface1,
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              borderWidth: 1,
              borderColor: Colors.bg.surface2,
              paddingBottom: Math.max(insets.bottom, 12),
            }}
          >
            <View
              style={{
                width: 42,
                height: 4,
                borderRadius: 2,
                backgroundColor: Colors.bg.surface2,
                alignSelf: 'center',
                marginTop: 10,
                marginBottom: 14,
              }}
            />

            <View className="px-5 pb-3 flex-row items-start" style={{ gap: 12 }}>
              {icon ? (
                <View
                  className="items-center justify-center"
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 21,
                    backgroundColor: `${iconColor}22`,
                    borderWidth: 1,
                    borderColor: `${iconColor}44`,
                  }}
                >
                  <Ionicons name={icon} size={21} color={iconColor} />
                </View>
              ) : null}

              <View className="flex-1">
                <Text
                  style={{
                    color: Colors.text.primary,
                    fontSize: 22,
                    lineHeight: 27,
                    fontWeight: '900',
                  }}
                >
                  {title}
                </Text>
                {subtitle ? (
                  <Text
                    numberOfLines={2}
                    style={{
                      color: Colors.text.secondary,
                      fontSize: theme.fontSize.sm,
                      lineHeight: 19,
                      marginTop: 3,
                    }}
                  >
                    {subtitle}
                  </Text>
                ) : null}
              </View>

              {pending ? <ActivityIndicator color={Colors.brand.primary} /> : null}
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 6,
                paddingBottom: footer ? 18 : 26,
              }}
            >
              {children}
            </ScrollView>

            {footer ? (
              <View
                className="px-5 pt-3"
                style={{
                  borderTopWidth: 1,
                  borderTopColor: Colors.bg.surface2,
                  backgroundColor: Colors.bg.surface1,
                }}
              >
                {footer}
              </View>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function MatchModalActions({ children }: { children: React.ReactNode }) {
  return <View className="flex-row" style={{ gap: 12 }}>{children}</View>;
}

interface MatchModalButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'danger' | 'warning' | 'secondary';
  icon?: keyof typeof Ionicons.glyphMap;
}

export function MatchModalButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'secondary',
  icon,
}: MatchModalButtonProps) {
  const isPrimary = variant === 'primary';
  const bg = disabled
    ? Colors.bg.surface2
    : variant === 'danger'
      ? Colors.semantic.error
      : variant === 'warning'
        ? Colors.semantic.warning
        : isPrimary
          ? Colors.brand.primary
          : Colors.bg.surface2;

  const textColor = disabled
    ? Colors.text.disabled
    : variant === 'secondary'
      ? Colors.text.primary
      : Colors.bg.base;

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      className="flex-1 flex-row items-center justify-center"
      style={{
        height: 54,
        borderRadius: 16,
        backgroundColor: bg,
        gap: 8,
        opacity: disabled ? 0.65 : 1,
      }}
    >
      {loading ? <ActivityIndicator color={textColor} /> : null}
      {!loading && icon ? <Ionicons name={icon} size={18} color={textColor} /> : null}
      <Text style={{ color: textColor, fontSize: 15, fontWeight: '900' }}>{label}</Text>
    </Pressable>
  );
}
