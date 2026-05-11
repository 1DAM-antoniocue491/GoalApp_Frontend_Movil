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

export interface GoalEventData {
  team: 'home' | 'away';
  scorerId: number;
  ownGoal: boolean;
}

interface GoalEventModalProps { visible: boolean; match: LiveMatchContext | null; submitting?: boolean; onConfirm: (data: GoalEventData) => void; onCancel: () => void; }

function GoalEventModalComponent({ visible, match, submitting = false, onConfirm, onCancel }: GoalEventModalProps) {
  const [team, setTeam] = useState<'home' | 'away'>('home');
  const [playerId, setPlayerId] = useState('');
  const [ownGoal, setOwnGoal] = useState(false);
  useEffect(() => { if (visible) { setTeam('home'); setPlayerId(''); setOwnGoal(false); } }, [visible]);
  const options = useMemo(() => toOptions(team === 'home' ? match?.homePlayers : match?.awayPlayers), [team, match]);
  const canConfirm = Number(playerId) > 0;
  return (
    <Modal transparent visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onCancel}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' }}><Pressable style={{ flex: 1 }} onPress={submitting ? undefined : onCancel} />
        <View style={{ backgroundColor: Colors.bg.surface1, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 22, paddingBottom: 40 }}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={{ color: Colors.text.primary, fontSize: 24, fontWeight: '800' }}>Registrar gol</Text>
            <Text style={{ color: Colors.text.secondary, marginTop: 6 }}>Minuto automático: {match?.minute ?? 0}'</Text>
            <View style={{ marginTop: 20 }}><TeamPicker homeTeam={match?.homeTeam ?? 'Local'} awayTeam={match?.awayTeam ?? 'Visitante'} value={team} onChange={(v) => { setTeam(v); setPlayerId(''); }} /></View>
            <View style={{ marginTop: 18 }}><OptionSelectField label="Jugador" value={playerId} options={options} placeholder="Selecciona jugador" onChange={setPlayerId} /></View>
            <TouchableOpacity onPress={() => setOwnGoal(v => !v)} style={{ marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name={ownGoal ? 'checkbox' : 'square-outline'} size={22} color={Colors.brand.primary} />
              <Text style={{ color: Colors.text.secondary }}>Gol en propia puerta</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
              <TouchableOpacity disabled={submitting} onPress={onCancel} style={{ flex: 1, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg.surface2 }}><Text style={{ color: Colors.text.primary, fontWeight: '700' }}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity disabled={!canConfirm || submitting} onPress={() => onConfirm({ team, scorerId: Number(playerId), ownGoal })} style={{ flex: 1, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: canConfirm ? Colors.brand.primary : Colors.bg.surface2 }}><Text style={{ color: canConfirm ? Colors.bg.base : Colors.text.disabled, fontWeight: '800' }}>{submitting ? 'Guardando...' : 'Guardar'}</Text></TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
export const GoalEventModal = memo(GoalEventModalComponent);
