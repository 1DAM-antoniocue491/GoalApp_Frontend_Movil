/**
 * RegisterEventModal.tsx
 * Selector móvil de eventos de partido en vivo.
 */

import React, { memo } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import type { MatchPlayerOption } from '../../types/matches.types';

export type MatchEventType = 'goal' | 'yellow_card' | 'red_card' | 'substitution';

export interface LiveMatchPlayer extends MatchPlayerOption {}

export interface LiveMatchContext {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  duration?: number;
  startedAt?: string | null;
  homeTeamId?: number;
  awayTeamId?: number;
  homePlayers?: LiveMatchPlayer[];
  awayPlayers?: LiveMatchPlayer[];
}

interface RegisterEventModalProps {
  visible: boolean;
  match: LiveMatchContext | null;
  onSelectEvent: (type: MatchEventType) => void;
  onCancel: () => void;
  disabled?: boolean;
  loading?: boolean;
}

const OPTIONS: Array<{ type: MatchEventType; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = [
  { type: 'goal', label: 'Gol', icon: 'football-outline', color: Colors.brand.primary },
  { type: 'yellow_card', label: 'Amarilla', icon: 'square-outline', color: Colors.semantic.warning },
  { type: 'red_card', label: 'Roja', icon: 'square-outline', color: Colors.semantic.error },
  { type: 'substitution', label: 'Cambio', icon: 'swap-horizontal-outline', color: Colors.brand.secondary },
];

function RegisterEventModalComponent({ visible, match, onSelectEvent, onCancel, disabled = false, loading = false }: RegisterEventModalProps) {
  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' }}>
        <Pressable style={{ flex: 1 }} onPress={disabled ? undefined : onCancel} />
        <View style={{ backgroundColor: Colors.bg.surface1, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 22, paddingBottom: 40, borderWidth: 1, borderColor: Colors.bg.surface2 }}>
          <View style={{ width: 42, height: 4, borderRadius: 2, backgroundColor: Colors.bg.surface2, alignSelf: 'center', marginBottom: 18 }} />
          <Text style={{ color: Colors.text.primary, fontSize: 24, fontWeight: '800' }}>Añadir evento</Text>
          {match ? (
            <Text style={{ color: Colors.text.secondary, marginTop: 6, fontSize: 14 }}>
              {match.homeTeam} {match.homeScore}–{match.awayScore} {match.awayTeam} · {match.minute}'
            </Text>
          ) : null}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
            {OPTIONS.map(option => (
              <TouchableOpacity
                key={option.type}
                activeOpacity={0.9}
                disabled={disabled || loading}
                onPress={() => onSelectEvent(option.type)}
                style={{ width: '48%', minHeight: 92, borderRadius: theme.borderRadius.xl, backgroundColor: Colors.bg.surface2, borderWidth: 1, borderColor: option.color + '55', padding: 14, justifyContent: 'space-between', opacity: disabled || loading ? 0.45 : 1 }}
              >
                <Ionicons name={option.icon} size={24} color={option.color} />
                <Text style={{ color: Colors.text.primary, fontSize: 16, fontWeight: '700' }}>{loading ? 'Cargando...' : option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export const RegisterEventModal = memo(RegisterEventModalComponent);
