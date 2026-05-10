/**
 * ProgrammedMatchesScreen
 * Lista real de partidos programados con tarjeta unificada.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StatusBar, Text, View } from 'react-native';
import { Colors } from '@/src/shared/constants/colors';
import { useActiveLeague } from '@/src/state/activeLeague/activeLeagueStore';
import { getDashboardPermissions } from '@/src/features/dashboard/services/dashboardService';
import { useMatchActionModals } from '../../hooks/useMatchActionModals';
import {
  getAwayTeamName,
  getHomeTeamName,
  getMatchDate,
  getUpcomingMatchesService,
  normalizeMatchStatus,
  parseBackendDateTimeLiteral,
  updateScheduledMatchService,
} from '../../services/matchesService';
import { subscribeMatchDataChanged, emitMatchDataChanged } from '../../services/matchSync';
import type { PartidoApi } from '../../types/matches.types';
import { ProgrammedMatchCard } from '../cards/ProgrammedMatchCard';
import { StartMatchModal } from '../modals/StartMatchModal';
import { EditScheduledMatchModal, type EditScheduledMatchData } from '../modals/EditScheduledMatchModal';

export function ProgrammedMatchesScreen() {
  const { session } = useActiveLeague();
  const leagueId = Number(session?.leagueId ?? 0);
  const role = (session?.role ?? 'observer') as Parameters<typeof getDashboardPermissions>[0];
  const permissions = getDashboardPermissions(role);

  const [matches, setMatches] = useState<PartidoApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingMatch, setEditingMatch] = useState<PartidoApi | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    if (!leagueId) return;
    setLoading(true);
    setError(null);
    try {
      setMatches(await getUpcomingMatchesService(leagueId, 50));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los partidos programados.');
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

  const { modals, activeStartMatch, openStartMatch, modalProps } = useMatchActionModals(load);
  const programmed = useMemo(() => matches.filter((m) => normalizeMatchStatus(m.estado) === 'programado'), [matches]);

  const handleEditConfirm = async (data: EditScheduledMatchData) => {
    if (!editingMatch) return;
    setSavingEdit(true);
    const result = await updateScheduledMatchService(editingMatch.id_partido, data);
    setSavingEdit(false);

    if (!result.success) {
      Alert.alert('No se pudo editar el partido', result.error ?? 'Inténtalo de nuevo.');
      return;
    }

    setEditingMatch(null);
    emitMatchDataChanged();
    await load();
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg.base }}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.brand.primary} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      >
        <Text style={{ color: Colors.text.primary, fontSize: 24, fontWeight: '900', marginBottom: 16 }}>Programados</Text>
        {loading && programmed.length === 0 ? <ActivityIndicator color={Colors.brand.primary} style={{ marginTop: 40 }} /> : null}
        {error ? <Text style={{ color: Colors.semantic.error, marginBottom: 16 }}>{error}</Text> : null}
        {programmed.length === 0 && !loading ? <Text style={{ color: Colors.text.disabled, textAlign: 'center', marginTop: 80 }}>No hay partidos programados.</Text> : null}

        {programmed.map((match) => {
          const parts = parseBackendDateTimeLiteral(getMatchDate(match));
          const cardMatch = {
            id: String(match.id_partido),
            homeTeam: getHomeTeamName(match),
            awayTeam: getAwayTeamName(match),
            day: parts.day,
            month: parts.month,
            time: parts.time,
            round: `Jornada ${match.jornada ?? match.numero_jornada ?? match.num_jornada ?? '–'}`,
            venue: match.estadio ?? '',
            startsAt: getMatchDate(match),
            rawDate: getMatchDate(match),
            homeColor: match.equipo_local?.color_primario ?? match.equipo_local?.colores ?? undefined,
            awayColor: match.equipo_visitante?.color_primario ?? match.equipo_visitante?.colores ?? undefined,
          };

          return (
            <ProgrammedMatchCard
              key={match.id_partido}
              match={cardMatch}
              permissions={permissions}
              actionsDisabled={modalProps.pending || savingEdit}
              onStartMatch={() => openStartMatch({ id: cardMatch.id, homeTeam: cardMatch.homeTeam, awayTeam: cardMatch.awayTeam, date: `${cardMatch.day} ${cardMatch.month}`, time: cardMatch.time, venue: cardMatch.venue })}
              onEditMatch={permissions.canEditMatch ? () => setEditingMatch(match) : undefined}
            />
          );
        })}
      </ScrollView>

      <StartMatchModal visible={modals.startMatch} match={activeStartMatch} onConfirm={modalProps.onStartMatchConfirm} onCancel={modalProps.onCloseStartMatch} isSubmitting={modalProps.pending} />
      <EditScheduledMatchModal visible={Boolean(editingMatch)} match={editingMatch} saving={savingEdit} onConfirm={handleEditConfirm} onCancel={() => { if (!savingEdit) setEditingMatch(null); }} />
    </View>
  );
}
