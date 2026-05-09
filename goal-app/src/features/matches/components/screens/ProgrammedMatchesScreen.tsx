/**
 * ProgrammedMatchesScreen
 * Lista real de partidos programados. Iniciar partido con API real.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { useActiveLeague } from '@/src/state/activeLeague/activeLeagueStore';
import { useMatchActionModals } from '../../hooks/useMatchActionModals';
import { getAwayTeamName, getHomeTeamName, getMatchDate, getUpcomingMatchesService, normalizeMatchStatus } from '../../services/matchesService';
import type { PartidoApi } from '../../types/matches.types';
import { StartMatchModal } from '../modals/StartMatchModal';

function formatDate(raw?: string | null): string {
  if (!raw) return 'Fecha sin definir';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function ProgrammedMatchesScreen() {
  const router = useRouter();
  const { session } = useActiveLeague();
  const leagueId = Number(session?.leagueId ?? 0);
  const [matches, setMatches] = useState<PartidoApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!leagueId) return;
    setLoading(true); setError(null);
    try { setMatches(await getUpcomingMatchesService(leagueId, 50)); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudieron cargar los partidos programados.'); }
    finally { setLoading(false); }
  }, [leagueId]);

  useEffect(() => { load(); }, [load]);
  const { modals, activeStartMatch, openStartMatch, modalProps } = useMatchActionModals(load);
  const programmed = useMemo(() => matches.filter(m => normalizeMatchStatus(m.estado) === 'programado'), [matches]);

  return <View style={{ flex: 1, backgroundColor: Colors.bg.base }}><StatusBar barStyle="light-content" />
    <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.brand.primary} />} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
      <Text style={{ color: Colors.text.primary, fontSize: 24, fontWeight: '900', marginBottom: 16 }}>Programados</Text>
      {loading && programmed.length === 0 ? <ActivityIndicator color={Colors.brand.primary} style={{ marginTop: 40 }} /> : null}
      {error ? <Text style={{ color: Colors.semantic.error, marginBottom: 16 }}>{error}</Text> : null}
      {programmed.length === 0 && !loading ? <Text style={{ color: Colors.text.disabled, textAlign: 'center', marginTop: 80 }}>No hay partidos programados.</Text> : null}
      {programmed.map(match => {
        const context = { id: String(match.id_partido), homeTeam: getHomeTeamName(match), awayTeam: getAwayTeamName(match), date: formatDate(getMatchDate(match)), venue: match.estadio ?? undefined };
        return <View key={match.id_partido} style={{ backgroundColor: Colors.bg.surface1, borderRadius: 24, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: Colors.bg.surface2 }}>
          <Text style={{ color: Colors.text.secondary, fontWeight: '800' }}>{formatDate(getMatchDate(match))}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }}><Text style={{ color: Colors.text.primary, fontSize: 16, fontWeight: '800', flex: 1 }}>{context.homeTeam}</Text><Text style={{ color: Colors.text.disabled, fontWeight: '800' }}>vs</Text><Text style={{ color: Colors.text.primary, fontSize: 16, fontWeight: '800', flex: 1, textAlign: 'right' }}>{context.awayTeam}</Text></View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
            <TouchableOpacity onPress={() => router.push(`/matches/programmed/${match.id_partido}/convocation`)} style={{ flexGrow: 1, height: 44, borderRadius: 14, backgroundColor: Colors.bg.surface2, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}><Ionicons name="people-outline" size={18} color={Colors.text.primary} /><Text style={{ color: Colors.text.primary, fontWeight: '800' }}>Convocatoria</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => router.push(`/matches/programmed/${match.id_partido}/lineup`)} style={{ flexGrow: 1, height: 44, borderRadius: 14, backgroundColor: Colors.bg.surface2, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}><Ionicons name="shirt-outline" size={18} color={Colors.text.primary} /><Text style={{ color: Colors.text.primary, fontWeight: '800' }}>Alineación</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => openStartMatch(context)} style={{ flexGrow: 1, height: 44, borderRadius: 14, backgroundColor: Colors.brand.primary, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: Colors.bg.base, fontWeight: '900' }}>Iniciar</Text></TouchableOpacity>
          </View> 
        </View>;
      })}
    </ScrollView>
    <StartMatchModal visible={modals.startMatch} match={activeStartMatch} onConfirm={modalProps.onStartMatchConfirm} onCancel={modalProps.onCloseStartMatch} />
  </View>;
}
