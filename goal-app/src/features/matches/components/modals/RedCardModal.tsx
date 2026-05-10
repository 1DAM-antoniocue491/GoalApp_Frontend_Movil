import React, { memo, useEffect, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/src/shared/constants/colors';
import { OptionSelectField } from '@/src/shared/components/ui/OptionSelectField';
import type { LiveMatchContext } from './RegisterEventModal';
import { MatchModalActions, MatchModalButton, MatchModalShell } from './MatchModalShell';
import { FieldTitle, TeamPicker, toPlayerOptions } from './matchEventModalHelpers';

export type RedCardType = 'direct' | 'second_yellow';
export interface RedCardEventData {
  team: 'home' | 'away';
  playerId: number;
  cardType: RedCardType;
}

interface RedCardModalProps {
  visible: boolean;
  match: LiveMatchContext | null;
  onConfirm: (data: RedCardEventData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

function CardTypeButton({ label, active, disabled, onPress }: { label: string; active: boolean; disabled?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      activeOpacity={0.9}
      className="flex-1 items-center justify-center"
      style={{
        height: 48,
        borderRadius: 14,
        backgroundColor: active ? `${Colors.semantic.error}25` : Colors.bg.surface2,
        borderWidth: 1,
        borderColor: active ? Colors.semantic.error : 'transparent',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Text style={{ color: active ? Colors.semantic.error : Colors.text.secondary, fontWeight: '900' }}>{label}</Text>
    </TouchableOpacity>
  );
}

function RedCardModalComponent({ visible, match, onConfirm, onCancel, isSubmitting = false }: RedCardModalProps) {
  const [team, setTeam] = useState<'home' | 'away'>('home');
  const [playerId, setPlayerId] = useState('');
  const [cardType, setCardType] = useState<RedCardType>('direct');

  useEffect(() => {
    if (visible) {
      setTeam('home');
      setPlayerId('');
      setCardType('direct');
    }
  }, [visible]);

  const options = useMemo(() => toPlayerOptions(team === 'home' ? match?.homePlayers : match?.awayPlayers), [team, match]);
  const canConfirm = !isSubmitting && Number(playerId) > 0;

  return (
    <MatchModalShell
      visible={visible}
      title="Tarjeta roja"
      subtitle={`Minuto automático: ${match?.minute ?? 1}' / ${match?.duration ?? 90}'`}
      icon="square-outline"
      iconColor={Colors.semantic.error}
      pending={isSubmitting}
      onClose={onCancel}
      footer={
        <MatchModalActions>
          <MatchModalButton label="Cancelar" variant="secondary" disabled={isSubmitting} onPress={onCancel} />
          <MatchModalButton label="Guardar" variant="danger" loading={isSubmitting} disabled={!canConfirm} onPress={() => onConfirm({ team, playerId: Number(playerId), cardType })} />
        </MatchModalActions>
      }
    >
      <FieldTitle>Equipo</FieldTitle>
      <TeamPicker homeTeam={match?.homeTeam ?? 'Local'} awayTeam={match?.awayTeam ?? 'Visitante'} value={team} disabled={isSubmitting} onChange={(next) => { setTeam(next); setPlayerId(''); }} />

      <View style={{ marginTop: 18 }}>
        <FieldTitle>Tipo de roja</FieldTitle>
        <View className="flex-row" style={{ gap: 10 }}>
          <CardTypeButton label="Directa" active={cardType === 'direct'} disabled={isSubmitting} onPress={() => setCardType('direct')} />
          <CardTypeButton label="2ª amarilla" active={cardType === 'second_yellow'} disabled={isSubmitting} onPress={() => setCardType('second_yellow')} />
        </View>
      </View>

      <View style={{ marginTop: 18 }}>
        <OptionSelectField label="Jugador" value={playerId} options={options} placeholder="Selecciona jugador" onChange={setPlayerId} />
      </View>
    </MatchModalShell>
  );
}

export const RedCardModal = memo(RedCardModalComponent);
