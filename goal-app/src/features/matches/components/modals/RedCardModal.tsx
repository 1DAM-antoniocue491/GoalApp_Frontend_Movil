/**
 * RedCardModal.tsx
 *
 * Sub-modal para registrar una tarjeta roja en un partido en vivo.
 *
 * Campos:
 * - Equipo del jugador (local / visitante)
 * - Nombre del jugador expulsado
 * - Minuto (pre-rellenado con el minuto actual)
 * - Tipo: Directa / Segunda amarilla
 *
 * PREPARADO PARA API:
 * onConfirm recibe RedCardEventData listo para enviar a
 * POST /matches/:id/events con { type: 'red_card', ...RedCardEventData }
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

export type RedCardType = 'direct' | 'second_yellow';

export interface RedCardEventData {
  team: 'home' | 'away';
  playerName: string;
  cardType: RedCardType;
  // minute NO es input del usuario — se toma de match.minute al confirmar
  // TODO: payload: { type: 'red_card', ...RedCardEventData, minute: activeEventMatch?.minute }
}

interface RedCardModalProps {
  visible: boolean;
  match: LiveMatchContext | null;
  onConfirm: (data: RedCardEventData) => void;
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

function toOptions(players: string[]): SelectOption[] {
  return players.map((p) => ({ label: p, value: p }));
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
  const accentColor = Colors.semantic.error;
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


/** Selector de tipo de roja: Directa / 2ª Amarilla */
function CardTypePicker({
  value,
  onChange,
}: {
  value: RedCardType;
  onChange: (v: RedCardType) => void;
}) {
  const options: { value: RedCardType; label: string; sub: string }[] = [
    { value: 'direct', label: 'Directa', sub: 'Roja sin amarilla previa' },
    { value: 'second_yellow', label: '2ª Amarilla', sub: 'Segunda amonestación' },
  ];
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={{
              flex: 1, paddingVertical: 10,
              borderRadius: theme.borderRadius.md,
              backgroundColor: isActive ? Colors.semantic.error + '18' : Colors.bg.surface2,
              borderWidth: 1.5,
              borderColor: isActive ? Colors.semantic.error : 'transparent',
              alignItems: 'center', gap: 2,
            }}
          >
            <Text
              style={{
                color: isActive ? Colors.semantic.error : Colors.text.secondary,
                fontSize: 13, fontWeight: isActive ? '700' : '400',
              }}
            >
              {opt.label}
            </Text>
            <Text style={{ color: Colors.text.disabled, fontSize: 10, textAlign: 'center' }}>
              {opt.sub}
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

function RedCardModalComponent({ visible, match, onConfirm, onCancel }: RedCardModalProps) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const [team, setTeam] = useState<'home' | 'away'>('home');
  const [playerName, setPlayerName] = useState('');
  const [cardType, setCardType] = useState<RedCardType>('direct');

  useEffect(() => {
    if (visible) {
      setTeam('home');
      setPlayerName('');
      setCardType('direct');
    }
  }, [visible]);

  // Al cambiar equipo, limpiar jugador
  const handleTeamChange = (v: 'home' | 'away') => {
    setTeam(v);
    setPlayerName('');
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

  const accentColor = Colors.semantic.error;

  // Jugadores del equipo seleccionado
  const players = team === 'home'
    ? (match?.homePlayers ?? getMockPlayers('home'))
    : (match?.awayPlayers ?? getMockPlayers('away'));

  const isValid = playerName.length > 0;

  const handleConfirm = () => {
    if (!isValid) return;
    // TODO: POST /matches/:id/events { type: 'red_card', team, playerName, cardType, minute: activeEventMatch?.minute }
    onConfirm({ team, playerName, cardType });
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
                  backgroundColor: accentColor + '18',
                  borderWidth: 1, borderColor: accentColor + '30',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ionicons name="card" size={22} color={accentColor} />
              </View>
              <View>
                <Text style={{ color: Colors.text.primary, fontSize: 20, fontWeight: '700' }}>
                  Tarjeta roja
                </Text>
                {match && (
                  <Text style={{ color: Colors.text.secondary, fontSize: 12, marginTop: 2 }}>
                    {match.homeTeam} {match.homeScore} – {match.awayScore} {match.awayTeam} · {match.minute}'
                  </Text>
                )}
              </View>
            </View>

            {/* Tipo de roja */}
            <View>
              <Text style={{
                color: Colors.text.secondary, fontSize: 12, fontWeight: '600',
                letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8,
              }}>
                Tipo de expulsión
              </Text>
              <CardTypePicker value={cardType} onChange={setCardType} />
            </View>

            {/* Equipo */}
            <View>
              <Text style={{
                color: Colors.text.secondary, fontSize: 12, fontWeight: '600',
                letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8,
              }}>
                Equipo del jugador
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

            {/* Jugador expulsado — filtrado por equipo */}
            <View>
              <OptionSelectField
                label="Jugador expulsado *"
                options={toOptions(players)}
                value={playerName}
                onChange={setPlayerName}
                placeholder="Selecciona un jugador..."
              />
            </View>
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
              <Ionicons name="card" size={18} color={Colors.text.primary} />
              <Text style={{ color: Colors.text.primary, fontSize: 16, fontWeight: '700' }}>
                Registrar expulsión
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

export const RedCardModal = memo(RedCardModalComponent);
