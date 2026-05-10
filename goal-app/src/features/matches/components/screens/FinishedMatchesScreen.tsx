/**
 * FinishedMatchesScreen
 * Histórico real de partidos finalizados por liga activa.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StatusBar, Text, View } from 'react-native';
import { Colors } from '@/src/shared/constants/colors';
import { useActiveLeague } from '@/src/state/activeLeague/activeLeagueStore';
import {
  getAwayTeamName,
  getFinishedMatchesService,
  getHomeTeamName,
  getJornadaNumber,
  getMatchDate,
} from '../../services/matchesService';
import type { PartidoApi } from '../../types/matches.types';

function formatDate(raw?: string | null): string {
  if (!raw) return 'Fecha sin definir';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function FinishedMatchesScreen() {
  const { session } = useActiveLeague();
  const leagueId = Number(session?.leagueId ?? 0);
  const [matches, setMatches] = useState<PartidoApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!leagueId) return;
    setLoading(true);
    setError(null);
    try {
      setMatches(await getFinishedMatchesService(leagueId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los partidos finalizados.');
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  useEffect(() => { load(); }, [load]);

  const grouped = useMemo(() => {
    const map = new Map<string, PartidoApi[]>();
    matches.forEach(match => {
      const key = `Jornada ${getJornadaNumber(match) ?? '-'}`;
      const current = map.get(key) ?? [];
      current.push(match);
      map.set(key, current);
    });
    return Array.from(map.entries());
  }, [matches]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg.base }}>
      <StatusBar barStyle="light-content" />
      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.brand.primary} />} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text style={{ color: Colors.text.primary, fontSize: 24, fontWeight: '900', marginBottom: 16 }}>Finalizados</Text>
        {loading && matches.length === 0 ? <ActivityIndicator color={Colors.brand.primary} style={{ marginTop: 40 }} /> : null}
        {error ? <Text style={{ color: Colors.semantic.error, marginBottom: 16 }}>{error}</Text> : null}
        {matches.length === 0 && !loading ? <Text style={{ color: Colors.text.disabled, textAlign: 'center', marginTop: 80 }}>No hay resultados disponibles.</Text> : null}

        {grouped.map(([round, roundMatches]) => (
          <View key={round} style={{ marginBottom: 18 }}>
            <Text style={{ color: Colors.brand.primary, fontWeight: '900', marginBottom: 10 }}>{round.toUpperCase()}</Text>
            {roundMatches.map(match => (
              <View key={match.id_partido} style={{ backgroundColor: Colors.bg.surface1, borderRadius: 20, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: Colors.bg.surface2 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <Text style={{ color: Colors.text.disabled, fontSize: 12 }}>{formatDate(getMatchDate(match))}</Text>
                  <View style={{ backgroundColor: Colors.bg.surface2, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
                    <Text style={{ color: Colors.text.disabled, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>FINALIZADO</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text numberOfLines={2} style={{ color: Colors.text.primary, fontSize: 15, fontWeight: '800', flex: 1 }}>{getHomeTeamName(match)}</Text>
                  <Text style={{ color: Colors.text.primary, fontSize: 34, fontWeight: '900', marginHorizontal: 16 }}>{match.goles_local ?? 0} - {match.goles_visitante ?? 0}</Text>
                  <Text numberOfLines={2} style={{ color: Colors.text.primary, fontSize: 15, fontWeight: '800', flex: 1, textAlign: 'right' }}>{getAwayTeamName(match)}</Text>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
