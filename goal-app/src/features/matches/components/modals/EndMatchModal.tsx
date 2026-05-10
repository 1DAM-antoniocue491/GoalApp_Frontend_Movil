/**
 * EndMatchModal.tsx
 * Finalización real de partido con selección de MVP desde jugadores reales.
 */

import React, { memo, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/src/shared/constants/colors';
import { OptionSelectField } from '@/src/shared/components/ui/OptionSelectField';
import type { SelectOption } from '@/src/shared/components/ui/OptionSelectField';
import type { LiveMatchPlayer } from './RegisterEventModal';

export interface LiveMatchSummary {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeTeamId?: number | null;
  awayTeamId?: number | null;
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
  /** Evita dobles toques y bloquea cierre mientras hay petición activa. */
  submitting?: boolean;
}

function toOptions(players?: LiveMatchPlayer[]): SelectOption[] {
  return (players ?? []).map(p => ({ value: String(p.id_jugador), label: `${p.dorsal ? p.dorsal + ' · ' : ''}${p.nombre}` }));
}

function EndMatchModalComponent({ visible, match, onConfirm, onCancel, submitting = false }: EndMatchModalProps) {
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
  const canConfirm = Number(mvpId) > 0 && Number.isFinite(parsedScore) && parsedScore >= 0 && parsedScore <= 10;

  return (
    <Modal transparent visible={visible} animationType="slide" statusBarTranslucent onRequestClose={submitting ? () => undefined : onCancel}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' }}>
        <Pressable style={{ flex: 1 }} onPress={submitting ? undefined : onCancel} />
        <View style={{ backgroundColor: Colors.bg.surface1, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 22, paddingBottom: 40, maxHeight: '88%' }}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={{ color: Colors.text.primary, fontSize: 24, fontWeight: '800' }}>Finalizar partido</Text>
            {match ? <Text style={{ color: Colors.text.secondary, marginTop: 6 }}>{match.homeTeam} {match.homeScore}–{match.awayScore} {match.awayTeam}</Text> : null}

            <Text style={{ color: Colors.text.secondary, marginTop: 22, marginBottom: 10, fontWeight: '700' }}>Equipo del MVP</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {(['home','away'] as const).map(side => {
                const active = mvpTeam === side;
                return <TouchableOpacity key={side} onPress={() => { setMvpTeam(side); setMvpId(''); }} style={{ flex: 1, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? Colors.brand.primary + '22' : Colors.bg.surface2, borderWidth: 1, borderColor: active ? Colors.brand.primary : 'transparent' }}><Text numberOfLines={1} style={{ color: active ? Colors.brand.primary : Colors.text.secondary, fontWeight: '800' }}>{side === 'home' ? match?.homeTeam ?? 'Local' : match?.awayTeam ?? 'Visitante'}</Text></TouchableOpacity>;
              })}
            </View>

            <View style={{ marginTop: 18 }}>
              <OptionSelectField label="MVP del partido" value={mvpId} options={options} placeholder="Selecciona jugador" onChange={setMvpId} />
            </View>

            <Text style={{ color: Colors.text.secondary, marginTop: 18, marginBottom: 8, fontWeight: '700' }}>Puntuación MVP</Text>
            <TextInput value={mvpScore} onChangeText={setMvpScore} keyboardType="decimal-pad" placeholder="0 - 10" placeholderTextColor={Colors.text.disabled} style={{ height: 52, borderRadius: 16, backgroundColor: Colors.bg.base, color: Colors.text.primary, paddingHorizontal: 16, borderWidth: 1, borderColor: Colors.bg.surface2, fontSize: 16 }} />

            <Text style={{ color: Colors.text.secondary, marginTop: 18, marginBottom: 8, fontWeight: '700' }}>Incidencias</Text>
            <TextInput value={observations} onChangeText={setObservations} multiline placeholder="Observaciones opcionales" placeholderTextColor={Colors.text.disabled} style={{ minHeight: 88, borderRadius: 16, backgroundColor: Colors.bg.base, color: Colors.text.primary, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: Colors.bg.surface2, fontSize: 15, textAlignVertical: 'top' }} />

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
              <TouchableOpacity disabled={submitting} onPress={onCancel} style={{ flex: 1, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg.surface2 }}><Text style={{ color: Colors.text.primary, fontWeight: '700' }}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity disabled={!canConfirm || submitting} onPress={() => onConfirm({ mvpId: Number(mvpId), mvpTeam, mvpScore: parsedScore, observations: observations.trim() || undefined })} style={{ flex: 1, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: canConfirm && !submitting ? Colors.semantic.error : Colors.bg.surface2 }}><Text style={{ color: Colors.text.primary, fontWeight: '800' }}>{submitting ? 'Finalizando...' : 'Finalizar'}</Text></TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export const EndMatchModal = memo(EndMatchModalComponent);
