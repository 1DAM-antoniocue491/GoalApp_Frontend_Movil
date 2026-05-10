/** Finalización de partido con MVP. Bottom sheet sin solapes. */

import React, { memo, useEffect, useMemo, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/src/shared/constants/colors';
import { OptionSelectField } from '@/src/shared/components/ui/OptionSelectField';
import type { SelectOption } from '@/src/shared/components/ui/OptionSelectField';
import type { LiveMatchPlayer } from './RegisterEventModal';
import { MatchModalActions, MatchModalButton, MatchModalShell } from './MatchModalShell';
import { FieldTitle } from './matchEventModalHelpers';

export interface LiveMatchSummary {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeTeamId?: number;
  awayTeamId?: number;
  homePlayers?: LiveMatchPlayer[];
  awayPlayers?: LiveMatchPlayer[];
}

export interface EndMatchData {
  mvpId: number;
  mvpTeam: 'home' | 'away';
  mvpScore: number;
  observations?: string;
}

interface EndMatchModalProps {
  visible: boolean;
  match: LiveMatchSummary | null;
  onConfirm: (data: EndMatchData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

function toOptions(players?: LiveMatchPlayer[]): SelectOption[] {
  return (players ?? []).map((player) => ({
    value: String(player.id_jugador),
    label: `${player.dorsal ? `${player.dorsal} · ` : ''}${player.nombre}`,
  }));
}

function EndMatchModalComponent({ visible, match, onConfirm, onCancel, isSubmitting = false }: EndMatchModalProps) {
  const [mvpTeam, setMvpTeam] = useState<'home' | 'away'>('home');
  const [mvpId, setMvpId] = useState('');
  const [mvpScore, setMvpScore] = useState('8');
  const [observations, setObservations] = useState('');

  useEffect(() => {
    if (visible) {
      setMvpTeam('home');
      setMvpId('');
      setMvpScore('8');
      setObservations('');
    }
  }, [visible]);

  const options = useMemo(() => toOptions(mvpTeam === 'home' ? match?.homePlayers : match?.awayPlayers), [mvpTeam, match]);
  const parsedScore = Number(String(mvpScore).replace(',', '.'));
  const validScore = Number.isFinite(parsedScore) && parsedScore >= 1 && parsedScore <= 10;
  const canConfirm = !isSubmitting && Number(mvpId) > 0 && validScore;

  return (
    <MatchModalShell
      visible={visible}
      title="Finalizar partido"
      subtitle={match ? `${match.homeTeam} ${match.homeScore}–${match.awayScore} ${match.awayTeam}` : null}
      icon="checkmark-circle-outline"
      iconColor={Colors.semantic.error}
      pending={isSubmitting}
      onClose={onCancel}
      footer={
        <MatchModalActions>
          <MatchModalButton label="Cancelar" variant="secondary" disabled={isSubmitting} onPress={onCancel} />
          <MatchModalButton label="Finalizar" variant="danger" loading={isSubmitting} disabled={!canConfirm} onPress={() => onConfirm({ mvpId: Number(mvpId), mvpTeam, mvpScore: parsedScore, observations: observations.trim() || undefined })} />
        </MatchModalActions>
      }
    >
      <FieldTitle>Equipo del MVP</FieldTitle>
      <View className="flex-row" style={{ gap: 10 }}>
        {(['home', 'away'] as const).map((side) => {
          const active = mvpTeam === side;
          return (
            <TouchableOpacity
              key={side}
              disabled={isSubmitting}
              onPress={() => { setMvpTeam(side); setMvpId(''); }}
              className="flex-1 items-center justify-center"
              style={{
                minHeight: 54,
                borderRadius: 16,
                backgroundColor: active ? `${Colors.brand.primary}22` : Colors.bg.surface2,
                borderWidth: 1,
                borderColor: active ? Colors.brand.primary : 'transparent',
                paddingHorizontal: 8,
                opacity: isSubmitting ? 0.6 : 1,
              }}
            >
              <Text numberOfLines={1} style={{ color: active ? Colors.brand.primary : Colors.text.secondary, fontWeight: '900' }}>
                {side === 'home' ? match?.homeTeam ?? 'Local' : match?.awayTeam ?? 'Visitante'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ marginTop: 18 }}>
        <OptionSelectField label="MVP del partido" value={mvpId} options={options} placeholder="Selecciona jugador" onChange={setMvpId} />
      </View>

      <View style={{ marginTop: 18 }}>
        <FieldTitle>Puntuación MVP</FieldTitle>
        <TextInput
          value={mvpScore}
          onChangeText={setMvpScore}
          editable={!isSubmitting}
          keyboardType="decimal-pad"
          placeholder="1 - 10"
          placeholderTextColor={Colors.text.disabled}
          style={{
            height: 52,
            borderRadius: 16,
            backgroundColor: Colors.bg.base,
            color: Colors.text.primary,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: validScore || !mvpScore ? Colors.bg.surface2 : Colors.semantic.warning,
            fontSize: 16,
          }}
        />
        {!validScore && mvpScore ? (
          <Text style={{ color: Colors.semantic.warning, marginTop: 6, fontSize: 12, fontWeight: '700' }}>
            La puntuación debe estar entre 1 y 10.
          </Text>
        ) : null}
      </View>

      <View style={{ marginTop: 18 }}>
        <FieldTitle>Incidencias</FieldTitle>
        <TextInput
          value={observations}
          onChangeText={setObservations}
          editable={!isSubmitting}
          multiline
          placeholder="Observaciones opcionales"
          placeholderTextColor={Colors.text.disabled}
          style={{
            minHeight: 92,
            borderRadius: 16,
            backgroundColor: Colors.bg.base,
            color: Colors.text.primary,
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderWidth: 1,
            borderColor: Colors.bg.surface2,
            fontSize: 15,
            textAlignVertical: 'top',
          }}
        />
      </View>
    </MatchModalShell>
  );
}

export const EndMatchModal = memo(EndMatchModalComponent);
