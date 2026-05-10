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

export interface YellowCardEventData {
  team: 'home' | 'away';
  playerId: number;
  incidencias?: string;
}

interface YellowCardModalProps {
  visible: boolean;
  match: LiveMatchContext | null;
  onConfirm: (data: YellowCardEventData) => void;
  onCancel: () => void;
  /** Evita dobles toques y bloquea cierre mientras hay petición activa. */
  submitting?: boolean;
}

function YellowCardModalComponent({ visible, match, onConfirm, onCancel, submitting = false }: YellowCardModalProps) {
  const [team, setTeam] = useState<'home' | 'away'>('home');
  const [playerId, setPlayerId] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (visible) {
      setTeam('home');
      setPlayerId('');
      setReason('');
    }
  }, [visible]);

  const options = useMemo(() => toOptions(team === 'home' ? match?.homePlayers : match?.awayPlayers), [team, match]);
  const canConfirm = Number(playerId) > 0;

  return (
    <Modal transparent visible={visible} animationType="slide" statusBarTranslucent onRequestClose={submitting ? () => undefined : onCancel}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' }}>
        <Pressable style={{ flex: 1 }} onPress={submitting ? undefined : onCancel} />
        <View style={{ backgroundColor: Colors.bg.surface1, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 22, paddingBottom: 40, maxHeight: '88%' }}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={{ color: Colors.text.primary, fontSize: 24, fontWeight: '800' }}>Tarjeta amarilla</Text>
            <Text style={{ color: Colors.text.secondary, marginTop: 6 }}>Minuto automático: {match?.minute ?? 0}'</Text>

            <View style={{ marginTop: 20 }}>
              <TeamPicker homeTeam={match?.homeTeam ?? 'Local'} awayTeam={match?.awayTeam ?? 'Visitante'} value={team} onChange={(value) => { setTeam(value); setPlayerId(''); }} />
            </View>

            <View style={{ marginTop: 18 }}>
              <OptionSelectField label="Jugador" value={playerId} options={options} placeholder="Selecciona jugador" onChange={setPlayerId} />
            </View>

            <Text style={{ color: Colors.text.secondary, marginTop: 18, marginBottom: 8, fontWeight: '700' }}>Motivo / incidencia</Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Opcional"
              placeholderTextColor={Colors.text.disabled}
              style={{ minHeight: 52, borderRadius: 16, backgroundColor: Colors.bg.base, color: Colors.text.primary, paddingHorizontal: 16, borderWidth: 1, borderColor: Colors.bg.surface2 }}
            />

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
              <TouchableOpacity disabled={submitting} onPress={onCancel} style={{ flex: 1, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg.surface2 }}>
                <Text style={{ color: Colors.text.primary, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={!canConfirm || submitting} onPress={() => onConfirm({ team, playerId: Number(playerId), incidencias: reason.trim() || 'Sin especificar' })} style={{ flex: 1, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: canConfirm && !submitting ? Colors.semantic.warning : Colors.bg.surface2 }}>
                <Text style={{ color: Colors.bg.base, fontWeight: '800' }}>{submitting ? 'Guardando...' : 'Guardar'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export const YellowCardModal = memo(YellowCardModalComponent);
