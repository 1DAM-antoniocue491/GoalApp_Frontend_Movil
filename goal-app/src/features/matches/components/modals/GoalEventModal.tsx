/**
 * GoalEventModal.tsx
 *
 * Sub-modal para registrar un gol en un partido en vivo.
 *
 * Campos:
 * - Equipo que marca (local / visitante)
 * - Nombre del jugador que anota
 * - Minuto del gol (pre-rellenado con el minuto actual del partido)
 * - Propia puerta (toggle)
 *
 * PREPARADO PARA API:
 * onConfirm recibe GoalEventData listo para enviar a
 * POST /matches/:id/events con { type: 'goal', ...GoalEventData }
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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import type { LiveMatchContext } from './RegisterEventModal';
import { OptionSelectField } from '@/src/shared/components/ui/OptionSelectField';
import type { SelectOption } from '@/src/shared/components/ui/OptionSelectField';

// ---------------------------------------------------------------------------
// Tipos exportados
// ---------------------------------------------------------------------------

export interface GoalEventData {
  team: 'home' | 'away';
  scorerName: string;
  ownGoal: boolean;
  // minute NO es input del usuario — se toma automáticamente de match.minute al confirmar
  // TODO: payload: { type: 'goal', ...GoalEventData, minute: activeEventMatch?.minute }
}

interface GoalEventModalProps {
  visible: boolean;
  match: LiveMatchContext | null;
  onConfirm: (data: GoalEventData) => void;
  onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Mock fallback de plantilla — reemplazar por GET /matches/:id/squads
// L = Local, V = Visitante (prefijo para distinguir equipos en mock)
// ---------------------------------------------------------------------------

function getMockPlayers(side: 'home' | 'away'): string[] {
  const tag = side === 'home' ? 'L' : 'V';
  return Array.from({ length: 11 }, (_, i) => `Jugador ${tag}${i + 1}`);
}

/** Convierte lista de nombres a SelectOption[] para OptionSelectField */
function toOptions(players: string[]): SelectOption[] {
  return players.map((p) => ({ label: p, value: p }));
}

// ---------------------------------------------------------------------------
// Componentes internos
// ---------------------------------------------------------------------------

function TeamPicker({
  homeTeam,
  awayTeam,
  value,
  onChange,
}: {
  homeTeam: string;
  awayTeam: string;
  value: 'home' | 'away';
  onChange: (v: 'home' | 'away') => void;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {(['home', 'away'] as const).map((side) => {
        const isActive = value === side;
        const label = side === 'home' ? homeTeam : awayTeam;
        const sublabel = side === 'home' ? 'Local' : 'Visitante';
        return (
          <Pressable
            key={side}
            onPress={() => onChange(side)}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: theme.borderRadius.md,
              backgroundColor: isActive ? Colors.brand.primary + '18' : Colors.bg.surface2,
              borderWidth: 1.5,
              borderColor: isActive ? Colors.brand.primary : 'transparent',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Text
              style={{
                color: isActive ? Colors.brand.primary : Colors.text.secondary,
                fontSize: 13,
                fontWeight: isActive ? '700' : '400',
              }}
              numberOfLines={1}
            >
              {label}
            </Text>
            <Text style={{ color: Colors.text.disabled, fontSize: 11 }}>{sublabel}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}


function FieldLabel({ label, optional }: { label: string; optional?: boolean }) {
  return (
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
      {label}
      {optional && (
        <Text style={{ color: Colors.text.disabled, fontWeight: '400' }}> (opcional)</Text>
      )}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

function GoalEventModalComponent({ visible, match, onConfirm, onCancel }: GoalEventModalProps) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const [team, setTeam] = useState<'home' | 'away'>('home');
  const [scorerName, setScorerName] = useState('');
  const [ownGoal, setOwnGoal] = useState(false);

  useEffect(() => {
    if (visible) {
      setTeam('home');
      setScorerName('');
      setOwnGoal(false);
    }
  }, [visible]);

  // Al cambiar equipo, limpiar jugador (ya no es válido para el otro equipo)
  const handleTeamChange = (v: 'home' | 'away') => {
    setTeam(v);
    setScorerName('');
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: visible ? 1 : 0,
        duration: visible ? 200 : 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: visible ? 0 : 400,
        duration: visible ? 290 : 200,
        easing: visible ? Easing.out(Easing.back(1.0)) : Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, opacityAnim, slideAnim]);

  // Jugadores del equipo seleccionado — reales si los provee el contexto, mock si no
  const players = team === 'home'
    ? (match?.homePlayers ?? getMockPlayers('home'))
    : (match?.awayPlayers ?? getMockPlayers('away'));

  // Equipo siempre seleccionado (default 'home'); jugador obligatorio
  const isValid = scorerName.length > 0;

  const handleConfirm = () => {
    if (!isValid) return;
    // TODO: POST /matches/:id/events { type: 'goal', team, scorerName, ownGoal, minute: activeEventMatch?.minute }
    onConfirm({ team, scorerName, ownGoal });
  };

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent onRequestClose={onCancel}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)', opacity: opacityAnim }}
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
                width: 40, height: 4, borderRadius: 2,
                backgroundColor: Colors.bg.surface2,
                alignSelf: 'center', marginBottom: 20,
              }}
            />

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, gap: 20, paddingBottom: 8 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 44, height: 44, borderRadius: 22,
                    backgroundColor: Colors.brand.primary + '18',
                    borderWidth: 1, borderColor: Colors.brand.primary + '30',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Ionicons name="football-outline" size={22} color={Colors.brand.primary} />
                </View>
                <View>
                  <Text style={{ color: Colors.text.primary, fontSize: 20, fontWeight: '700' }}>
                    Registrar gol
                  </Text>
                  {match && (
                    <Text style={{ color: Colors.text.secondary, fontSize: 12, marginTop: 2 }}>
                      {match.homeTeam} {match.homeScore} – {match.awayScore} {match.awayTeam} · {match.minute}'
                    </Text>
                  )}
                </View>
              </View>

              {/* Equipo */}
              <View>
                <FieldLabel label="Equipo que marca" />
                {match && (
                  <TeamPicker
                    homeTeam={match.homeTeam}
                    awayTeam={match.awayTeam}
                    value={team}
                    onChange={handleTeamChange}
                  />
                )}
              </View>

              {/* Goleador — filtrado por equipo seleccionado */}
              <View>
                <OptionSelectField
                  label={ownGoal ? 'Jugador (propia puerta) *' : 'Goleador *'}
                  options={toOptions(players)}
                  value={scorerName}
                  onChange={setScorerName}
                  placeholder="Selecciona un jugador..."
                />
              </View>

              {/* Propia puerta */}
              <Pressable
                onPress={() => setOwnGoal((v) => !v)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 14,
                  backgroundColor: Colors.bg.surface2,
                  borderRadius: theme.borderRadius.md,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="swap-horizontal-outline" size={18} color={Colors.semantic.error} />
                  <Text style={{ color: Colors.text.primary, fontSize: theme.fontSize.md }}>
                    Propia puerta
                  </Text>
                </View>
                {/* Toggle visual */}
                <View
                  style={{
                    width: 44, height: 26, borderRadius: 13,
                    backgroundColor: ownGoal ? Colors.semantic.error : Colors.bg.base,
                    borderWidth: 1, borderColor: ownGoal ? Colors.semantic.error : Colors.text.disabled,
                    justifyContent: 'center',
                    paddingHorizontal: 2,
                  }}
                >
                  <Animated.View
                    style={{
                      width: 20, height: 20, borderRadius: 10,
                      backgroundColor: Colors.text.primary,
                      alignSelf: ownGoal ? 'flex-end' : 'flex-start',
                    }}
                  />
                </View>
              </Pressable>
            </ScrollView>

            {/* Botones */}
            <View style={{ paddingHorizontal: 24, paddingTop: 16, gap: 10 }}>
              <TouchableOpacity
                onPress={handleConfirm}
                disabled={!isValid}
                activeOpacity={0.88}
                style={{
                  height: 56, borderRadius: 18,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: isValid ? Colors.brand.primary : Colors.bg.surface2,
                  flexDirection: 'row', gap: 8,
                }}
              >
                <Ionicons name="football" size={18} color={isValid ? Colors.bg.base : Colors.text.disabled} />
                <Text style={{ color: isValid ? Colors.bg.base : Colors.text.disabled, fontSize: 16, fontWeight: '700' }}>
                  Registrar gol
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onCancel} activeOpacity={0.7} style={{ paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ color: Colors.text.secondary, fontSize: 15, fontWeight: '500' }}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export const GoalEventModal = memo(GoalEventModalComponent);
