import React, { memo, useEffect, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { OptionSelectField } from '@/src/shared/components/ui/OptionSelectField';
import type { LiveMatchContext } from './RegisterEventModal';
import { MatchModalActions, MatchModalButton, MatchModalShell } from './MatchModalShell';
import { FieldTitle, TeamPicker, toPlayerOptions } from './matchEventModalHelpers';

export interface GoalEventData {
  team: 'home' | 'away';
  scorerId: number;
  ownGoal: boolean;
}

interface GoalEventModalProps {
  visible: boolean;
  match: LiveMatchContext | null;
  onConfirm: (data: GoalEventData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

function GoalEventModalComponent({ visible, match, onConfirm, onCancel, isSubmitting = false }: GoalEventModalProps) {
  const [team, setTeam] = useState<'home' | 'away'>('home');
  const [playerId, setPlayerId] = useState('');
  const [ownGoal, setOwnGoal] = useState(false);

  useEffect(() => {
    if (visible) {
      setTeam('home');
      setPlayerId('');
      setOwnGoal(false);
    }
  }, [visible]);

  const options = useMemo(() => toPlayerOptions(team === 'home' ? match?.homePlayers : match?.awayPlayers), [team, match]);
  const canConfirm = !isSubmitting && Number(playerId) > 0;

  return (
    <MatchModalShell
      visible={visible}
      title="Registrar gol"
      subtitle={`Minuto automático: ${match?.minute ?? 1}' / ${match?.duration ?? 90}'`}
      icon="football-outline"
      iconColor={Colors.brand.primary}
      pending={isSubmitting}
      onClose={onCancel}
      footer={
        <MatchModalActions>
          <MatchModalButton label="Cancelar" variant="secondary" disabled={isSubmitting} onPress={onCancel} />
          <MatchModalButton label="Guardar" variant="primary" loading={isSubmitting} disabled={!canConfirm} onPress={() => onConfirm({ team, scorerId: Number(playerId), ownGoal })} />
        </MatchModalActions>
      }
    >
      <FieldTitle>Equipo</FieldTitle>
      <TeamPicker homeTeam={match?.homeTeam ?? 'Local'} awayTeam={match?.awayTeam ?? 'Visitante'} value={team} disabled={isSubmitting} onChange={(next) => { setTeam(next); setPlayerId(''); }} />

      <View style={{ marginTop: 18 }}>
        <OptionSelectField label="Jugador" value={playerId} options={options} placeholder="Selecciona jugador" onChange={setPlayerId} />
      </View>

      <TouchableOpacity disabled={isSubmitting} onPress={() => setOwnGoal((value) => !value)} className="flex-row items-center" style={{ gap: 10, marginTop: 18, opacity: isSubmitting ? 0.6 : 1 }}>
        <Ionicons name={ownGoal ? 'checkbox' : 'square-outline'} size={22} color={Colors.brand.primary} />
        <Text style={{ color: Colors.text.secondary, fontWeight: '700' }}>Gol en propia puerta</Text>
      </TouchableOpacity>
    </MatchModalShell>
  );
}

export const GoalEventModal = memo(GoalEventModalComponent);
