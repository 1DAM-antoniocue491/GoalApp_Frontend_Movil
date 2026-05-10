/** Selector de evento en vivo. Bottom sheet seguro para móvil. */

import React, { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import type { MatchPlayerOption } from '../../types/matches.types';
import { MatchModalShell } from './MatchModalShell';

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
  eventsLocked?: boolean;
  homePlayers?: LiveMatchPlayer[];
  awayPlayers?: LiveMatchPlayer[];
}

interface RegisterEventModalProps {
  visible: boolean;
  match: LiveMatchContext | null;
  onSelectEvent: (type: MatchEventType) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const OPTIONS: Array<{ type: MatchEventType; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = [
  { type: 'goal', label: 'Gol', icon: 'football-outline', color: Colors.brand.primary },
  { type: 'yellow_card', label: 'Amarilla', icon: 'square-outline', color: Colors.semantic.warning },
  { type: 'red_card', label: 'Roja', icon: 'square-outline', color: Colors.semantic.error },
  { type: 'substitution', label: 'Sustitución', icon: 'swap-horizontal-outline', color: Colors.brand.secondary },
];

function RegisterEventModalComponent({ visible, match, onSelectEvent, onCancel, isSubmitting = false }: RegisterEventModalProps) {
  const locked = Boolean(match?.eventsLocked);

  return (
    <MatchModalShell
      visible={visible}
      title="Añadir evento"
      subtitle={match ? `${match.homeTeam} ${match.homeScore}–${match.awayScore} ${match.awayTeam} · ${match.minute}' / ${match.duration ?? 90}'` : null}
      icon="add-circle-outline"
      pending={isSubmitting}
      onClose={onCancel}
    >
      {locked ? (
        <View style={{ borderRadius: 16, padding: 13, backgroundColor: `${Colors.semantic.warning}16`, borderWidth: 1, borderColor: `${Colors.semantic.warning}55`, marginBottom: 14 }}>
          <Text style={{ color: Colors.semantic.warning, fontWeight: '900', textAlign: 'center' }}>
            El tiempo del partido ha finalizado. Finaliza el partido y escoge el MVP.
          </Text>
        </View>
      ) : null}

      <View className="flex-row flex-wrap" style={{ gap: 10 }}>
        {OPTIONS.map((option) => {
          const disabled = isSubmitting || locked;
          return (
            <TouchableOpacity
              key={option.type}
              activeOpacity={0.88}
              disabled={disabled}
              onPress={() => onSelectEvent(option.type)}
              style={{
                width: '48%',
                minHeight: 92,
                borderRadius: theme.borderRadius.xl,
                backgroundColor: Colors.bg.surface2,
                borderWidth: 1,
                borderColor: `${option.color}55`,
                padding: 14,
                justifyContent: 'space-between',
                opacity: disabled ? 0.5 : 1,
              }}
            >
              <Ionicons name={option.icon} size={24} color={option.color} />
              <Text style={{ color: Colors.text.primary, fontSize: 16, fontWeight: '900' }}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </MatchModalShell>
  );
}

export const RegisterEventModal = memo(RegisterEventModalComponent);
