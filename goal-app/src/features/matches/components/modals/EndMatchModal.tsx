/**
 * EndMatchModal.tsx
 *
 * Modal de confirmación para finalizar un partido en vivo.
 *
 * Muestra:
 * - Equipos y marcador actual (resultados definitivos)
 * - Campo opcional de MVP del partido
 * - Campo opcional de observaciones
 * - Botón de confirmación con advertencia (acción irreversible)
 *
 * PREPARADO PARA API:
 * onConfirm recibe EndMatchData listo para enviar a
 * PATCH /matches/:id/finish con { mvp?, observations? }.
 * El marcador ya está registrado en el servidor; aquí solo se cierra el partido.
 */

import React, { useRef, useEffect, useState, memo } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  Animated,
  Easing,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { OptionSelectField } from '@/src/shared/components/ui/OptionSelectField';
import type { SelectOption } from '@/src/shared/components/ui/OptionSelectField';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

/** Datos mínimos del partido en vivo necesarios para el modal */
export interface LiveMatchSummary {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  /** Plantilla del equipo local. Vendrá de GET /matches/:id/squads */
  homePlayers?: string[];
  /** Plantilla del equipo visitante. Vendrá de GET /matches/:id/squads */
  awayPlayers?: string[];
}

export interface EndMatchData {
  /** Nombre del jugador MVP — opcional */
  mvp?: string;
  /** Equipo al que pertenece el MVP */
  mvpTeam?: 'home' | 'away';
  /** Puntuación MVP (0.0 – 10.0) — opcional */
  mvpScore?: number;
  /** Observaciones del partido — opcional */
  observations?: string;
}

interface EndMatchModalProps {
  visible: boolean;
  match: LiveMatchSummary | null;
  onConfirm: (data: EndMatchData) => void;
  onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Mock fallback de plantilla — reemplazar por GET /matches/:id/squads
// ---------------------------------------------------------------------------

function getMockPlayers(side: 'home' | 'away'): string[] {
  const tag = side === 'home' ? 'L' : 'V';
  return Array.from({ length: 11 }, (_, i) => `Jugador ${tag}${i + 1}`);
}

function toOptions(players: string[]): SelectOption[] {
  return players.map((p) => ({ label: p, value: p }));
}

// ---------------------------------------------------------------------------
// Sub-componentes
// ---------------------------------------------------------------------------

function TeamPicker({
  homeTeam,
  awayTeam,
  value,
  onChange,
}: {
  homeTeam: string;
  awayTeam: string;
  value: 'home' | 'away' | null;
  onChange: (v: 'home' | 'away') => void;
}) {
  const accentColor = Colors.semantic.warning;
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {(['home', 'away'] as const).map((side) => {
        const isActive = value === side;
        return (
          <Pressable
            key={side}
            onPress={() => onChange(side)}
            style={{
              flex: 1, paddingVertical: 12,
              borderRadius: theme.borderRadius.md,
              backgroundColor: isActive ? accentColor + '18' : Colors.bg.surface2,
              borderWidth: 1.5,
              borderColor: isActive ? accentColor : 'transparent',
              alignItems: 'center', gap: 2,
            }}
          >
            <Text style={{
              color: isActive ? accentColor : Colors.text.secondary,
              fontSize: 13, fontWeight: isActive ? '700' : '400',
            }} numberOfLines={1}>
              {side === 'home' ? homeTeam : awayTeam}
            </Text>
            <Text style={{ color: Colors.text.disabled, fontSize: 11 }}>
              {side === 'home' ? 'Local' : 'Visitante'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}


// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

function EndMatchModalComponent({
  visible,
  match,
  onConfirm,
  onCancel,
}: EndMatchModalProps) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const [mvpTeam, setMvpTeam] = useState<'home' | 'away' | null>(null);
  const [mvp, setMvp] = useState('');
  const [mvpScore, setMvpScore] = useState('');
  const [observations, setObservations] = useState('');

  // Limpiar al abrir
  useEffect(() => {
    if (visible) {
      setMvpTeam(null);
      setMvp('');
      setMvpScore('');
      setObservations('');
    }
  }, [visible]);

  // Al cambiar equipo MVP, limpiar el jugador seleccionado
  const handleMvpTeamChange = (v: 'home' | 'away') => {
    setMvpTeam(v);
    setMvp('');
  };

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
          duration: 300,
          easing: Easing.out(Easing.back(1.0)),
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
          toValue: 400,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacityAnim, slideAnim]);

  // Puntuación MVP: válida si está vacía (no se registra) o si es un número entre 0.0 y 10.0
  const mvpScoreNum = mvpScore.trim() === '' ? null : parseFloat(mvpScore.trim().replace(',', '.'));
  const mvpScoreError =
    mvpScore.trim() !== '' &&
    (mvpScoreNum === null || isNaN(mvpScoreNum) || mvpScoreNum < 0 || mvpScoreNum > 10);

  // No se puede confirmar si la puntuación está fuera de rango
  const canConfirm = !mvpScoreError;

  // Jugadores del equipo MVP seleccionado
  const mvpPlayers = mvpTeam === 'home'
    ? (match?.homePlayers ?? getMockPlayers('home'))
    : mvpTeam === 'away'
      ? (match?.awayPlayers ?? getMockPlayers('away'))
      : [];

  const handleConfirm = () => {
    if (!canConfirm) return;
    // TODO: PATCH /matches/:id/finish { mvp, mvpTeam, mvpScore, observations }
    onConfirm({
      mvp: mvp || undefined,
      mvpTeam: mvp ? mvpTeam ?? undefined : undefined,
      mvpScore: mvpScoreNum !== null && !isNaN(mvpScoreNum) ? mvpScoreNum : undefined,
      observations: observations.trim() || undefined,
    });
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
              paddingTop: 12,
              paddingBottom: 40,
              borderWidth: 1,
              borderColor: Colors.bg.surface2,
              maxHeight: '88%',
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

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 8 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Icono de advertencia */}
              <View
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 34,
                  backgroundColor: Colors.semantic.error + '18',
                  borderWidth: 1,
                  borderColor: Colors.semantic.error + '30',
                  alignItems: 'center',
                  justifyContent: 'center',
                  alignSelf: 'center',
                  marginBottom: 18,
                }}
              >
                <Ionicons name="flag" size={30} color={Colors.semantic.error} />
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
                Finalizar partido
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
                Esta acción es irreversible. El partido pasará a estado finalizado.
              </Text>

              {/* Resultado final */}
              {match && (
                <View
                  style={{
                    backgroundColor: Colors.bg.surface2,
                    borderRadius: theme.borderRadius.lg,
                    padding: 20,
                    marginBottom: 24,
                  }}
                >
                  <Text
                    style={{
                      color: Colors.text.disabled,
                      fontSize: 10,
                      fontWeight: '600',
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      textAlign: 'center',
                      marginBottom: 12,
                    }}
                  >
                    RESULTADO FINAL
                  </Text>

                  {/* Equipos y marcador */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text
                      style={{
                        color: Colors.text.primary,
                        fontSize: 14,
                        fontWeight: '600',
                        flex: 1,
                        textAlign: 'center',
                      }}
                      numberOfLines={2}
                    >
                      {match.homeTeam}
                    </Text>

                    <Text
                      style={{
                        color: Colors.text.primary,
                        fontSize: 36,
                        fontWeight: '800',
                        letterSpacing: -1,
                        marginHorizontal: 12,
                      }}
                    >
                      {match.homeScore} – {match.awayScore}
                    </Text>

                    <Text
                      style={{
                        color: Colors.text.primary,
                        fontSize: 14,
                        fontWeight: '600',
                        flex: 1,
                        textAlign: 'center',
                      }}
                      numberOfLines={2}
                    >
                      {match.awayTeam}
                    </Text>
                  </View>
                </View>
              )}

              {/* MVP — opcional: primero equipo, luego jugador, luego puntuación */}
              <View style={{ gap: 14 }}>
                <Text style={{
                  color: Colors.text.secondary,
                  fontSize: 12, fontWeight: '600',
                  letterSpacing: 0.5, textTransform: 'uppercase',
                }}>
                  MVP del partido{' '}
                  <Text style={{ color: Colors.text.disabled, fontWeight: '400' }}>(opcional)</Text>
                </Text>

                {/* 1. Equipo del MVP */}
                {match && (
                  <TeamPicker
                    homeTeam={match.homeTeam}
                    awayTeam={match.awayTeam}
                    value={mvpTeam}
                    onChange={handleMvpTeamChange}
                  />
                )}

                {/* 2. Jugador MVP — solo visible al seleccionar equipo */}
                {mvpTeam !== null && (
                  <OptionSelectField
                    label="Jugador MVP"
                    options={toOptions(mvpPlayers)}
                    value={mvp}
                    onChange={setMvp}
                    placeholder="Selecciona un jugador..."
                  />
                )}

                {/* 3. Puntuación MVP 0.0 – 10.0 */}
                {mvpTeam !== null && (
                  <View>
                    <Text style={{
                      color: Colors.text.secondary, fontSize: 12, fontWeight: '600',
                      letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8,
                    }}>
                      Puntuación MVP{' '}
                      <Text style={{ color: Colors.text.disabled, fontWeight: '400' }}>(0.0 – 10.0)</Text>
                    </Text>
                    <View style={{
                      flexDirection: 'row', alignItems: 'center', gap: 10,
                      backgroundColor: mvpScoreError ? Colors.semantic.error + '18' : Colors.bg.surface2,
                      borderRadius: theme.borderRadius.md,
                      paddingHorizontal: 14, paddingVertical: 12,
                      borderWidth: 1,
                      borderColor: mvpScoreError ? Colors.semantic.error + '60' : 'transparent',
                    }}>
                      <Ionicons name="star-outline" size={16} color={mvpScoreError ? Colors.semantic.error : Colors.semantic.warning} />
                      <TextInput
                        value={mvpScore}
                        onChangeText={setMvpScore}
                        placeholder="Ej: 8.5"
                        placeholderTextColor={Colors.text.disabled}
                        keyboardType="decimal-pad"
                        style={{ flex: 1, color: Colors.text.primary, fontSize: theme.fontSize.md, paddingVertical: 0 }}
                      />
                    </View>
                    {/* Mensaje de error si la puntuación está fuera de rango */}
                    {mvpScoreError && (
                      <Text style={{ color: Colors.semantic.error, fontSize: 11, marginTop: 4 }}>
                        Debe estar entre 0.0 y 10.0
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {/* Observaciones — opcional */}
              <View style={{ marginBottom: 4 }}>
                <Text
                  style={{
                    color: Colors.text.secondary,
                    fontSize: 12,
                    fontWeight: '600',
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                    marginBottom: 8,
                  }}
                >
                  Observaciones{' '}
                  <Text style={{ color: Colors.text.disabled, fontWeight: '400' }}>(opcional)</Text>
                </Text>
                <View
                  style={{
                    backgroundColor: Colors.bg.surface2,
                    borderRadius: theme.borderRadius.md,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                  }}
                >
                  <TextInput
                    value={observations}
                    onChangeText={setObservations}
                    placeholder="Notas sobre el partido..."
                    placeholderTextColor={Colors.text.disabled}
                    multiline
                    numberOfLines={3}
                    autoCapitalize="sentences"
                    style={{
                      color: Colors.text.primary,
                      fontSize: theme.fontSize.md,
                      // style: textAlignVertical necesario para multiline en Android
                      textAlignVertical: 'top',
                      minHeight: 72,
                    }}
                  />
                </View>
              </View>
            </ScrollView>

            {/* Botones fuera del scroll */}
            <View style={{ paddingHorizontal: 24, paddingTop: 20, gap: 10 }}>
              <TouchableOpacity
                onPress={handleConfirm}
                disabled={!canConfirm}
                activeOpacity={0.88}
                style={{
                  height: 56,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: canConfirm ? Colors.semantic.error : Colors.bg.surface2,
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                <Ionicons name="flag" size={18} color={canConfirm ? Colors.text.primary : Colors.text.disabled} />
                <Text style={{ color: canConfirm ? Colors.text.primary : Colors.text.disabled, fontSize: 16, fontWeight: '700' }}>
                  Finalizar partido
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onCancel}
                activeOpacity={0.7}
                style={{ paddingVertical: 12, alignItems: 'center' }}
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
      </KeyboardAvoidingView>
    </Modal>
  );
}

export const EndMatchModal = memo(EndMatchModalComponent);
