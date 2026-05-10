import React, { memo, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Colors } from '@/src/shared/constants/colors';
import { OptionSelectField } from '@/src/shared/components/ui/OptionSelectField';
import type { LiveMatchContext } from './RegisterEventModal';
import { MatchModalActions, MatchModalButton, MatchModalShell } from './MatchModalShell';
import { FieldTitle, TeamPicker, toPlayerOptions } from './matchEventModalHelpers';

export interface SubstitutionEventData {
  team: 'home' | 'away';
  playerOutId: number;
  playerInId: number;
}

interface SubstitutionModalProps {
  visible: boolean;
  match: LiveMatchContext | null;
  onConfirm: (data: SubstitutionEventData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

function SubstitutionModalComponent({ visible, match, onConfirm, onCancel, isSubmitting = false }: SubstitutionModalProps) {
  const [team, setTeam] = useState<'home' | 'away'>('home');
  const [playerOutId, setPlayerOutId] = useState('');
  const [playerInId, setPlayerInId] = useState('');

  useEffect(() => {
    if (visible) {
      setTeam('home');
      setPlayerOutId('');
      setPlayerInId('');
    }
  }, [visible]);

  const baseOptions = useMemo(() => toPlayerOptions(team === 'home' ? match?.homePlayers : match?.awayPlayers), [team, match]);
  const outOptions = baseOptions.filter((option) => option.value !== playerInId);
  const inOptions = baseOptions.filter((option) => option.value !== playerOutId);
  const canConfirm = !isSubmitting && Number(playerOutId) > 0 && Number(playerInId) > 0 && playerOutId !== playerInId;

  return (
    <MatchModalShell
      visible={visible}
      title="Sustitución"
      subtitle={`Minuto automático: ${match?.minute ?? 1}' / ${match?.duration ?? 90}'`}
      icon="swap-horizontal-outline"
      iconColor={Colors.brand.secondary}
      pending={isSubmitting}
      onClose={onCancel}
      footer={
        <MatchModalActions>
          <MatchModalButton label="Cancelar" variant="secondary" disabled={isSubmitting} onPress={onCancel} />
          <MatchModalButton label="Guardar" variant="primary" loading={isSubmitting} disabled={!canConfirm} onPress={() => onConfirm({ team, playerOutId: Number(playerOutId), playerInId: Number(playerInId) })} />
        </MatchModalActions>
      }
    >
      <FieldTitle>Equipo</FieldTitle>
      <TeamPicker homeTeam={match?.homeTeam ?? 'Local'} awayTeam={match?.awayTeam ?? 'Visitante'} value={team} disabled={isSubmitting} onChange={(next) => { setTeam(next); setPlayerOutId(''); setPlayerInId(''); }} />

      <View style={{ marginTop: 18 }}>
        <OptionSelectField label="Sale" value={playerOutId} options={outOptions} placeholder="Jugador que sale" onChange={setPlayerOutId} />
      </View>
      <View style={{ marginTop: 14 }}>
        <OptionSelectField label="Entra" value={playerInId} options={inOptions} placeholder="Jugador que entra" onChange={setPlayerInId} />
      </View>
    </MatchModalShell>
  );
}

export const SubstitutionModal = memo(SubstitutionModalComponent);
