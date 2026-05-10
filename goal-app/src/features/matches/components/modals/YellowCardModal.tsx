import React, { memo, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Colors } from '@/src/shared/constants/colors';
import { OptionSelectField } from '@/src/shared/components/ui/OptionSelectField';
import type { LiveMatchContext } from './RegisterEventModal';
import { MatchModalActions, MatchModalButton, MatchModalShell } from './MatchModalShell';
import { FieldTitle, TeamPicker, toPlayerOptions } from './matchEventModalHelpers';

export interface YellowCardEventData {
  team: 'home' | 'away';
  playerId: number;
}

interface YellowCardModalProps {
  visible: boolean;
  match: LiveMatchContext | null;
  onConfirm: (data: YellowCardEventData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

function YellowCardModalComponent({ visible, match, onConfirm, onCancel, isSubmitting = false }: YellowCardModalProps) {
  const [team, setTeam] = useState<'home' | 'away'>('home');
  const [playerId, setPlayerId] = useState('');

  useEffect(() => {
    if (visible) {
      setTeam('home');
      setPlayerId('');
    }
  }, [visible]);

  const options = useMemo(() => toPlayerOptions(team === 'home' ? match?.homePlayers : match?.awayPlayers), [team, match]);
  const canConfirm = !isSubmitting && Number(playerId) > 0;

  return (
    <MatchModalShell
      visible={visible}
      title="Tarjeta amarilla"
      subtitle={`Minuto automático: ${match?.minute ?? 1}' / ${match?.duration ?? 90}'`}
      icon="square-outline"
      iconColor={Colors.semantic.warning}
      pending={isSubmitting}
      onClose={onCancel}
      footer={
        <MatchModalActions>
          <MatchModalButton label="Cancelar" variant="secondary" disabled={isSubmitting} onPress={onCancel} />
          <MatchModalButton label="Guardar" variant="warning" loading={isSubmitting} disabled={!canConfirm} onPress={() => onConfirm({ team, playerId: Number(playerId) })} />
        </MatchModalActions>
      }
    >
      <FieldTitle>Equipo</FieldTitle>
      <TeamPicker homeTeam={match?.homeTeam ?? 'Local'} awayTeam={match?.awayTeam ?? 'Visitante'} value={team} disabled={isSubmitting} onChange={(next) => { setTeam(next); setPlayerId(''); }} />
      <View style={{ marginTop: 18 }}>
        <OptionSelectField label="Jugador" value={playerId} options={options} placeholder="Selecciona jugador" onChange={setPlayerId} />
      </View>
    </MatchModalShell>
  );
}

export const YellowCardModal = memo(YellowCardModalComponent);
