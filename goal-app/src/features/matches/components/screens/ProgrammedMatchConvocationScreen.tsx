/**
 * ProgrammedMatchConvocationScreen
 * Convocatoria real por equipo: titular / suplente / no convocado.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { SearchInput } from '@/src/shared/components/ui/SearchInput';
import { getMatchByIdService, getHomeTeamId, getAwayTeamId, getHomeTeamName, getAwayTeamName } from '../../services/matchesService';
import { useConvocatoriaEquipo } from '@/src/features/convocatorias/hooks/useConvocatoriaEquipo';
import type { ConvocatoriaPlayer, ConvocatoriaPlayerState } from '@/src/features/convocatorias/types/convocatoria.types';
import type { PartidoApi } from '../../types/matches.types';

const POSITION_ORDER: ConvocatoriaPlayer['posicion'][] = ['POR', 'DEF', 'MED', 'DEL', 'OTR'];
const POSITION_LABEL: Record<ConvocatoriaPlayer['posicion'], string> = { POR: 'Porteros', DEF: 'Defensas', MED: 'Centrocampistas', DEL: 'Delanteros', OTR: 'Otros' };
const POSITION_COLOR: Record<ConvocatoriaPlayer['posicion'], string> = { POR: Colors.semantic.warning, DEF: Colors.brand.secondary, MED: Colors.brand.primary, DEL: Colors.semantic.error, OTR: Colors.text.secondary };

function StateButton({ label, active, color, onPress, disabled }: { label: string; active: boolean; color: string; onPress: () => void; disabled?: boolean }) {
  return <TouchableOpacity disabled={disabled} onPress={onPress} style={{ flex: 1, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? color + '24' : Colors.bg.surface2, borderWidth: 1, borderColor: active ? color : 'transparent', opacity: disabled ? 0.45 : 1 }}><Text style={{ color: active ? color : Colors.text.secondary, fontSize: 12, fontWeight: '800' }}>{label}</Text></TouchableOpacity>;
}

function PlayerRow({ player, onChange, disabled }: { player: ConvocatoriaPlayer; onChange: (state: ConvocatoriaPlayerState) => void; disabled?: boolean }) {
  const posColor = POSITION_COLOR[player.posicion];
  return <View style={{ backgroundColor: Colors.bg.surface1, borderRadius: 18, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: player.estado !== 'no_convocado' ? Colors.brand.primary + '35' : Colors.bg.surface2 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.bg.surface2, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: Colors.text.primary, fontWeight: '800' }}>{player.dorsal}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: Colors.text.primary, fontSize: 15, fontWeight: '800' }}>{player.nombre}</Text>
        <Text style={{ color: posColor, fontSize: 11, fontWeight: '700', marginTop: 2 }}>{player.posicion}</Text>
      </View>
    </View>
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
      <StateButton disabled={disabled} label="Fuera" active={player.estado === 'no_convocado'} color={Colors.text.secondary} onPress={() => onChange('no_convocado')} />
      <StateButton disabled={disabled} label="Suplente" active={player.estado === 'suplente'} color={Colors.brand.secondary} onPress={() => onChange('suplente')} />
      <StateButton disabled={disabled} label="Titular" active={player.estado === 'titular'} color={Colors.brand.primary} onPress={() => onChange('titular')} />
    </View>
  </View>;
}

export function ProgrammedMatchConvocationScreen() {
  const router = useRouter();
  const { matchId, teamId } = useLocalSearchParams<{ matchId: string; teamId?: string }>();
  const partidoId = Number(matchId);
  const [match, setMatch] = useState<PartidoApi | null>(null);
  const [selectedSide, setSelectedSide] = useState<'home' | 'away'>('home');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    void getMatchByIdService(partidoId).then(result => {
      if (mounted && result.success && result.data) setMatch(result.data);
    });
    return () => { mounted = false; };
  }, [partidoId]);

  const homeTeamId = match ? getHomeTeamId(match) : null;
  const awayTeamId = match ? getAwayTeamId(match) : null;
  const selectedTeamId = Number(teamId) || (selectedSide === 'home' ? homeTeamId : awayTeamId) || null;

  const { players, counts, limits, locked, lockReason, canEdit, loading, saving, error, setPlayerState, save } = useConvocatoriaEquipo({ partidoId, equipoId: selectedTeamId });
  const actionsLocked = loading || saving;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return players.filter(p => !q || p.nombre.toLowerCase().includes(q) || p.dorsal.includes(q));
  }, [players, query]);

  const grouped = POSITION_ORDER.map(position => ({ position, players: filtered.filter(p => p.posicion === position) })).filter(g => g.players.length > 0);

  const persist = async (allowUnderMin = false) => {
    if (actionsLocked) return;
    const ok = await save({ allowUnderMin });
    if (ok) {
      Alert.alert('Convocatoria guardada', 'La convocatoria se actualizó correctamente.', [{ text: 'Aceptar', onPress: () => router.back() }]);
    }
  };

  const handleSave = async () => {
    if (actionsLocked) return;
    // Regla migrada desde Web: si hay menos del mínimo, se avisa y se permite guardar solo con confirmación explícita.
    if (limits && counts.total < limits.minConvocados) {
      Alert.alert(
        'Convocatoria por debajo del mínimo',
        `Tienes menos de ${limits.minConvocados} jugadores convocados. ¿Quieres guardar igualmente?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Guardar igualmente', style: 'destructive', onPress: () => { void persist(true); } },
        ],
      );
      return;
    }
    await persist(false);
  };

  return <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.base }}><StatusBar barStyle="light-content" />
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.bg.surface2 }}>
      <TouchableOpacity disabled={saving} onPress={() => router.back()} style={{ marginRight: 12, opacity: saving ? 0.45 : 1 }}><Ionicons name="arrow-back" size={24} color={Colors.text.primary} /></TouchableOpacity>
      <View style={{ flex: 1 }}><Text style={{ color: Colors.text.primary, fontSize: 20, fontWeight: '800' }}>Convocatoria</Text><Text style={{ color: Colors.text.secondary, marginTop: 2 }}>{selectedSide === 'home' ? getHomeTeamName(match ?? {} as PartidoApi) : getAwayTeamName(match ?? {} as PartidoApi)}</Text></View>
    </View>

    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      {!teamId && match ? <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>{(['home','away'] as const).map(side => <TouchableOpacity key={side} disabled={actionsLocked} onPress={() => setSelectedSide(side)} style={{ flex: 1, minHeight: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: selectedSide === side ? Colors.brand.primary + '22' : Colors.bg.surface1, borderWidth: 1, borderColor: selectedSide === side ? Colors.brand.primary : Colors.bg.surface2, opacity: actionsLocked ? 0.55 : 1 }}><Text numberOfLines={1} style={{ color: selectedSide === side ? Colors.brand.primary : Colors.text.secondary, fontWeight: '800' }}>{side === 'home' ? getHomeTeamName(match) : getAwayTeamName(match)}</Text></TouchableOpacity>)}</View> : null}

      <View style={{ backgroundColor: Colors.bg.surface1, borderRadius: 22, padding: 16, borderWidth: 1, borderColor: Colors.bg.surface2, marginBottom: 16 }}>
        <Text style={{ color: Colors.text.primary, fontSize: 28, fontWeight: '900' }}>{counts.total}</Text>
        <Text style={{ color: Colors.text.secondary, marginTop: 4 }}>Convocados · {counts.titulares} titulares · {counts.suplentes} suplentes</Text>
        {limits ? <Text style={{ color: Colors.text.disabled, marginTop: 8 }}>Rango permitido: {limits.minConvocados}-{limits.maxConvocados} · titulares máx. {limits.maxTitulares}</Text> : null}
        {locked ? <Text style={{ color: Colors.semantic.warning, marginTop: 10 }}>{lockReason}</Text> : null}
        {error ? <Text style={{ color: Colors.semantic.error, marginTop: 10 }}>{error}</Text> : null}
      </View>

      <SearchInput value={query} onChangeText={actionsLocked ? () => undefined : setQuery} placeholder="Buscar jugador..." />

      {loading ? <ActivityIndicator color={Colors.brand.primary} style={{ marginTop: 40 }} /> : grouped.map(group => <View key={group.position} style={{ marginTop: 18 }}>
        <Text style={{ color: POSITION_COLOR[group.position], fontWeight: '800', marginBottom: 10 }}>{POSITION_LABEL[group.position].toUpperCase()} · {group.players.length}</Text>
        {group.players.map(player => <PlayerRow key={player.id} player={player} disabled={!canEdit || actionsLocked} onChange={(state) => setPlayerState(player.id_jugador, state)} />)}
      </View>)}
    </ScrollView>

    {canEdit ? <View style={{ position: 'absolute', left: 16, right: 16, bottom: 24 }}><TouchableOpacity disabled={actionsLocked} onPress={handleSave} style={{ height: 58, borderRadius: 18, backgroundColor: actionsLocked ? Colors.bg.surface2 : Colors.brand.primary, alignItems: 'center', justifyContent: 'center', opacity: actionsLocked ? 0.65 : 1 }}><Text style={{ color: actionsLocked ? Colors.text.disabled : Colors.bg.base, fontSize: 17, fontWeight: '900' }}>{saving ? 'Guardando...' : 'Guardar convocatoria'}</Text></TouchableOpacity></View> : null}
  </SafeAreaView>;
}
