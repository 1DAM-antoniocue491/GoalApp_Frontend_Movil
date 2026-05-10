/**
 * LiveMatchesScreen
 * Partidos en vivo reales. Eventos con minuto automático y finalización con MVP real.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { useActiveLeague } from '@/src/state/activeLeague/activeLeagueStore';
import { useMatchActionModals } from '../../hooks/useMatchActionModals';
import {
  getAwayTeamId,
  getAwayTeamName,
  getHomeTeamId,
  getHomeTeamName,
  getLeagueMatchDurationService,
  getLiveMatchesService,
  getLiveMinute,
  normalizeMatchStatus,
} from '../../services/matchesService';
import type { PartidoApi } from '../../types/matches.types';
import { RegisterEventModal } from '../modals/RegisterEventModal';
import { GoalEventModal } from '../modals/GoalEventModal';
import { YellowCardModal } from '../modals/YellowCardModal';
import { RedCardModal } from '../modals/RedCardModal';
import { SubstitutionModal } from '../modals/SubstitutionModal';
import { EndMatchModal } from '../modals/EndMatchModal';

export function LiveMatchesScreen() {
  const router = useRouter();
  const { session } = useActiveLeague();
  const leagueId = Number(session?.leagueId ?? 0);
  const [matches, setMatches] = useState<PartidoApi[]>([]);
  const [duration, setDuration] = useState(90);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0);

  const load = useCallback(async () => {
    if (!leagueId) return;
    setLoading(true);
    setError(null);
    try {
      const [live, leagueDuration] = await Promise.all([
        getLiveMatchesService(leagueId),
        getLeagueMatchDurationService(leagueId),
      ]);
      setMatches(live);
      setDuration(leagueDuration);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los partidos en vivo.');
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const id = setInterval(() => {
      setTick(value => value + 1);
      void load();
    }, 30000);
    return () => clearInterval(id);
  }, [load]);

  const { modals, activeEventMatch, activeEndMatch, openRegisterEvent, openEndMatch, modalProps } = useMatchActionModals(load);
  const interactionLocked = loading || modalProps.pending.any;

  const liveMatches = useMemo(
    () => matches.filter(match => normalizeMatchStatus(match.estado) === 'en_juego'),
    [matches],
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg.base }}>
      <StatusBar barStyle="light-content" />
      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.brand.primary} />} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text style={{ color: Colors.text.primary, fontSize: 24, fontWeight: '900', marginBottom: 16 }}>En vivo</Text>
        {loading && liveMatches.length === 0 ? <ActivityIndicator color={Colors.brand.primary} style={{ marginTop: 40 }} /> : null}
        {error ? <Text style={{ color: Colors.semantic.error, marginBottom: 16 }}>{error}</Text> : null}
        {liveMatches.length === 0 && !loading ? <Text style={{ color: Colors.text.disabled, textAlign: 'center', marginTop: 80 }}>No hay partidos en vivo.</Text> : null}

        {liveMatches.map(match => {
          const matchDuration = duration;
          const minute = getLiveMinute(match, undefined, matchDuration);
          const homeTeamId = getHomeTeamId(match) ?? undefined;
          const awayTeamId = getAwayTeamId(match) ?? undefined;
          const context = {
            id: String(match.id_partido),
            homeTeam: getHomeTeamName(match),
            awayTeam: getAwayTeamName(match),
            homeTeamId,
            awayTeamId,
            homeScore: match.goles_local ?? 0,
            awayScore: match.goles_visitante ?? 0,
            minute,
            duration: matchDuration,
            startedAt: match.inicio_en ?? match.started_at ?? match.fecha_inicio ?? null,
          };

          return (
            <View key={match.id_partido} style={{ backgroundColor: Colors.bg.surface1, borderRadius: 24, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: Colors.brand.primary + '45' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: Colors.brand.primary, fontWeight: '900' }}>● EN VIVO</Text>
                <Text style={{ color: Colors.text.primary, fontWeight: '900' }}>{minute}' / {matchDuration}'</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22 }}>
                <Text style={{ color: Colors.text.primary, fontSize: 16, fontWeight: '800', flex: 1 }}>{context.homeTeam}</Text>
                <Text style={{ color: Colors.text.primary, fontSize: 34, fontWeight: '900' }}>{context.homeScore} - {context.awayScore}</Text>
                <Text style={{ color: Colors.text.primary, fontSize: 16, fontWeight: '800', flex: 1, textAlign: 'right' }}>{context.awayTeam}</Text>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
                <TouchableOpacity disabled={interactionLocked} onPress={() => router.push(`/matches/live/${match.id_partido}/squad`)} style={{ flexGrow: 1, height: 44, borderRadius: 14, backgroundColor: Colors.bg.surface2, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, opacity: interactionLocked ? 0.45 : 1 }}>
                  <Ionicons name="people-outline" size={18} color={Colors.text.primary} />
                  <Text style={{ color: Colors.text.primary, fontWeight: '800' }}>Ver plantillas</Text>
                </TouchableOpacity>
                <TouchableOpacity disabled={interactionLocked} onPress={() => openRegisterEvent(context)} style={{ flexGrow: 1, height: 44, borderRadius: 14, backgroundColor: interactionLocked ? Colors.bg.surface2 : Colors.brand.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, opacity: interactionLocked ? 0.55 : 1 }}>
                  <Ionicons name="add-circle-outline" size={18} color={interactionLocked ? Colors.text.disabled : Colors.bg.base} />
                  <Text style={{ color: interactionLocked ? Colors.text.disabled : Colors.bg.base, fontWeight: '900' }}>{modalProps.pending.hydratingEventPlayers ? 'Cargando...' : 'Evento'}</Text>
                </TouchableOpacity>
                <TouchableOpacity disabled={interactionLocked} onPress={() => openEndMatch(context)} style={{ flexGrow: 1, height: 44, borderRadius: 14, backgroundColor: Colors.semantic.error + '22', alignItems: 'center', justifyContent: 'center', opacity: interactionLocked ? 0.45 : 1 }}>
                  <Text style={{ color: Colors.semantic.error, fontWeight: '900' }}>{modalProps.pending.hydratingEndMatch ? 'Cargando...' : 'Finalizar'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <RegisterEventModal visible={modals.registerEvent} match={activeEventMatch} disabled={modalProps.pending.any} loading={modalProps.pending.hydratingEventPlayers} onSelectEvent={modalProps.onSelectEvent} onCancel={modalProps.onCloseRegisterEvent} />
      <GoalEventModal visible={modals.goal} match={activeEventMatch} submitting={modalProps.pending.submittingEvent} onConfirm={modalProps.onGoalConfirm} onCancel={modalProps.onCloseGoal} />
      <YellowCardModal visible={modals.yellowCard} match={activeEventMatch} submitting={modalProps.pending.submittingEvent} onConfirm={modalProps.onYellowCardConfirm} onCancel={modalProps.onCloseYellowCard} />
      <RedCardModal visible={modals.redCard} match={activeEventMatch} submitting={modalProps.pending.submittingEvent} onConfirm={modalProps.onRedCardConfirm} onCancel={modalProps.onCloseRedCard} />
      <SubstitutionModal visible={modals.substitution} match={activeEventMatch} submitting={modalProps.pending.submittingEvent} onConfirm={modalProps.onSubstitutionConfirm} onCancel={modalProps.onCloseSubstitution} />
      <EndMatchModal visible={modals.endMatch} match={activeEndMatch} submitting={modalProps.pending.endingMatch || modalProps.pending.hydratingEndMatch} onConfirm={modalProps.onEndMatchConfirm} onCancel={modalProps.onCloseEndMatch} />
    </View>
  );
}
