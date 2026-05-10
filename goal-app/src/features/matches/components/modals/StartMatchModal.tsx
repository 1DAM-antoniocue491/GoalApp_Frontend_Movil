/**
 * StartMatchModal.tsx
 *
 * Modal de confirmación para iniciar un partido programado.
 *
 * Muestra:
 * - Enfrentamiento (local vs visitante)
 * - Fecha, hora y estadio del partido
 * - Botón de confirmación de inicio
 *
 * Al confirmar, el partido pasa de estado 'programmed' a 'live'.
 *
 * PREPARADO PARA API:
 * onConfirm conectará con PATCH /matches/:id/start
 * que cambia el estado del partido a 'live' y registra la hora de inicio.
 */

import React, { useRef, useEffect, memo } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

/** Datos del partido programado necesarios para el modal */
export interface ProgrammedMatchContext {
  id: string;
  homeTeam: string;
  awayTeam: string;
  /** DD/MM/AAAA */
  date?: string;
  /** HH:MM */
  time?: string;
  venue?: string;
}

interface StartMatchModalProps {
  visible: boolean;
  match: ProgrammedMatchContext | null;
  onConfirm: () => void;
  onCancel: () => void;
  /** Evita dobles toques y bloquea cierre mientras se inicia el partido. */
  submitting?: boolean;
}

// ---------------------------------------------------------------------------
// Sub-componente: fila de dato del partido
// ---------------------------------------------------------------------------

function MatchDetailRow({
  icon,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: Colors.bg.surface2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={15} color={Colors.text.secondary} />
      </View>
      <Text style={{ color: Colors.text.secondary, fontSize: theme.fontSize.sm }}>
        {value}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

function StartMatchModalComponent({
  visible,
  match,
  onConfirm,
  onCancel,
  submitting = false,
}: StartMatchModalProps) {
  const slideAnim = useRef(new Animated.Value(350)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 280,
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
          toValue: 350,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacityAnim, slideAnim]);

  const handleConfirm = () => {
    if (submitting) return;
    onConfirm();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={submitting ? () => undefined : onCancel}
    >
      <Animated.View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0,0,0,0.65)',
          opacity: opacityAnim,
        }}
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
          {/* Handle */}
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: Colors.bg.surface2,
              alignSelf: 'center',
              marginBottom: 20,
            }}
          />

          {/* Icono de inicio */}
          <View
            style={{
              width: 68,
              height: 68,
              borderRadius: 34,
              backgroundColor: Colors.brand.primary + '18',
              borderWidth: 1,
              borderColor: Colors.brand.primary + '30',
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              marginBottom: 18,
            }}
          >
            <Ionicons name="play-circle" size={34} color={Colors.brand.primary} />
          </View>

          <Text
            style={{
              color: Colors.text.primary,
              fontSize: 22,
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: 6,
            }}
          >
            Iniciar partido
          </Text>
          <Text
            style={{
              color: Colors.text.secondary,
              fontSize: 13,
              textAlign: 'center',
              marginBottom: 24,
              lineHeight: 18,
            }}
          >
            El partido pasará a estado{' '}
            <Text style={{ color: Colors.brand.primary, fontWeight: '600' }}>EN VIVO</Text>
            {' '}inmediatamente.
          </Text>

          {/* Enfrentamiento */}
          {match && (
            <View
              style={{
                backgroundColor: Colors.bg.surface2,
                borderRadius: theme.borderRadius.lg,
                padding: 18,
                marginBottom: 20,
                gap: 14,
              }}
            >
              {/* Teams */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 4,
                }}
              >
                <Text
                  style={{
                    color: Colors.text.primary,
                    fontSize: 15,
                    fontWeight: '700',
                    flex: 1,
                    textAlign: 'center',
                  }}
                  numberOfLines={2}
                >
                  {match.homeTeam}
                </Text>
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: theme.borderRadius.full,
                    backgroundColor: Colors.bg.surface1,
                    marginHorizontal: 8,
                  }}
                >
                  <Text
                    style={{
                      color: Colors.text.disabled,
                      fontSize: 12,
                      fontWeight: '700',
                      letterSpacing: 1,
                    }}
                  >
                    VS
                  </Text>
                </View>
                <Text
                  style={{
                    color: Colors.text.primary,
                    fontSize: 15,
                    fontWeight: '700',
                    flex: 1,
                    textAlign: 'center',
                  }}
                  numberOfLines={2}
                >
                  {match.awayTeam}
                </Text>
              </View>

              {/* Separador */}
              <View style={{ height: 1, backgroundColor: Colors.bg.surface1 }} />

              {/* Detalles del partido */}
              <View style={{ gap: 10 }}>
                {(match.date || match.time) && (
                  <MatchDetailRow
                    icon="calendar-outline"
                    value={[match.date, match.time].filter(Boolean).join(' · ')}
                  />
                )}
                {match.venue && (
                  <MatchDetailRow icon="location-outline" value={match.venue} />
                )}
              </View>
            </View>
          )}

          {/* Botones */}
          <View style={{ gap: 10 }}>
            <TouchableOpacity
              disabled={submitting}
              onPress={handleConfirm}
              activeOpacity={0.88}
              style={{
                height: 56,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: submitting ? Colors.bg.surface2 : Colors.brand.primary,
                flexDirection: 'row',
                gap: 8,
              }}
            >
              <Ionicons name={submitting ? 'hourglass-outline' : 'play-circle-outline'} size={20} color={submitting ? Colors.text.disabled : Colors.bg.base} />
              <Text
                style={{
                  color: submitting ? Colors.text.disabled : Colors.bg.base,
                  fontSize: 16,
                  fontWeight: '700',
                }}
              >
                {submitting ? 'Iniciando...' : 'Iniciar partido'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={submitting}
              onPress={onCancel}
              activeOpacity={0.7}
              style={{ paddingVertical: 12, alignItems: 'center', opacity: submitting ? 0.45 : 1 }}
            >
              <Text
                style={{
                  color: Colors.text.secondary,
                  fontSize: 15,
                  fontWeight: '500',
                }}
              >
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export const StartMatchModal = memo(StartMatchModalComponent);
