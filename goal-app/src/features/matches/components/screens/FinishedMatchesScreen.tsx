/**
 * FinishedMatchesScreen
 * Histórico real de partidos finalizados. Sale automáticamente de en vivo tras finalizar.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StatusBar, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/src/shared/constants/colors';
import { routes } from '@/src/shared/config/routes';
import { useActiveLeague } from '@/src/state/activeLeague/activeLeagueStore';
import { FinishedMatchCard } from '@/src/features/matches/components/cards/FinishedMatchCard';
import {
  getAwayTeamName,
  getFinishedMatchesService,
  getHomeTeamName,
  getMatchDate,
  parseBackendDateTimeLiteral,
} from '../../services/matchesService';
import { subscribeMatchDataChanged } from '../../services/matchSync';
import type { PartidoApi } from '../../types/matches.types';

export function FinishedMatchesScreen() {
  const router = useRouter();
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
  useEffect(() => subscribeMatchDataChanged(load), [load]);
  useEffect(() => {
    const intervalId = setInterval(load, 30000);
    return () => clearInterval(intervalId);
  }, [load]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg.base }}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.brand.primary} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ color: Colors.text.primary, fontSize: 24, fontWeight: '900', marginBottom: 16 }}>Finalizados</Text>
        {loading && matches.length === 0 ? <ActivityIndicator color={Colors.brand.primary} style={{ marginTop: 40 }} /> : null}
        {error ? <Text style={{ color: Colors.semantic.error, marginBottom: 16 }}>{error}</Text> : null}
        {matches.length === 0 && !loading ? <Text style={{ color: Colors.text.disabled, textAlign: 'center', marginTop: 80 }}>No hay partidos finalizados.</Text> : null}

        {matches.map((match) => {
          const parts = parseBackendDateTimeLiteral(getMatchDate(match));
          const cardMatch = {
            id: String(match.id_partido),
            homeTeam: getHomeTeamName(match),
            awayTeam: getAwayTeamName(match),
            homeScore: match.goles_local ?? 0,
            awayScore: match.goles_visitante ?? 0,
            date: parts.dateFormatted,
            round: `Jornada ${match.jornada ?? match.numero_jornada ?? match.num_jornada ?? '–'}`,
            leagueName: session?.leagueName ?? '',
            venue: match.estadio ?? '',
            homeColor: match.equipo_local?.color_primario ?? match.equipo_local?.colores ?? undefined,
            awayColor: match.equipo_visitante?.color_primario ?? match.equipo_visitante?.colores ?? undefined,
            homeShieldLetter: getHomeTeamName(match).charAt(0).toUpperCase(),
            awayShieldLetter: getAwayTeamName(match).charAt(0).toUpperCase(),
          };

          return (
            <FinishedMatchCard
              key={match.id_partido}
              match={cardMatch}
              onPress={() => router.push(routes.private.matchRoutes.finished.detail(cardMatch.id) as never)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}
