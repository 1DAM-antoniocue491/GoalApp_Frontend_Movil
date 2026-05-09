/**
 * TeamDetailScreen.tsx
 *
 * Pantalla de detalle de un equipo.
 *
 * PARÁMETROS DE RUTA:
 * Expo Router pasa `teamId` como query param desde /league/team?teamId=X
 * Se convierte a number antes de llamar al hook.
 *
 * TABS:
 * - Información: stats de temporada, próximo partido e info del club
 * - Plantilla:   jugadores agrupados por posición (empty state si no disponible)
 *
 * ENDPOINTS:
 * - GET /equipos/{equipo_id}/detalle via useTeamDetail
 * - GET /partidos/ligas/{liga_id}/con-equipos via matchesService
 *
 * Regla importante:
 * El próximo partido del equipo se calcula a partir del mismo conjunto de datos
 * que alimenta la lista de “Partidos Programados”. Así evitamos que el detalle
 * dependa de un endpoint secundario que puede no estar sincronizado.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTeamDetail } from '../hooks/useTeams';
import { TeamInformationTab } from './TeamInformationTab';
import { TeamSquadTab } from './TeamSquadTab';
import { Colors } from '@/src/shared/constants/colors';
import { useActiveLeague } from '@/src/state/activeLeague/activeLeagueStore';
import {
  getMatchesByLeagueService,
  normalizeMatchStatus,
} from '@/src/features/matches/services/matchesService';
import type { PartidoApi } from '@/src/features/matches/types/matches.types';

type Tab = 'info' | 'squad';

export function TeamDetailScreen() {
  const router = useRouter();
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const { session } = useActiveLeague();
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [programmedMatches, setProgrammedMatches] = useState<PartidoApi[]>([]);

  const id = teamId ? Number(teamId) : 0;
  const leagueId = Number(session?.leagueId ?? 0);
  const { data: detail, isLoading, isError, refetch } = useTeamDetail(id);

  /**
   * Carga los partidos programados de la liga activa.
   * Se hace aquí, en el padre, para que TeamInformationTab sea un componente
   * presentacional: recibe datos por props y solo decide qué partido destacar.
   */
  const loadProgrammedMatches = useCallback(async () => {
    if (leagueId <= 0) {
      setProgrammedMatches([]);
      return;
    }

    try {
      const leagueMatches = await getMatchesByLeagueService(leagueId);

      // Usamos la misma fuente que la lista de programados y filtramos solo los
      // partidos futuros/programados para evitar mostrar partidos en vivo/finalizados.
      const scheduled = leagueMatches.filter(
        match => normalizeMatchStatus(match.estado) === 'programado',
      );

      setProgrammedMatches(scheduled);
    } catch {
      // No bloqueamos el detalle del equipo si fallan los partidos programados.
      // El bloque de “Próximo partido” simplemente no se renderizará.
      setProgrammedMatches([]);
    }
  }, [leagueId]);

  useEffect(() => {
    loadProgrammedMatches();
  }, [loadProgrammedMatches]);

  // Sin teamId en params — no debería ocurrir en flujo normal
  if (!teamId || id <= 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Equipo no especificado</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          {isLoading ? (
            <View style={styles.headerSkeleton} />
          ) : (
            <>
              {/* Escudo — inicial sobre fondo del color del equipo */}
              <View
                style={[
                  styles.headerShield,
                  { borderColor: detail?.color_primario ?? Colors.brand.primary },
                ]}
              >
                <Text style={[styles.headerInitial, { color: detail?.color_primario ?? Colors.brand.primary }]}>
                  {detail?.nombre?.charAt(0).toUpperCase() ?? '?'}
                </Text>
              </View>
              <Text style={styles.headerName} numberOfLines={1}>
                {detail?.nombre ?? '–'}
              </Text>
            </>
          )}
        </View>

        {/* Botón reintentar si hay error */}
        {isError ? (
          <TouchableOpacity onPress={refetch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="refresh" size={20} color={Colors.brand.primary} />
          </TouchableOpacity>
        ) : (
          // Placeholder para mantener el centrado del título
          <View style={{ width: 22 }} />
        )}
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabBar}>
        {(['info', 'squad'] as Tab[]).map((tab) => {
          const label = tab === 'info' ? 'Información' : 'Plantilla';
          const active = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, active && styles.tabItemActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Contenido ── */}
      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.brand.primary} />
        </View>
      )}

      {isError && !isLoading && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>No se pudo cargar el equipo</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isLoading && !isError && detail && (
        <>
          {activeTab === 'info' && (
            <TeamInformationTab
              detail={detail}
              programmedMatches={programmedMatches}
            />
          )}
          {activeTab === 'squad' && (
            <TeamSquadTab jugadores={detail.jugadores} />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerShield: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: Colors.bg.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInitial: {
    fontSize: 14,
    fontWeight: '700',
  },
  headerName: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 17,
    fontWeight: '700',
  },
  headerSkeleton: {
    flex: 1,
    height: 18,
    borderRadius: 6,
    backgroundColor: Colors.bg.surface2,
    opacity: 0.5,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.bg.surface2,
    marginHorizontal: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: Colors.brand.primary,
  },
  tabLabel: {
    color: Colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: Colors.brand.primary,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    color: Colors.text.secondary,
    fontSize: 15,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.brand.primary,
  },
  retryText: {
    color: Colors.brand.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
