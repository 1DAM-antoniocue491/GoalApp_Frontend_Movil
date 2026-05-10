/**
 * LiveMatchesScreen
 * Usa la misma tarjeta funcional que dashboard y calendario.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StatusBar, Text, View } from 'react-native';
import { Colors } from '@/src/shared/constants/colors';
import { useActiveLeague } from '@/src/state/activeLeague/activeLeagueStore';
import { getDashboardPermissions } from '@/src/features/dashboard/services/dashboardService';
import { useMatchActionModals } from '../../hooks/useMatchActionModals';
import {
  getAwayTeamId,
  getAwayTeamName,
  getHomeTeamId,
  getHomeTeamName,
  getLiveMatchesService,
  getLiveMinute,
  getMatchDate,
  getMatchDurationFromPartido,
  normalizeMatchStatus,
} from '../../services/matchesService';
import { subscribeMatchDataChanged } from '../../services/matchSync';
import type { PartidoApi } from '../../types/matches.types';
import { LiveMatchCard } from '../cards/LiveMatchCard';
import { RegisterEventModal } from '../modals/RegisterEventModal';
import { GoalEventModal } from '../modals/GoalEventModal';
import { YellowCardModal } from '../modals/YellowCardModal';
import { RedCardModal } from '../modals/RedCardModal';
import { SubstitutionModal } from '../modals/SubstitutionModal';
import { EndMatchModal } from '../modals/EndMatchModal';

export function LiveMatchesScreen() {
  const { session } = useActiveLeague();
  const leagueId = Number(session?.leagueId ?? 0);
  const role = (session?.role ?? 'observer') as Parameters<typeof getDashboardPermissions>[0];
  const permissions = getDashboardPermissions(role);

  const [matches, setMatches] = useState<PartidoApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    if (!leagueId) return;
    setLoading(true);
    setError(null);
    try {
      setMatches(await getLiveMatchesService(leagueId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los partidos en vivo.');
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => subscribeMatchDataChanged(load), [load]);
  useEffect(() => {
    const intervalId = setInterval(() => {
      setTick((value) => value + 1);
      void load();
    }, 30000);
    return () => clearInterval(intervalId);
  }, [load]);

  const { modals, activeEventMatch, activeEndMatch, openRegisterEvent, openEndMatch, modalProps } = useMatchActionModals(load);

  const liveMatches = useMemo(
    () => matches.filter((m) => normalizeMatchStatus(m.estado) === 'en_juego'),
    [matches],
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg.base }}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.brand.primary} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      >
        <Text style={{ color: Colors.text.primary, fontSize: 24, fontWeight: '900', marginBottom: 16 }}>En vivo</Text>
        {loading && liveMatches.length === 0 ? <ActivityIndicator color={Colors.brand.primary} style={{ marginTop: 40 }} /> : null}
        {error ? <Text style={{ color: Colors.semantic.error, marginBottom: 16 }}>{error}</Text> : null}
        {liveMatches.length === 0 && !loading ? <Text style={{ color: Colors.text.disabled, textAlign: 'center', marginTop: 80 }}>No hay partidos en vivo.</Text> : null}

        {liveMatches.map((match) => {
          const duration = getMatchDurationFromPartido(match);
          const minute = getLiveMinute(match, tick);
          const homeTeamId = getHomeTeamId(match) ?? undefined;
          const awayTeamId = getAwayTeamId(match) ?? undefined;
          const cardMatch = {
            id: String(match.id_partido),
            homeTeam: getHomeTeamName(match),
            awayTeam: getAwayTeamName(match),
            homeScore: match.goles_local ?? 0,
            awayScore: match.goles_visitante ?? 0,
            minute,
            duration,
            startedAt: match.inicio_en ?? match.started_at ?? match.fecha_inicio ?? getMatchDate(match),
            homeTeamId,
            awayTeamId,
            leagueName: session?.leagueName ?? '',
            venue: match.estadio ?? '',
            homeShieldLetter: getHomeTeamName(match).charAt(0).toUpperCase(),
            awayShieldLetter: getAwayTeamName(match).charAt(0).toUpperCase(),
            homeColor: match.equipo_local?.color_primario ?? match.equipo_local?.colores ?? undefined,
            awayColor: match.equipo_visitante?.color_primario ?? match.equipo_visitante?.colores ?? undefined,
          };
          const eventsLocked = minute >= duration;

          return (
            <LiveMatchCard
              key={match.id_partido}
              match={{ ...cardMatch, eventsLocked }}
              permissions={permissions}
              actionsDisabled={modalProps.pending}
              onRegisterEvent={() => openRegisterEvent({ ...cardMatch, eventsLocked })}
              onEndMatch={() => openEndMatch(cardMatch)}
            />
          );
        })}
      </ScrollView>

      <RegisterEventModal visible={modals.registerEvent} match={activeEventMatch} onSelectEvent={modalProps.onSelectEvent} onCancel={modalProps.onCloseRegisterEvent} isSubmitting={modalProps.pending} />
      <GoalEventModal visible={modals.goal} match={activeEventMatch} onConfirm={modalProps.onGoalConfirm} onCancel={modalProps.onCloseGoal} isSubmitting={modalProps.pending} />
      <YellowCardModal visible={modals.yellowCard} match={activeEventMatch} onConfirm={modalProps.onYellowCardConfirm} onCancel={modalProps.onCloseYellowCard} isSubmitting={modalProps.pending} />
      <RedCardModal visible={modals.redCard} match={activeEventMatch} onConfirm={modalProps.onRedCardConfirm} onCancel={modalProps.onCloseRedCard} isSubmitting={modalProps.pending} />
      <SubstitutionModal visible={modals.substitution} match={activeEventMatch} onConfirm={modalProps.onSubstitutionConfirm} onCancel={modalProps.onCloseSubstitution} isSubmitting={modalProps.pending} />
      <EndMatchModal visible={modals.endMatch} match={activeEndMatch} onConfirm={modalProps.onEndMatchConfirm} onCancel={modalProps.onCloseEndMatch} isSubmitting={modalProps.pending} />
    </View>
  );
}
