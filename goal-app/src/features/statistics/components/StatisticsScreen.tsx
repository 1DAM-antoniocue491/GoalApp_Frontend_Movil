/**
 * StatisticsScreen — Pantalla principal de estadísticas de liga
 *
 * Bloques:
 * A. Métricas generales de temporada
 * B. Mis estadísticas (solo jugadores)
 * C. MVP de la jornada
 * D. Máximos goleadores (top 5)
 * E. Goles por equipo (barra proporcional)
 *
 * Diseño premium dark mobile-first.
 * Sin mocks, sin react-icons, sin hardcoded data.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { useStatistics } from '../hooks/useStatistics';
import { useActiveLeague } from '@/src/state/activeLeague/activeLeagueStore';
import { safeNumber, safeString, getInitials } from '../types/statistics.types';
import type { TeamGoalsStats, TopScorerResponse } from '../types/statistics.types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = theme.spacing.sm;
const METRIC_CARD_WIDTH = (SCREEN_WIDTH - theme.spacing.lg * 2 - CARD_GAP) / 2;

// ─── Componentes internos ────────────────────────────────────────────────────

/** Tarjeta de métrica simple (valor + etiqueta + icono) */
function MetricCard({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <View style={[styles.metricCard, { width: METRIC_CARD_WIDTH }]}>
      <View style={[styles.metricIconWrap, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

/** Fila de goleador con ranking, iniciales, nombre, equipo y goles */
function ScorerRow({
  scorer,
  rank,
}: {
  scorer: TopScorerResponse;
  rank: number;
}) {
  const name = safeString(scorer.nombre, 'Jugador');
  const team = safeString(scorer.nombre_equipo, '—');
  const goals = safeNumber(scorer.goles, 0);
  const matches = safeNumber(scorer.partidos_jugados, 0);
  const avg = safeNumber(scorer.promedio_goles, 0);

  const rankColor =
    rank === 1
      ? Colors.semantic.warning
      : rank === 2
        ? Colors.text.secondary
        : rank === 3
          ? '#CD7F32'
          : Colors.text.disabled;

  return (
    <View style={styles.scorerRow}>
      {/* Ranking */}
      <Text style={[styles.scorerRank, { color: rankColor }]}>
        {rank}
      </Text>

      {/* Avatar iniciales */}
      <View style={styles.scorerAvatar}>
        <Text style={styles.scorerAvatarText}>{getInitials(name)}</Text>
      </View>

      {/* Nombre y equipo */}
      <View style={styles.scorerInfo}>
        <Text style={styles.scorerName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.scorerTeam} numberOfLines={1}>
          {team}
        </Text>
      </View>

      {/* Stats derechas */}
      <View style={styles.scorerStats}>
        <Text style={styles.scorerGoals}>{goals}</Text>
        <Text style={styles.scorerAvgText}>
          {matches > 0 ? avg.toFixed(2) : '0.00'}/PJ
        </Text>
      </View>
    </View>
  );
}

/** Fila de equipo con barra proporcional de goles */
function TeamGoalRow({
  team,
  maxGoals,
}: {
  team: TeamGoalsStats;
  maxGoals: number;
}) {
  const name = safeString(team.nombre, 'Equipo');
  const goals = safeNumber(team.goles_favor, 0);
  const matches = safeNumber(team.partidos_jugados, 0);
  const avg = safeNumber(team.promedio_goles_favor, 0);
  const barWidth = maxGoals > 0 ? (goals / maxGoals) * 100 : 0;

  return (
    <View style={styles.teamGoalRow}>
      {/* Iniciales de equipo */}
      <View style={styles.teamInitialBadge}>
        <Text style={styles.teamInitialText}>{getInitials(name)}</Text>
      </View>

      <View style={styles.teamGoalInfo}>
        <View style={styles.teamGoalHeader}>
          <Text style={styles.teamGoalName} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.teamGoalNumbers}>
            <Text style={styles.teamGoalCount}>{goals} goles</Text>
            <Text style={styles.teamGoalAvg}>
              {matches > 0 ? avg.toFixed(1) : '0.0'}/PJ
            </Text>
          </View>
        </View>
        {/* Barra proporcional */}
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              { width: `${barWidth}%` as `${number}%` },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

/** Sección con título y borde izquierdo de color */
function SectionHeader({ title, icon }: { title: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionAccent} />
      <Ionicons name={icon} size={16} color={Colors.brand.primary} style={{ marginRight: 8 }} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// ─── Pantalla principal ──────────────────────────────────────────────────────

export function StatisticsScreen() {
  const { session: leagueSession } = useActiveLeague();
  const {
    seasonStats,
    topScorers,
    matchdayMVP,
    teamGoalsStats,
    myStats,
    isLoading,
    isRefreshing,
    error,
    refresh,
  } = useStatistics();

  const hasActiveLeague = !!leagueSession;
  const leagueName = safeString(leagueSession?.leagueName, '');

  // ── Sin liga activa ──────────────────────────────────────────────────────
  if (!hasActiveLeague) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Estadísticas</Text>
        </View>
        <View style={styles.emptyCenter}>
          <Ionicons name="bar-chart-outline" size={48} color={Colors.text.disabled} />
          <Text style={styles.emptyTitle}>Sin liga activa</Text>
          <Text style={styles.emptySubtitle}>Selecciona una liga primero</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Loading inicial ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Estadísticas</Text>
          {leagueName ? (
            <Text style={styles.headerSub}>{leagueName}</Text>
          ) : null}
        </View>
        <View style={styles.emptyCenter}>
          <ActivityIndicator size="large" color={Colors.brand.primary} />
          <Text style={styles.loadingText}>Cargando estadísticas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error crítico ────────────────────────────────────────────────────────
  if (error && !seasonStats) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Estadísticas</Text>
          {leagueName ? (
            <Text style={styles.headerSub}>{leagueName}</Text>
          ) : null}
        </View>
        <View style={styles.emptyCenter}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.semantic.error} />
          <Text style={styles.errorTitle}>No se pudieron cargar las estadísticas</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Sin datos aún ────────────────────────────────────────────────────────
  const hasAnyData =
    seasonStats ||
    topScorers.length > 0 ||
    matchdayMVP ||
    teamGoalsStats.length > 0;

  if (!hasAnyData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Estadísticas</Text>
          {leagueName ? (
            <Text style={styles.headerSub}>{leagueName}</Text>
          ) : null}
        </View>
        <View style={styles.emptyCenter}>
          <Ionicons name="stats-chart-outline" size={48} color={Colors.text.disabled} />
          <Text style={styles.emptyTitle}>Sin estadísticas</Text>
          <Text style={styles.emptySubtitle}>
            Todavía no hay estadísticas disponibles
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Valor máximo de goles para escalar las barras
  const maxGoals = Math.max(...teamGoalsStats.map((t) => t.goles_favor), 1);

  // ── Contenido principal ──────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Estadísticas</Text>
        {leagueName ? (
          <Text style={styles.headerSub}>{leagueName}</Text>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={Colors.brand.primary}
            colors={[Colors.brand.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── A. Métricas generales ── */}
        <SectionHeader title="Temporada" icon="trophy-outline" />
        <View style={styles.metricsGrid}>
          <MetricCard
            icon="football-outline"
            label="Goles"
            value={safeNumber(seasonStats?.total_goles)}
            color={Colors.brand.primary}
          />
          <MetricCard
            icon="square-outline"
            label="Amarillas"
            value={safeNumber(seasonStats?.total_amarillas)}
            color={Colors.semantic.warning}
          />
          <MetricCard
            icon="stop-outline"
            label="Rojas"
            value={safeNumber(seasonStats?.total_rojas)}
            color={Colors.semantic.error}
          />
          <MetricCard
            icon="calendar-outline"
            label="Partidos"
            value={safeNumber(seasonStats?.total_partidos)}
            color={Colors.brand.secondary}
          />
        </View>

        {/* ── B. Mis estadísticas (solo jugadores) ── */}
        {myStats ? (
          <>
            <SectionHeader title="Mis estadísticas" icon="person-outline" />
            <View style={styles.card}>
              <View style={styles.myStatsGrid}>
                {[
                  { label: 'Goles', value: safeNumber(myStats.goles), icon: 'football-outline' as const, color: Colors.brand.primary },
                  { label: 'Asistencias', value: safeNumber(myStats.asistencias), icon: 'hand-right-outline' as const, color: Colors.brand.secondary },
                  { label: 'Partidos', value: safeNumber(myStats.partidos_jugados), icon: 'calendar-outline' as const, color: Colors.brand.accent },
                  { label: 'MVPs', value: safeNumber(myStats.veces_mvp), icon: 'star-outline' as const, color: Colors.semantic.warning },
                  { label: 'Amarillas', value: safeNumber(myStats.tarjetas_amarillas), icon: 'square-outline' as const, color: Colors.semantic.warning },
                  { label: 'Rojas', value: safeNumber(myStats.tarjetas_rojas), icon: 'stop-outline' as const, color: Colors.semantic.error },
                ].map((stat) => (
                  <View key={stat.label} style={styles.myStatItem}>
                    <Ionicons name={stat.icon} size={18} color={stat.color} />
                    <Text style={styles.myStatValue}>{stat.value}</Text>
                    <Text style={styles.myStatLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : null}

        {/* ── C. MVP de la jornada ── */}
        {matchdayMVP ? (
          <>
            <SectionHeader title="MVP de la jornada" icon="star-outline" />
            <View style={[styles.card, styles.mvpCard]}>
              {/* Badge jornada */}
              <View style={styles.mvpJornadaBadge}>
                <Text style={styles.mvpJornadaText}>
                  Jornada {safeNumber(matchdayMVP.jornada)}
                </Text>
              </View>

              <View style={styles.mvpContent}>
                {/* Avatar */}
                <View style={styles.mvpAvatar}>
                  <Text style={styles.mvpAvatarText}>
                    {getInitials(safeString(matchdayMVP.nombre, 'MVP'))}
                  </Text>
                  {/* Estrella */}
                  <View style={styles.mvpStarBadge}>
                    <Ionicons name="star" size={10} color={Colors.bg.base} />
                  </View>
                </View>

                {/* Info */}
                <View style={styles.mvpInfo}>
                  <Text style={styles.mvpName} numberOfLines={1}>
                    {safeString(matchdayMVP.nombre, 'Jugador')}
                  </Text>
                  <Text style={styles.mvpTeam} numberOfLines={1}>
                    {safeString(matchdayMVP.nombre_equipo, '—')}
                  </Text>
                </View>

                {/* Rating */}
                <View style={styles.mvpRatingBox}>
                  <Text style={styles.mvpRating}>
                    {safeNumber(matchdayMVP.rating, 0).toFixed(1)}
                  </Text>
                  <Text style={styles.mvpRatingLabel}>Rating</Text>
                </View>
              </View>

              {/* Stats secundarias */}
              <View style={styles.mvpStatsRow}>
                <View style={styles.mvpStatItem}>
                  <Ionicons name="football-outline" size={14} color={Colors.brand.primary} />
                  <Text style={styles.mvpStatValue}>{safeNumber(matchdayMVP.goles)}</Text>
                  <Text style={styles.mvpStatLabel}>Goles</Text>
                </View>
                <View style={styles.mvpDivider} />
                <View style={styles.mvpStatItem}>
                  <Ionicons name="hand-right-outline" size={14} color={Colors.brand.secondary} />
                  <Text style={styles.mvpStatValue}>{safeNumber(matchdayMVP.asistencias)}</Text>
                  <Text style={styles.mvpStatLabel}>Asistencias</Text>
                </View>
              </View>
            </View>
          </>
        ) : null}

        {/* ── D. Máximos goleadores ── */}
        {topScorers.length > 0 ? (
          <>
            <SectionHeader title="Máximos goleadores" icon="podium-outline" />
            <View style={styles.card}>
              {/* Cabecera de columnas */}
              <View style={styles.scorerHeader}>
                <Text style={[styles.scorerHeaderText, { width: 20 }]}>#</Text>
                <Text style={[styles.scorerHeaderText, { flex: 1, marginLeft: 48 }]}>
                  Jugador
                </Text>
                <Text style={[styles.scorerHeaderText, { textAlign: 'right' }]}>
                  Goles
                </Text>
              </View>
              {topScorers.slice(0, 5).map((scorer, index) => (
                <ScorerRow key={scorer.id_jugador ?? index} scorer={scorer} rank={index + 1} />
              ))}
            </View>
          </>
        ) : null}

        {/* ── E. Goles por equipo ── */}
        {teamGoalsStats.length > 0 ? (
          <>
            <SectionHeader title="Goles por equipo" icon="analytics-outline" />
            <View style={styles.card}>
              {teamGoalsStats.slice(0, 5).map((team, index) => (
                <TeamGoalRow
                  key={team.id_equipo ?? index}
                  team={team}
                  maxGoals={maxGoals}
                />
              ))}
            </View>
          </>
        ) : null}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg.base,
  },

  // Header
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bg.surface2,
  },
  headerTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: 0.2,
  },
  headerSub: {
    fontSize: theme.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },

  // Estados vacío / error / loading
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xxl,
  },
  emptyTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: theme.fontSize.sm,
    color: Colors.text.disabled,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: theme.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  errorTitle: {
    fontSize: theme.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: Colors.brand.primary,
    borderRadius: theme.borderRadius.full,
  },
  retryText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    color: Colors.bg.base,
  },

  // Sección
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
  sectionAccent: {
    width: 3,
    height: 16,
    backgroundColor: Colors.brand.primary,
    borderRadius: 2,
    marginRight: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: 0.3,
  },

  // Tarjeta base
  card: {
    backgroundColor: Colors.bg.surface1,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },

  // ── A. Métricas ──
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    marginBottom: theme.spacing.sm,
  },
  metricCard: {
    backgroundColor: Colors.bg.surface1,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    // Sombra sutil
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  metricValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '800',
    color: Colors.text.primary,
    lineHeight: 28,
  },
  metricLabel: {
    fontSize: theme.fontSize.xs,
    color: Colors.text.secondary,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── B. Mis estadísticas ──
  myStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  myStatItem: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  myStatValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: theme.spacing.xs,
  },
  myStatLabel: {
    fontSize: 10,
    color: Colors.text.disabled,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },

  // ── C. MVP ──
  mvpCard: {
    // gradiente simulado con borde brand
    borderWidth: 1,
    borderColor: Colors.brand.primary + '33',
  },
  mvpJornadaBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.brand.primary + '22',
    borderRadius: theme.borderRadius.full,
    paddingVertical: 3,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  mvpJornadaText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    color: Colors.brand.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mvpContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  mvpAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.brand.primary + '33',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
    // Posición relativa para el badge estrella
    position: 'relative',
  },
  mvpAvatarText: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: Colors.brand.primary,
  },
  mvpStarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mvpInfo: {
    flex: 1,
  },
  mvpName: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  mvpTeam: {
    fontSize: theme.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  mvpRatingBox: {
    alignItems: 'center',
    backgroundColor: Colors.brand.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  mvpRating: {
    fontSize: theme.fontSize.xl,
    fontWeight: '800',
    color: Colors.bg.base,
    lineHeight: 24,
  },
  mvpRatingLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.bg.base,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mvpStatsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.bg.surface2,
    paddingTop: theme.spacing.md,
    justifyContent: 'center',
  },
  mvpStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.xl,
  },
  mvpStatValue: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  mvpStatLabel: {
    fontSize: theme.fontSize.xs,
    color: Colors.text.secondary,
  },
  mvpDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.bg.surface2,
  },

  // ── D. Goleadores ──
  scorerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bg.surface2,
  },
  scorerHeaderText: {
    fontSize: theme.fontSize.xs,
    color: Colors.text.disabled,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  scorerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bg.surface2 + '55',
  },
  scorerRank: {
    width: 20,
    fontSize: theme.fontSize.sm,
    fontWeight: '800',
    textAlign: 'center',
  },
  scorerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bg.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: theme.spacing.sm,
  },
  scorerAvatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text.secondary,
  },
  scorerInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  scorerName: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  scorerTeam: {
    fontSize: theme.fontSize.xs,
    color: Colors.text.disabled,
    marginTop: 1,
  },
  scorerStats: {
    alignItems: 'flex-end',
  },
  scorerGoals: {
    fontSize: theme.fontSize.lg,
    fontWeight: '800',
    color: Colors.brand.primary,
  },
  scorerAvgText: {
    fontSize: 10,
    color: Colors.text.disabled,
    marginTop: 1,
  },

  // ── E. Goles por equipo ──
  teamGoalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bg.surface2 + '55',
  },
  teamInitialBadge: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    backgroundColor: Colors.brand.secondary + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  teamInitialText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.brand.secondary,
  },
  teamGoalInfo: {
    flex: 1,
  },
  teamGoalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  teamGoalName: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  teamGoalNumbers: {
    alignItems: 'flex-end',
  },
  teamGoalCount: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    color: Colors.brand.secondary,
  },
  teamGoalAvg: {
    fontSize: 10,
    color: Colors.text.disabled,
  },
  barTrack: {
    height: 4,
    backgroundColor: Colors.bg.surface2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: 4,
    backgroundColor: Colors.brand.secondary,
    borderRadius: 2,
  },

  bottomPad: {
    height: theme.spacing.xxl,
  },
});
