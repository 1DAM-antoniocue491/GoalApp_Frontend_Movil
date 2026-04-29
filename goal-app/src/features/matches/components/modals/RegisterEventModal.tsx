/**
 * RegisterEventModal.tsx
 *
 * Selector de tipo de evento para un partido en vivo.
 * Muestra 4 opciones: Gol, Tarjeta amarilla, Tarjeta roja, Sustitución.
 *
 * FASE 3: solo el selector de tipo. Los sub-formularios por tipo de evento
 * (jugador, minuto, equipo) se conectarán en Fase 4.
 *
 * PREPARADO PARA API:
 * onSelectEvent recibe el tipo; en Fase 4 se enriquecerá con el sub-formulario
 * antes de llamar a POST /matches/:id/events.
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

export type MatchEventType = 'goal' | 'yellow_card' | 'red_card' | 'substitution';

/** Datos mínimos del partido en vivo que se muestran en el modal */
export interface LiveMatchContext {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  /**
   * Plantilla del equipo local.
   * Vendrá de GET /matches/:id/squads cuando el API esté listo.
   * Si no se provee, los modales usan fallback mock.
   */
  homePlayers?: string[];
  /** Plantilla del equipo visitante. Mismo origen que homePlayers. */
  awayPlayers?: string[];
}

interface RegisterEventModalProps {
  visible: boolean;
  match: LiveMatchContext | null;
  /** Devuelve el tipo de evento seleccionado. En Fase 4: también los datos del evento */
  onSelectEvent: (type: MatchEventType) => void;
  onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Definición visual de cada tipo de evento
// ---------------------------------------------------------------------------

interface EventOption {
  type: MatchEventType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Color de acento para el tile */
  color: string;
}

const EVENT_OPTIONS: EventOption[] = [
  {
    type: 'goal',
    label: 'Gol',
    icon: 'football-outline',
    color: Colors.brand.primary,
  },
  {
    type: 'yellow_card',
    label: 'Tarjeta amarilla',
    icon: 'card-outline',
    color: Colors.semantic.warning,
  },
  {
    type: 'red_card',
    label: 'Tarjeta roja',
    icon: 'card-outline',
    color: Colors.semantic.error,
  },
  {
    type: 'substitution',
    label: 'Sustitución',
    icon: 'swap-horizontal-outline',
    color: Colors.brand.secondary,
  },
];

// ---------------------------------------------------------------------------
// Sub-componente: tile de evento
// ---------------------------------------------------------------------------

function EventTile({
  option,
  onPress,
}: {
  option: EventOption;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 20,
        borderRadius: theme.borderRadius.lg,
        backgroundColor: pressed
          ? option.color + '30'
          : option.color + '18',
        borderWidth: 1.5,
        borderColor: option.color + '40',
      })}
      accessibilityRole="button"
      accessibilityLabel={`Registrar ${option.label}`}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: option.color + '25',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={option.icon} size={22} color={option.color} />
      </View>
      <Text
        style={{
          color: Colors.text.primary,
          fontSize: theme.fontSize.sm,
          fontWeight: '600',
          textAlign: 'center',
        }}
      >
        {option.label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

function RegisterEventModalComponent({
  visible,
  match,
  onSelectEvent,
  onCancel,
}: RegisterEventModalProps) {
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

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
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
              marginBottom: 20,
            }}
          />

          {/* Cabecera: minuto + partido */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            {match && (
              <>
                {/* Badge de minuto */}
                <View
                  style={{
                    backgroundColor: Colors.brand.primary,
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: theme.borderRadius.full,
                    marginBottom: 10,
                  }}
                >
                  <Text
                    style={{
                      color: Colors.bg.base,
                      fontSize: 12,
                      fontWeight: '800',
                      letterSpacing: 0.5,
                    }}
                  >
                    {match.minute}'
                  </Text>
                </View>

                {/* Equipos y marcador */}
                <Text
                  style={{
                    color: Colors.text.primary,
                    fontSize: 20,
                    fontWeight: '700',
                    letterSpacing: -0.5,
                  }}
                >
                  {match.homeTeam} {match.homeScore} – {match.awayScore} {match.awayTeam}
                </Text>
              </>
            )}
            <Text
              style={{
                color: Colors.text.secondary,
                fontSize: 13,
                marginTop: 6,
              }}
            >
              ¿Qué evento quieres registrar?
            </Text>
          </View>

          {/* Grid 2x2 de tipos de evento */}
          <View style={{ gap: 10, marginBottom: 20 }}>
            {/* Fila 1 */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <EventTile
                option={EVENT_OPTIONS[0]}
                onPress={() => onSelectEvent(EVENT_OPTIONS[0].type)}
              />
              <EventTile
                option={EVENT_OPTIONS[1]}
                onPress={() => onSelectEvent(EVENT_OPTIONS[1].type)}
              />
            </View>
            {/* Fila 2 */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <EventTile
                option={EVENT_OPTIONS[2]}
                onPress={() => onSelectEvent(EVENT_OPTIONS[2].type)}
              />
              <EventTile
                option={EVENT_OPTIONS[3]}
                onPress={() => onSelectEvent(EVENT_OPTIONS[3].type)}
              />
            </View>
          </View>

          {/* Cancelar */}
          <TouchableOpacity
            onPress={onCancel}
            activeOpacity={0.7}
            style={{ paddingVertical: 12, alignItems: 'center' }}
          >
            <Text
              style={{
                color: Colors.text.secondary,
                fontSize: theme.fontSize.md,
                fontWeight: '500',
              }}
            >
              Cancelar
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export const RegisterEventModal = memo(RegisterEventModalComponent);
