import React, { memo, useMemo, useState, useEffect } from 'react';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { OptionSelectField } from '@/src/shared/components/ui/OptionSelectField';
import type { SelectOption } from '@/src/shared/components/ui/OptionSelectField';
import type { LiveMatchContext, LiveMatchPlayer } from './RegisterEventModal';

function toOptions(players?: LiveMatchPlayer[]): SelectOption[] {
  return (players ?? []).map(p => ({
    value: String(p.id_jugador),
    label: `${p.dorsal ? p.dorsal + ' · ' : ''}${p.nombre}`,
  }));
}

function TeamPicker({ homeTeam, awayTeam, value, onChange }: { homeTeam: string; awayTeam: string; value: 'home' | 'away'; onChange: (v: 'home' | 'away') => void }) {
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
export interface RedCardEventData { team: 'home' | 'away'; playerId: number; cardType: RedCardType; }
interface RedCardModalProps { visible: boolean; match: LiveMatchContext | null; submitting?: boolean; onConfirm: (data: RedCardEventData) => void; onCancel: () => void; }
function RedCardModalComponent({ visible, match, submitting = false, onConfirm, onCancel }: RedCardModalProps) {
  const [team, setTeam] = useState<'home' | 'away'>('home'); const [playerId, setPlayerId] = useState(''); const [cardType, setCardType] = useState<RedCardType>('direct');
  useEffect(() => { if (visible) { setTeam('home'); setPlayerId(''); setCardType('direct'); } }, [visible]);
  const options = useMemo(() => toOptions(team === 'home' ? match?.homePlayers : match?.awayPlayers), [team, match]);
  const canConfirm = Number(playerId) > 0;
  return <Modal transparent visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onCancel}><View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' }}><Pressable style={{ flex: 1 }} onPress={submitting ? undefined : onCancel} /><View style={{ backgroundColor: Colors.bg.surface1, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 22, paddingBottom: 40 }}><Text style={{ color: Colors.text.primary, fontSize: 24, fontWeight: '800' }}>Tarjeta roja</Text><Text style={{ color: Colors.text.secondary, marginTop: 6 }}>Minuto automático: {match?.minute ?? 0}'</Text><View style={{ marginTop: 20 }}><TeamPicker homeTeam={match?.homeTeam ?? 'Local'} awayTeam={match?.awayTeam ?? 'Visitante'} value={team} onChange={(v) => { setTeam(v); setPlayerId(''); }} /></View><View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>{(['direct','second_yellow'] as const).map(t => <TouchableOpacity key={t} onPress={() => setCardType(t)} style={{ flex: 1, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: cardType===t ? Colors.semantic.error+'25' : Colors.bg.surface2, borderWidth: 1, borderColor: cardType===t ? Colors.semantic.error : 'transparent' }}><Text style={{ color: cardType===t ? Colors.semantic.error : Colors.text.secondary, fontWeight: '700' }}>{t==='direct'?'Directa':'2ª amarilla'}</Text></TouchableOpacity>)}</View><View style={{ marginTop: 18 }}><OptionSelectField label="Jugador" value={playerId} options={options} placeholder="Selecciona jugador" onChange={setPlayerId} /></View><View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}><TouchableOpacity disabled={submitting} onPress={onCancel} style={{ flex: 1, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg.surface2 }}><Text style={{ color: Colors.text.primary, fontWeight: '700' }}>Cancelar</Text></TouchableOpacity><TouchableOpacity disabled={!canConfirm || submitting} onPress={() => onConfirm({ team, playerId: Number(playerId), cardType })} style={{ flex: 1, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: canConfirm ? Colors.semantic.error : Colors.bg.surface2 }}><Text style={{ color: Colors.text.primary, fontWeight: '800' }}>{submitting ? 'Guardando...' : 'Guardar'}</Text></TouchableOpacity></View></View></View></Modal>;
}
export const RedCardModal = memo(RedCardModalComponent);
