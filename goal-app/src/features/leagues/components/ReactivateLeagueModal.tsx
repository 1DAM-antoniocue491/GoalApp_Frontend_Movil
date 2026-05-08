import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';

interface ReactivateLeagueModalProps {
  visible: boolean;
  leagueName: string;
  /**
   * La reactivación real debe vivir fuera del modal.
   * El modal solo confirma la acción y evita dobles pulsaciones mientras se resuelve.
   */
  onConfirm: () => void | Promise<void> | Promise<boolean> | boolean;
  onCancel: () => void;
  /** Estado de carga externo opcional por si el padre ya controla la petición a la API. */
  isSubmitting?: boolean;
  /** Mensaje opcional para mostrar errores sin cerrar el modal. */
  errorMessage?: string | null;
}

function ReactivateLeagueModalComponent({
  visible,
  leagueName,
  onConfirm,
  onCancel,
  isSubmitting = false,
  errorMessage = null,
}: ReactivateLeagueModalProps) {
  const slideAnim = useRef(new Animated.Value(80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [localSubmitting, setLocalSubmitting] = useState(false);

  const submitting = isSubmitting || localSubmitting;
  const safeLeagueName = leagueName?.trim() || 'esta liga';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: visible ? 1 : 0,
        duration: visible ? 220 : 180,
        easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: visible ? 0 : 80,
        duration: visible ? 280 : 200,
        easing: visible ? Easing.out(Easing.back(1.1)) : Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, opacityAnim, slideAnim]);

  useEffect(() => {
    if (!visible) {
      setLocalSubmitting(false);
    }
  }, [visible]);

  const handleConfirm = useCallback(async () => {
    if (submitting) return;

    try {
      setLocalSubmitting(true);
      await onConfirm();
      /**
       * No cerramos aquí de forma forzada.
       * El padre debe cerrar el modal solo cuando la API confirme la reactivación
       * y después de refrescar la lista de ligas desde backend.
       */
    } finally {
      setLocalSubmitting(false);
    }
  }, [onConfirm, submitting]);

  const handleCancel = useCallback(() => {
    if (submitting) return;
    onCancel();
  }, [onCancel, submitting]);

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
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
            paddingHorizontal: theme.spacing.xl,
            paddingTop: theme.spacing.md,
            paddingBottom: 40,
            borderWidth: 1,
            borderColor: Colors.bg.surface2,
          }}
        >
          {/* Handle visual del bottom sheet. */}
          <View
            style={{
              width: 42,
              height: 4,
              borderRadius: 2,
              backgroundColor: Colors.bg.surface2,
              alignSelf: 'center',
              marginBottom: 28,
            }}
          />

          {/* Icono principal: comunica que la liga volverá a estar disponible. */}
          <View
            style={{
              height: 72,
              width: 72,
              borderRadius: 36,
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              marginBottom: theme.spacing.xl,
              backgroundColor: `${Colors.brand.primary}18`,
              borderWidth: 1,
              borderColor: `${Colors.brand.primary}30`,
            }}
          >
            <Ionicons name="refresh" size={34} color={Colors.brand.primary} />
          </View>

          <Text
            style={{
              color: Colors.text.primary,
              fontSize: theme.fontSize.xxl,
              fontWeight: '800',
              lineHeight: 30,
              textAlign: 'center',
              marginBottom: theme.spacing.md,
            }}
          >
            Reactivar liga
          </Text>

          <Text
            style={{
              color: Colors.text.secondary,
              fontSize: theme.fontSize.sm,
              lineHeight: 22,
              textAlign: 'center',
              marginBottom: theme.spacing.lg,
              paddingHorizontal: theme.spacing.sm,
            }}
          >
            Vas a reactivar{' '}
            <Text style={{ color: Colors.text.primary, fontWeight: '700' }}>
              {safeLeagueName}
            </Text>
            . Cuando la API confirme el cambio, la liga volverá a aparecer como activa y el botón pasará a ser Entrar.
          </Text>

          {errorMessage ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.sm,
                backgroundColor: `${Colors.semantic.error}14`,
                borderColor: `${Colors.semantic.error}35`,
                borderWidth: 1,
                borderRadius: theme.borderRadius.xl,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.lg,
              }}
            >
              <Ionicons name="alert-circle-outline" size={18} color={Colors.semantic.error} />
              <Text style={{ color: Colors.semantic.error, flex: 1, fontSize: theme.fontSize.sm }}>
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {/* Acción confirmada: se bloquea durante la petición para evitar dobles taps. */}
          <TouchableOpacity
            activeOpacity={0.88}
            disabled={submitting}
            onPress={handleConfirm}
            style={{
              height: 58,
              borderRadius: theme.borderRadius.xl,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: submitting ? Colors.text.disabled : Colors.brand.primary,
              marginBottom: theme.spacing.md,
              flexDirection: 'row',
              gap: theme.spacing.sm,
            }}
          >
            <Ionicons
              name={submitting ? 'hourglass-outline' : 'refresh-outline'}
              size={20}
              color={Colors.bg.base}
            />
            <Text style={{ color: Colors.bg.base, fontSize: theme.fontSize.md, fontWeight: '800' }}>
              {submitting ? 'Reactivando...' : 'Sí, reactivar liga'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            disabled={submitting}
            onPress={handleCancel}
            style={{
              height: 52,
              borderRadius: theme.borderRadius.xl,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: submitting ? 0.45 : 1,
            }}
          >
            <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.md, fontWeight: '600' }}>
              Cancelar
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export const ReactivateLeagueModal = memo(ReactivateLeagueModalComponent);
