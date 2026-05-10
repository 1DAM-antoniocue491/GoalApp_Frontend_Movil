/**
 * EndMatchModal.tsx
 * Finalización de partido: muestra el marcador calculado desde eventos (editable),
 * selección de MVP y puntuación. Funciona igual que el FinishMatchModal de la web.
 */

import React, { memo, useEffect, useState } from 'react';
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
  homePlayers?: LiveMatchPlayer[];
  awayPlayers?: LiveMatchPlayer[];
}

export interface EndMatchData {
  mvpId: number;
  mvpTeam: 'home' | 'away';
  mvpScore: number;
  homeScore: number;
  awayScore: number;
  observations?: string;
}

interface EndMatchModalProps {
  visible: boolean;
  match: LiveMatchSummary | null;
  submitting?: boolean;
  onConfirm: (data: EndMatchData) => void;
  onCancel: () => void;
}

function toOptions(players?: LiveMatchPlayer[]): SelectOption[] {
  return (players ?? []).map(p => ({ value: String(p.id_jugador), label: `${p.dorsal ? p.dorsal + ' · ' : ''}${p.nombre}` }));
}

function ScoreButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: Colors.bg.base,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.bg.surface2,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Text style={{ color: Colors.text.primary, fontSize: 20, fontWeight: '700', lineHeight: 24 }}>{label}</Text>
    </TouchableOpacity>
  );
}

function EndMatchModalComponent({ visible, match, submitting = false, onConfirm, onCancel }: EndMatchModalProps) {
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [mvpTeam, setMvpTeam] = useState<'home' | 'away'>('home');
  const [mvpId, setMvpId] = useState('');
  const [mvpScore, setMvpScore] = useState('8');
  const [observations, setObservations] = useState('');

  useEffect(() => {
    if (visible) {
      setHomeScore(match?.homeScore ?? 0);
      setAwayScore(match?.awayScore ?? 0);
      setMvpTeam('home');
      setMvpId('');
      setMvpScore('8');
      setObservations('');
    }
  }, [visible, match?.homeScore, match?.awayScore]);

  // Resync scores if match hydration updates them after modal is already open
  useEffect(() => {
    if (visible && match != null) {
      setHomeScore(match.homeScore);
      setAwayScore(match.awayScore);
    }
  }, [match?.homeScore, match?.awayScore]);

  const mvpOptions = toOptions(mvpTeam === 'home' ? match?.homePlayers : match?.awayPlayers);
  const parsedMvpScore = Number(String(mvpScore).replace(',', '.'));
  const canConfirm =
    Number(mvpId) > 0 &&
    Number.isFinite(parsedMvpScore) &&
    parsedMvpScore >= 1 &&
    parsedMvpScore <= 10 &&
    homeScore >= 0 &&
    awayScore >= 0 &&
    !submitting;

  return (
    <Modal transparent visible={visible} animationType="slide" statusBarTranslucent onRequestClose={submitting ? () => undefined : onCancel}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' }}>
        <Pressable style={{ flex: 1 }} onPress={submitting ? undefined : onCancel} />
        <View style={{ backgroundColor: Colors.bg.surface1, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 22, paddingBottom: 40, maxHeight: '92%' }}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={{ color: Colors.text.primary, fontSize: 24, fontWeight: '800' }}>Finalizar partido</Text>
            {match ? (
              <Text style={{ color: Colors.text.secondary, marginTop: 4 }}>
                {match.homeTeam} vs {match.awayTeam}
              </Text>
            ) : null}

            {/* ── Marcador final ── */}
            <Text style={{ color: Colors.text.secondary, marginTop: 22, marginBottom: 12, fontWeight: '700' }}>
              Resultado final
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {/* Local */}
              <View style={{ flex: 1, backgroundColor: Colors.bg.surface2, borderRadius: 16, padding: 14, alignItems: 'center', gap: 10 }}>
                <Text numberOfLines={1} style={{ color: Colors.text.primary, fontWeight: '700', fontSize: 13 }}>
                  {match?.homeTeam ?? 'Local'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <ScoreButton label="−" disabled={submitting || homeScore <= 0} onPress={() => setHomeScore(s => Math.max(0, s - 1))} />
                  <Text style={{ color: Colors.text.primary, fontSize: 32, fontWeight: '900', minWidth: 30, textAlign: 'center' }}>{homeScore}</Text>
                  <ScoreButton label="+" disabled={submitting} onPress={() => setHomeScore(s => s + 1)} />
                </View>
              </View>
              {/* Visitante */}
              <View style={{ flex: 1, backgroundColor: Colors.bg.surface2, borderRadius: 16, padding: 14, alignItems: 'center', gap: 10 }}>
                <Text numberOfLines={1} style={{ color: Colors.text.primary, fontWeight: '700', fontSize: 13 }}>
                  {match?.awayTeam ?? 'Visitante'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <ScoreButton label="−" disabled={submitting || awayScore <= 0} onPress={() => setAwayScore(s => Math.max(0, s - 1))} />
                  <Text style={{ color: Colors.text.primary, fontSize: 32, fontWeight: '900', minWidth: 30, textAlign: 'center' }}>{awayScore}</Text>
                  <ScoreButton label="+" disabled={submitting} onPress={() => setAwayScore(s => s + 1)} />
                </View>
              </View>
            </View>

            {/* ── Equipo MVP ── */}
            <Text style={{ color: Colors.text.secondary, marginTop: 22, marginBottom: 10, fontWeight: '700' }}>
              Equipo del MVP
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {(['home', 'away'] as const).map(side => {
                const active = mvpTeam === side;
                return (
                  <TouchableOpacity
                    key={side}
                    onPress={() => { setMvpTeam(side); setMvpId(''); }}
                    style={{
                      flex: 1, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: active ? Colors.brand.primary + '22' : Colors.bg.surface2,
                      borderWidth: 1,
                      borderColor: active ? Colors.brand.primary : 'transparent',
                    }}
                  >
                    <Text numberOfLines={1} style={{ color: active ? Colors.brand.primary : Colors.text.secondary, fontWeight: '800' }}>
                      {side === 'home' ? match?.homeTeam ?? 'Local' : match?.awayTeam ?? 'Visitante'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Jugador MVP ── */}
            <View style={{ marginTop: 18 }}>
              <OptionSelectField
                label="MVP del partido"
                value={mvpId}
                options={mvpOptions}
                placeholder={match?.homePlayers || match?.awayPlayers ? 'Selecciona jugador' : 'Cargando jugadores...'}
                onChange={setMvpId}
              />
            </View>

            {/* ── Puntuación MVP ── */}
            <Text style={{ color: Colors.text.secondary, marginTop: 18, marginBottom: 8, fontWeight: '700' }}>
              Puntuación MVP (1–10)
            </Text>
            <TextInput
              value={mvpScore}
              editable={!submitting}
              onChangeText={setMvpScore}
              keyboardType="decimal-pad"
              placeholder="1 - 10"
              placeholderTextColor={Colors.text.disabled}
              style={{
                height: 52, borderRadius: 16, backgroundColor: Colors.bg.base,
                color: Colors.text.primary, paddingHorizontal: 16,
                borderWidth: 1, borderColor: Colors.bg.surface2, fontSize: 16,
              }}
            />

            {/* ── Incidencias ── */}
            <Text style={{ color: Colors.text.secondary, marginTop: 18, marginBottom: 8, fontWeight: '700' }}>
              Incidencias
            </Text>
            <TextInput
              value={observations}
              editable={!submitting}
              onChangeText={setObservations}
              multiline
              placeholder="Observaciones opcionales"
              placeholderTextColor={Colors.text.disabled}
              style={{
                minHeight: 80, borderRadius: 16, backgroundColor: Colors.bg.base,
                color: Colors.text.primary, paddingHorizontal: 16, paddingVertical: 14,
                borderWidth: 1, borderColor: Colors.bg.surface2, fontSize: 15, textAlignVertical: 'top',
              }}
            />

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
              <TouchableOpacity
                disabled={submitting}
                onPress={onCancel}
                style={{ flex: 1, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg.surface2 }}
              >
                <Text style={{ color: Colors.text.primary, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!canConfirm}
                onPress={() => onConfirm({
                  mvpId: Number(mvpId),
                  mvpTeam,
                  mvpScore: parsedMvpScore,
                  homeScore,
                  awayScore,
                  observations: observations.trim() || undefined,
                })}
                style={{
                  flex: 1, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: canConfirm ? Colors.semantic.error : Colors.bg.surface2,
                }}
              >
                <Text style={{ color: Colors.text.primary, fontWeight: '800' }}>
                  {submitting ? 'Finalizando...' : 'Finalizar'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export const EndMatchModal = memo(EndMatchModalComponent);
