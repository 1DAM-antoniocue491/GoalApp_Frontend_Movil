/**
 * TeamInformationTab.tsx
 *
 * Tab "Información" del detalle de un equipo.
 * Secciones:
 * - Temporada (stats grid)
 * - Próximo partido
 * - Últimos partidos
 * - Máximos goleadores
 * - Info del club (estadio, entrenador)
 *
 * Si un bloque no tiene datos, no se renderiza. No rompe.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import type { EquipoDetalleResponse, MatchSummary, TeamTopScorer } from '../types/teams.types';

interface TeamInformationTabProps {
  detail: EquipoDetalleResponse;
  upcomingMatches?: MatchSummary[];
  lastMatches?: MatchSummary[];
  topScorers?: TeamTopScorer[];
}

function StatItem({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <View style={statStyles.item}>
      <Text style={[statStyles.value, highlight && statStyles.valueHighlight]}>
        {value ?? '–'}
      </Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function MatchRow({ match, isLast }: { match: MatchSummary; isLast?: boolean }) {
  const hasScore =
    match.goles_local !== null && match.goles_local !== undefined &&
    match.goles_visitante !== null && match.goles_visitante !== undefined;

  return (
    <View style={[matchStyles.row, isLast && { borderBottomWidth: 0 }]}>
      <View style={matchStyles.teams}>
        <Text style={matchStyles.teamName} numberOfLines={1}>
          {match.equipo_local ?? '—'}
        </Text>
        <Text style={matchStyles.vs}>vs</Text>
        <Text style={matchStyles.teamName} numberOfLines={1}>
          {match.equipo_visitante ?? '—'}
        </Text>
      </View>
      {hasScore ? (
        <Text style={matchStyles.score}>
          {match.goles_local} – {match.goles_visitante}
        </Text>
      ) : match.fecha ? (
        <Text style={matchStyles.date}>{match.fecha.slice(0, 10)}</Text>
      ) : null}
    </View>
  );
}

function ScorerRow({ scorer, rank }: { scorer: TeamTopScorer; rank: number }) {
  return (
    <View style={scorerStyles.row}>
      <Text style={scorerStyles.rank}>{rank}</Text>
      <View style={scorerStyles.avatar}>
        <Text style={scorerStyles.avatarText}>
          {scorer.nombre?.charAt(0)?.toUpperCase() ?? '?'}
        </Text>
      </View>
      <View style={scorerStyles.info}>
        <Text style={scorerStyles.name} numberOfLines={1}>
          {scorer.nombre ?? '—'}
        </Text>
        {scorer.posicion ? (
          <Text style={scorerStyles.pos}>{scorer.posicion}</Text>
        ) : null}
      </View>
      <Text style={scorerStyles.goals}>{scorer.goles}</Text>
    </View>
  );
}

export function TeamInformationTab({
  detail,
  upcomingMatches = [],
  lastMatches = [],
  topScorers = [],
}: TeamInformationTabProps) {
  const pj = detail.partidos_jugados ?? 0;
  const v = detail.victorias ?? 0;
  const e = detail.empates ?? 0;
  const d = detail.derrotas ?? 0;
  const winRate = pj > 0 ? `${Math.round((v / pj) * 100)}%` : '–';

  const hasStats = pj > 0 || detail.puntos !== undefined;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Stats de temporada ── */}
      {hasStats && (
        <>
          <SectionTitle title="Temporada" />
          <View style={styles.statsGrid}>
            <StatItem label="PJ" value={pj} />
            <StatItem label="V" value={v} />
            <StatItem label="E" value={e} />
            <StatItem label="D" value={d} />
            <StatItem label="GF" value={detail.goles_favor ?? '–'} />
            <StatItem label="GC" value={detail.goles_contra ?? '–'} />
            <StatItem
              label="DG"
              value={detail.diferencia_goles != null
                ? (detail.diferencia_goles > 0 ? `+${detail.diferencia_goles}` : String(detail.diferencia_goles))
                : '–'}
            />
            <StatItem label="Pts" value={detail.puntos ?? '–'} highlight />
            <StatItem label="Win %" value={winRate} highlight />
            <StatItem label="Pos." value={detail.posicion ?? '–'} />
          </View>
        </>
      )}

      {/* ── Próximo partido ── */}
      {upcomingMatches.length > 0 && (
        <>
          <SectionTitle title="Próximo partido" />
          <View style={styles.card}>
            <MatchRow match={upcomingMatches[0]} isLast />
          </View>
        </>
      )}

      {/* ── Últimos partidos ── */}
      {lastMatches.length > 0 && (
        <>
          <SectionTitle title="Últimos partidos" />
          <View style={styles.card}>
            {lastMatches.slice(0, 5).map((m, i) => (
              <MatchRow
                key={m.id_partido ?? i}
                match={m}
                isLast={i === Math.min(lastMatches.length, 5) - 1}
              />
            ))}
          </View>
        </>
      )}

      {/* ── Máximos goleadores ── */}
      {topScorers.length > 0 && (
        <>
          <SectionTitle title="Máximos goleadores" />
          <View style={styles.card}>
            {topScorers.slice(0, 5).map((s, i) => (
              <ScorerRow key={s.id_usuario ?? i} scorer={s} rank={i + 1} />
            ))}
          </View>
        </>
      )}

      {/* ── Info del club ── */}
      {(detail.estadio || detail.entrenador || detail.temporada) && (
        <>
          <SectionTitle title="Club" />
          <View style={styles.infoCard}>
            {detail.estadio && (
              <InfoRow icon="location-outline" label="Estadio" value={detail.estadio} />
            )}
            {detail.entrenador && (
              <InfoRow icon="person-outline" label="Entrenador" value={detail.entrenador} />
            )}
            {detail.temporada && (
              <InfoRow icon="calendar-outline" label="Temporada" value={detail.temporada} />
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Ionicons name={icon} size={17} color={Colors.text.secondary} />
      <View style={infoStyles.textGroup}>
        <Text style={infoStyles.label}>{label}</Text>
        <Text style={infoStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Estilos
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 24,
  },
  sectionAccent: {
    width: 3,
    height: 14,
    backgroundColor: Colors.brand.primary,
    borderRadius: 2,
    marginRight: 8,
  },
  sectionTitle: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    backgroundColor: Colors.bg.surface1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoCard: {
    backgroundColor: Colors.bg.surface1,
    borderRadius: 12,
    overflow: 'hidden',
  },
});

const statStyles = StyleSheet.create({
  item: {
    width: '18%',
    minWidth: 52,
    backgroundColor: Colors.bg.surface1,
    borderRadius: 10,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  value: { color: Colors.text.primary, fontSize: 18, fontWeight: '700' },
  valueHighlight: { color: Colors.brand.primary },
  label: { color: Colors.text.secondary, fontSize: 10, fontWeight: '500', letterSpacing: 0.3 },
});

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bg.surface2,
  },
  textGroup: { flex: 1, gap: theme.spacing.sm },
  label: { color: Colors.text.secondary, fontSize: 11 },
  value: { color: Colors.text.primary, fontSize: 14, fontWeight: '500' },
});

const matchStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md + 2,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bg.surface2,
  },
  teams: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  teamName: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  vs: {
    color: Colors.text.disabled,
    fontSize: 11,
  },
  score: {
    color: Colors.brand.primary,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  date: {
    color: Colors.text.secondary,
    fontSize: 12,
    marginLeft: 8,
  },
});

const scorerStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md + 2,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bg.surface2 + '55',
    gap: 10,
  },
  rank: {
    width: 18,
    color: Colors.text.disabled,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.bg.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Colors.text.secondary, fontSize: 12, fontWeight: '700' },
  info: { flex: 1 },
  name: { color: Colors.text.primary, fontSize: 13, fontWeight: '500' },
  pos: { color: Colors.text.disabled, fontSize: 11, marginTop: 1 },
  goals: { color: Colors.brand.primary, fontSize: 16, fontWeight: '800' },
});
