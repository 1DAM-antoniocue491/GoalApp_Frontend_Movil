/**
 * ProgrammedMatchesScreen
 * Lista real de partidos programados. Iniciar, convocar, alinear y editar con API real.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { useActiveLeague } from '@/src/state/activeLeague/activeLeagueStore';
import { useMatchActionModals } from '../../hooks/useMatchActionModals';
import {
  getAwayTeamName,
  getHomeTeamName,
  getMatchDate,
  getUpcomingMatchesService,
  normalizeMatchStatus,
  updateScheduledMatchService,
} from '../../services/matchesService';
import type { PartidoApi } from '../../types/matches.types';
import { StartMatchModal } from '../modals/StartMatchModal';
import { EditScheduledMatchModal } from '../modals/EditScheduledMatchModal';
import type { EditScheduledMatchData } from '../modals/EditScheduledMatchModal';

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
  const [editVisible, setEditVisible] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [activeEditMatch, setActiveEditMatch] = useState<PartidoApi | null>(null);

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

  const { modals, activeStartMatch, openStartMatch, modalProps } = useMatchActionModals(load);
  const interactionLocked = loading || editSaving || modalProps.pending.any;

  const programmed = useMemo(
    () => matches.filter(match => normalizeMatchStatus(match.estado) === 'programado'),
    [matches],
  );

  const openEdit = (match: PartidoApi) => {
    if (interactionLocked) return;
    setActiveEditMatch(match);
    setEditVisible(true);
  };

  const closeEdit = () => {
    if (editSaving) return;
    setEditVisible(false);
    setActiveEditMatch(null);
  };

  const handleEditConfirm = async (data: EditScheduledMatchData) => {
    if (!activeEditMatch || editSaving) return;
    setEditSaving(true);
    const result = await updateScheduledMatchService(activeEditMatch.id_partido, data);
    setEditSaving(false);

    if (!result.success) {
      Alert.alert('No se pudo actualizar el partido', result.error || 'Inténtalo de nuevo.');
      return;
    }

    setEditVisible(false);
    setActiveEditMatch(null);
    Alert.alert('Partido actualizado', 'Los cambios se han guardado correctamente.');
    await load();
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg.base }}>
      <StatusBar barStyle="light-content" />
      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.brand.primary} />} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text style={{ color: Colors.text.primary, fontSize: 24, fontWeight: '900', marginBottom: 16 }}>Programados</Text>
        {loading && programmed.length === 0 ? <ActivityIndicator color={Colors.brand.primary} style={{ marginTop: 40 }} /> : null}
        {error ? <Text style={{ color: Colors.semantic.error, marginBottom: 16 }}>{error}</Text> : null}
        {programmed.length === 0 && !loading ? <Text style={{ color: Colors.text.disabled, textAlign: 'center', marginTop: 80 }}>No hay partidos programados.</Text> : null}

        {programmed.map(match => {
          const context = {
            id: String(match.id_partido),
            homeTeam: getHomeTeamName(match),
            awayTeam: getAwayTeamName(match),
            date: formatDate(getMatchDate(match)),
            venue: match.estadio ?? undefined,
          };

          return (
            <View key={match.id_partido} style={{ backgroundColor: Colors.bg.surface1, borderRadius: 24, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: Colors.bg.surface2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: Colors.text.secondary, fontWeight: '800' }}>{formatDate(getMatchDate(match))}</Text>
                <TouchableOpacity disabled={interactionLocked} onPress={() => openEdit(match)} style={{ height: 34, paddingHorizontal: 12, borderRadius: 12, backgroundColor: Colors.bg.surface2, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, opacity: interactionLocked ? 0.45 : 1 }}>
                  <Ionicons name="create-outline" size={15} color={Colors.text.primary} />
                  <Text style={{ color: Colors.text.primary, fontWeight: '800', fontSize: 12 }}>Editar</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }}>
                <Text style={{ color: Colors.text.primary, fontSize: 16, fontWeight: '800', flex: 1 }}>{context.homeTeam}</Text>
                <Text style={{ color: Colors.text.disabled, fontWeight: '800' }}>vs</Text>
                <Text style={{ color: Colors.text.primary, fontSize: 16, fontWeight: '800', flex: 1, textAlign: 'right' }}>{context.awayTeam}</Text>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
                <TouchableOpacity disabled={interactionLocked} onPress={() => router.push(`/matches/programmed/${match.id_partido}/convocation`)} style={{ flexGrow: 1, height: 44, borderRadius: 14, backgroundColor: Colors.bg.surface2, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, opacity: interactionLocked ? 0.45 : 1 }}>
                  <Ionicons name="people-outline" size={18} color={Colors.text.primary} />
                  <Text style={{ color: Colors.text.primary, fontWeight: '800' }}>Convocatoria</Text>
                </TouchableOpacity>
                <TouchableOpacity disabled={interactionLocked} onPress={() => router.push(`/matches/programmed/${match.id_partido}/lineup`)} style={{ flexGrow: 1, height: 44, borderRadius: 14, backgroundColor: Colors.bg.surface2, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, opacity: interactionLocked ? 0.45 : 1 }}>
                  <Ionicons name="shirt-outline" size={18} color={Colors.text.primary} />
                  <Text style={{ color: Colors.text.primary, fontWeight: '800' }}>Alineación</Text>
                </TouchableOpacity>
                <TouchableOpacity disabled={interactionLocked} onPress={() => openStartMatch(context)} style={{ flexGrow: 1, height: 44, borderRadius: 14, backgroundColor: interactionLocked ? Colors.bg.surface2 : Colors.brand.primary, alignItems: 'center', justifyContent: 'center', opacity: interactionLocked ? 0.55 : 1 }}>
                  <Text style={{ color: interactionLocked ? Colors.text.disabled : Colors.bg.base, fontWeight: '900' }}>{modalProps.pending.startingMatch ? 'Iniciando...' : 'Iniciar'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <StartMatchModal visible={modals.startMatch} match={activeStartMatch} submitting={modalProps.pending.startingMatch} onConfirm={modalProps.onStartMatchConfirm} onCancel={modalProps.onCloseStartMatch} />
      <EditScheduledMatchModal visible={editVisible} match={activeEditMatch} saving={editSaving} onConfirm={handleEditConfirm} onCancel={closeEdit} />
    </View>
  );
}
