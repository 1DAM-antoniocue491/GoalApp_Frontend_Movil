import React, { memo, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { OptionSelectField } from '@/src/shared/components/ui/OptionSelectField';
import type { SelectOption } from '@/src/shared/components/ui/OptionSelectField';
import type { LiveMatchContext, LiveMatchPlayer } from './RegisterEventModal';

function toOptions(players?: LiveMatchPlayer[]): SelectOption[] {
  return (players ?? []).map(player => ({
    value: String(player.id_jugador),
    label: `${player.dorsal ? player.dorsal + ' · ' : ''}${player.nombre}`,
  }));
}

function TeamPicker({ homeTeam, awayTeam, value, onChange }: { homeTeam: string; awayTeam: string; value: 'home' | 'away'; onChange: (value: 'home' | 'away') => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {(['home', 'away'] as const).map(side => {
        const active = value === side;
        return (
          <TouchableOpacity key={side} onPress={() => onChange(side)} activeOpacity={0.9} style={{ flex: 1, minHeight: 54, borderRadius: theme.borderRadius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? Colors.brand.primary + '20' : Colors.bg.surface2, borderWidth: 1, borderColor: active ? Colors.brand.primary : 'transparent' }}>
            <Text numberOfLines={1} style={{ color: active ? Colors.brand.primary : Colors.text.secondary, fontWeight: '700' }}>{side === 'home' ? homeTeam : awayTeam}</Text>
            <Text style={{ color: Colors.text.disabled, fontSize: 11 }}>{side === 'home' ? 'Local' : 'Visitante'}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export type RedCardType = 'direct' | 'second_yellow';

export interface RedCardEventData {
  team: 'home' | 'away';
  playerId: number;
  cardType: RedCardType;
  incidencias?: string;
}

interface RedCardModalProps {
  visible: boolean;
  match: LiveMatchContext | null;
  onConfirm: (data: RedCardEventData) => void;
  onCancel: () => void;
  /** Evita dobles toques y bloquea cierre mientras hay petición activa. */
  submitting?: boolean;
}

function RedCardModalComponent({ visible, match, onConfirm, onCancel, submitting = false }: RedCardModalProps) {
  const [team, setTeam] = useState<'home' | 'away'>('home');
  const [playerId, setPlayerId] = useState('');
  const [cardType, setCardType] = useState<RedCardType>('direct');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (visible) {
      setTeam('home');
      setPlayerId('');
      setCardType('direct');
      setReason('');
    }
  }, [visible]);

  const options = useMemo(() => toOptions(team === 'home' ? match?.homePlayers : match?.awayPlayers), [team, match]);
  const canConfirm = Number(playerId) > 0;

  const fallbackReason = cardType === 'second_yellow' ? 'Segunda amarilla' : 'Tarjeta roja directa';

  return (
    <Modal transparent visible={visible} animationType="slide" statusBarTranslucent onRequestClose={submitting ? () => undefined : onCancel}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' }}>
        <Pressable style={{ flex: 1 }} onPress={submitting ? undefined : onCancel} />
        <View style={{ backgroundColor: Colors.bg.surface1, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 22, paddingBottom: 40, maxHeight: '88%' }}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={{ color: Colors.text.primary, fontSize: 24, fontWeight: '800' }}>Tarjeta roja</Text>
            <Text style={{ color: Colors.text.secondary, marginTop: 6 }}>Minuto automático: {match?.minute ?? 0}'</Text>

            <View style={{ marginTop: 20 }}>
              <TeamPicker homeTeam={match?.homeTeam ?? 'Local'} awayTeam={match?.awayTeam ?? 'Visitante'} value={team} onChange={(value) => { setTeam(value); setPlayerId(''); }} />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              {(['direct', 'second_yellow'] as const).map(type => {
                const active = cardType === type;
                return (
                  <TouchableOpacity key={type} onPress={() => setCardType(type)} style={{ flex: 1, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? Colors.semantic.error + '25' : Colors.bg.surface2, borderWidth: 1, borderColor: active ? Colors.semantic.error : 'transparent' }}>
                    <Text style={{ color: active ? Colors.semantic.error : Colors.text.secondary, fontWeight: '700' }}>{type === 'direct' ? 'Directa' : '2ª amarilla'}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ marginTop: 18 }}>
              <OptionSelectField label="Jugador" value={playerId} options={options} placeholder="Selecciona jugador" onChange={setPlayerId} />
            </View>

            <Text style={{ color: Colors.text.secondary, marginTop: 18, marginBottom: 8, fontWeight: '700' }}>Motivo / incidencia</Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder={fallbackReason}
              placeholderTextColor={Colors.text.disabled}
              style={{ minHeight: 52, borderRadius: 16, backgroundColor: Colors.bg.base, color: Colors.text.primary, paddingHorizontal: 16, borderWidth: 1, borderColor: Colors.bg.surface2 }}
            />

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
              <TouchableOpacity disabled={submitting} onPress={onCancel} style={{ flex: 1, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg.surface2 }}>
                <Text style={{ color: Colors.text.primary, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={!canConfirm || submitting} onPress={() => onConfirm({ team, playerId: Number(playerId), cardType, incidencias: reason.trim() || fallbackReason })} style={{ flex: 1, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: canConfirm && !submitting ? Colors.semantic.error : Colors.bg.surface2 }}>
                <Text style={{ color: Colors.text.primary, fontWeight: '800' }}>{submitting ? 'Guardando...' : 'Guardar'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export const RedCardModal = memo(RedCardModalComponent);
