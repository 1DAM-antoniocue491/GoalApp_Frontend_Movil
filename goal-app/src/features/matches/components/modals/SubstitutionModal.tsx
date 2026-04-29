/**
 * SubstitutionModal.tsx
 *
 * Sub-modal para registrar una sustitución en un partido en vivo.
 *
 * Campos:
 * - Equipo (local / visitante)
 * - Jugador que SALE
 * - Jugador que ENTRA
 * - Minuto (pre-rellenado con el minuto actual)
 *
 * PREPARADO PARA API:
 * onConfirm recibe SubstitutionEventData listo para enviar a
 * POST /matches/:id/events con { type: 'substitution', ...SubstitutionEventData }
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

export interface SubstitutionEventData {
  team: 'home' | 'away';
  playerOut: string;
  playerIn: string;
  // minute NO es input del usuario — se toma de match.minute al confirmar
  // TODO: payload: { type: 'substitution', ...SubstitutionEventData, minute: activeEventMatch?.minute }
}

interface SubstitutionModalProps {
  visible: boolean;
  match: LiveMatchContext | null;
  onConfirm: (data: SubstitutionEventData) => void;
  onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Componentes internos
// ---------------------------------------------------------------------------

// Mock fallback de plantilla — reemplazar por GET /matches/:id/squads
function getMockPlayers(side: 'home' | 'away'): string[] {
  const tag = side === 'home' ? 'L' : 'V';
  return Array.from({ length: 11 }, (_, i) => `Jugador ${tag}${i + 1}`);
}

function toOptions(players: string[], exclude?: string): SelectOption[] {
  return players.filter((p) => p !== exclude).map((p) => ({ label: p, value: p }));
}

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
  const accentColor = Colors.brand.secondary;
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
            <Text
              style={{
                color: isActive ? accentColor : Colors.text.secondary,
                fontSize: 13, fontWeight: isActive ? '700' : '400',
              }}
              numberOfLines={1}
            >
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

function SubstitutionModalComponent({ visible, match, onConfirm, onCancel }: SubstitutionModalProps) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const [team, setTeam] = useState<'home' | 'away'>('home');
  const [playerOut, setPlayerOut] = useState('');
  const [playerIn, setPlayerIn] = useState('');

  useEffect(() => {
    if (visible) {
      setTeam('home');
      setPlayerOut('');
      setPlayerIn('');
    }
  }, [visible]);

  // Al cambiar equipo, limpiar ambos jugadores (ya no pertenecen al equipo nuevo)
  const handleTeamChange = (v: 'home' | 'away') => {
    setTeam(v);
    setPlayerOut('');
    setPlayerIn('');
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

  const accentColor = Colors.brand.secondary;

  // Jugadores del equipo seleccionado
  const players = team === 'home'
    ? (match?.homePlayers ?? getMockPlayers('home'))
    : (match?.awayPlayers ?? getMockPlayers('away'));

  // Validación: ambos jugadores obligatorios y distintos
  const samePlayerError = playerOut.length > 0 && playerIn.length > 0 && playerOut === playerIn;
  const isValid = playerOut.length > 0 && playerIn.length > 0 && !samePlayerError;

  const handleConfirm = () => {
    if (!isValid) return;
    // TODO: POST /matches/:id/events { type: 'substitution', team, playerOut, playerIn, minute: activeEventMatch?.minute }
    onConfirm({ team, playerOut, playerIn });
  };

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent onRequestClose={onCancel}>
      <Animated.View
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)', opacity: opacityAnim }}
      >
        <Pressable style={{ flex: 1 }} onPress={onCancel} />

        <Animated.View
          style={{
            transform: [{ translateY: slideAnim }],
            backgroundColor: Colors.bg.surface1,
            borderTopLeftRadius: 32, borderTopRightRadius: 32,
            paddingTop: 12, paddingBottom: 40,
            borderWidth: 1, borderColor: Colors.bg.surface2,
            maxHeight: '90%',
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
                  backgroundColor: accentColor + '18',
                  borderWidth: 1, borderColor: accentColor + '30',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ionicons name="swap-horizontal-outline" size={22} color={accentColor} />
              </View>
              <View>
                <Text style={{ color: Colors.text.primary, fontSize: 20, fontWeight: '700' }}>
                  Sustitución
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
              <Text style={{
                color: Colors.text.secondary, fontSize: 12, fontWeight: '600',
                letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8,
              }}>
                Equipo
              </Text>
              {match && (
                <TeamPicker
                  homeTeam={match.homeTeam}
                  awayTeam={match.awayTeam}
                  value={team}
                  onChange={handleTeamChange}
                />
              )}
            </View>

            {/* Jugador que SALE — excluye al que ya está seleccionado en "Entra" */}
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Ionicons name="arrow-up-circle-outline" size={14} color={Colors.semantic.error} />
                <Text style={{
                  color: Colors.text.secondary, fontSize: 12, fontWeight: '600',
                  letterSpacing: 0.5, textTransform: 'uppercase',
                }}>
                  Sale
                </Text>
              </View>
              <OptionSelectField
                label="Jugador que sale"
                options={toOptions(players, playerIn)}
                value={playerOut}
                onChange={setPlayerOut}
                placeholder="Selecciona un jugador..."
              />
            </View>

            {/* Jugador que ENTRA — excluye al que ya está seleccionado en "Sale" */}
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Ionicons name="arrow-down-circle-outline" size={14} color={Colors.semantic.success} />
                <Text style={{
                  color: Colors.text.secondary, fontSize: 12, fontWeight: '600',
                  letterSpacing: 0.5, textTransform: 'uppercase',
                }}>
                  Entra
                </Text>
              </View>
              <OptionSelectField
                label="Jugador que entra"
                options={toOptions(players, playerOut)}
                value={playerIn}
                onChange={setPlayerIn}
                placeholder="Selecciona un jugador..."
              />
            </View>

            {/* Error mismo jugador */}
            {samePlayerError && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="warning-outline" size={14} color={Colors.semantic.error} />
                <Text style={{ color: Colors.semantic.error, fontSize: 12 }}>
                  El jugador que sale y el que entra no pueden ser el mismo
                </Text>
              </View>
            )}
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
                backgroundColor: isValid ? accentColor : Colors.bg.surface2,
                flexDirection: 'row', gap: 8,
              }}
            >
              <Ionicons name="swap-horizontal-outline" size={18} color={isValid ? Colors.text.primary : Colors.text.disabled} />
              <Text style={{ color: isValid ? Colors.text.primary : Colors.text.disabled, fontSize: 16, fontWeight: '700' }}>
                Registrar cambio
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onCancel} activeOpacity={0.7} style={{ paddingVertical: 12, alignItems: 'center' }}>
              <Text style={{ color: Colors.text.secondary, fontSize: 15, fontWeight: '500' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export const SubstitutionModal = memo(SubstitutionModalComponent);
