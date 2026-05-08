import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { getMatchByIdService, getHomeTeamId, getAwayTeamId, getHomeTeamName, getAwayTeamName } from '../../services/matchesService';
import { useConvocatoriaEquipo } from '@/src/features/convocatorias/hooks/useConvocatoriaEquipo';
import type { PartidoApi } from '../../types/matches.types';

function ReadOnlyAlignment({ title }: { title: string }) {
  const router = useRouter();
  const { matchId, teamId } = useLocalSearchParams<{ matchId: string; teamId?: string }>();
  const partidoId = Number(matchId);
  const [match, setMatch] = useState<PartidoApi | null>(null);
  const [side, setSide] = useState<'home' | 'away'>('home');

  useEffect(() => {
    let mounted = true;
    void getMatchByIdService(partidoId).then(result => { if (mounted && result.success && result.data) setMatch(result.data); });
    return () => { mounted = false; };
  }, [partidoId]);

  const homeId = match ? getHomeTeamId(match) : null;
  const awayId = match ? getAwayTeamId(match) : null;
  const selectedTeamId = Number(teamId) || (side === 'home' ? homeId : awayId) || null;
  const { players, counts, loading, error } = useConvocatoriaEquipo({ partidoId, equipoId: selectedTeamId, readonly: true });
  const titulares = useMemo(() => players.filter(p => p.estado === 'titular'), [players]);
  const suplentes = useMemo(() => players.filter(p => p.estado === 'suplente'), [players]);

  const renderList = (label: string, list: typeof players) => <View style={{ marginTop: 18 }}><Text style={{ color: Colors.brand.primary, fontWeight: '900', marginBottom: 10 }}>{label.toUpperCase()} · {list.length}</Text>{list.length === 0 ? <Text style={{ color: Colors.text.disabled }}>Sin jugadores.</Text> : list.map(p => <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg.surface1, borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.bg.surface2 }}><View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.bg.surface2, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}><Text style={{ color: Colors.text.primary, fontWeight: '800' }}>{p.dorsal}</Text></View><View style={{ flex: 1 }}><Text style={{ color: Colors.text.primary, fontWeight: '800' }}>{p.nombre}</Text><Text style={{ color: Colors.text.secondary, fontSize: 12, marginTop: 2 }}>{p.posicion}</Text></View></View>)}</View>;

  return <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.base }}><StatusBar barStyle="light-content" />
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.bg.surface2 }}><TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}><Ionicons name="arrow-back" size={24} color={Colors.text.primary} /></TouchableOpacity><View style={{ flex: 1 }}><Text style={{ color: Colors.text.primary, fontSize: 20, fontWeight: '900' }}>{title}</Text><Text style={{ color: Colors.text.secondary }}>{side === 'home' ? getHomeTeamName(match ?? {} as PartidoApi) : getAwayTeamName(match ?? {} as PartidoApi)}</Text></View></View>
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      {!teamId && match ? <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>{(['home','away'] as const).map(s => <TouchableOpacity key={s} onPress={() => setSide(s)} style={{ flex: 1, minHeight: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: side === s ? Colors.brand.primary + '22' : Colors.bg.surface1, borderWidth: 1, borderColor: side === s ? Colors.brand.primary : Colors.bg.surface2 }}><Text numberOfLines={1} style={{ color: side === s ? Colors.brand.primary : Colors.text.secondary, fontWeight: '800' }}>{s === 'home' ? getHomeTeamName(match) : getAwayTeamName(match)}</Text></TouchableOpacity>)}</View> : null}
      <View style={{ backgroundColor: Colors.bg.surface1, borderRadius: 22, padding: 16, borderWidth: 1, borderColor: Colors.bg.surface2 }}><Text style={{ color: Colors.text.primary, fontSize: 28, fontWeight: '900' }}>{counts.total}</Text><Text style={{ color: Colors.text.secondary, marginTop: 4 }}>Jugadores en alineación · {counts.titulares} titulares · {counts.suplentes} suplentes</Text></View>
      {loading ? <ActivityIndicator color={Colors.brand.primary} style={{ marginTop: 40 }} /> : error ? <Text style={{ color: Colors.semantic.error, marginTop: 20 }}>{error}</Text> : <>{renderList('Titulares', titulares)}{renderList('Suplentes', suplentes)}</>}
    </ScrollView>
  </SafeAreaView>;
}

export function ProgrammedMatchSquadScreen() {
  return <ReadOnlyAlignment title="Convocatoria" />;
}
