/**
 * TeamInformationTab.tsx
 *
 * Tab "Información" del detalle de un equipo.
 * Muestra stats de temporada, próximo partido e info del club.
 *
 * Recibe datos por props: no hace fetch propio.
 * El próximo partido se calcula desde `programmedMatches`, que debe ser el
 * mismo array que usa la lista de “Partidos Programados”. Esto garantiza que,
 * si el partido aparece en la programación, también pueda destacarse aquí.
 *
 * Importante:
 * - El próximo encuentro reutiliza ProgrammedMatchCard.
 * - Se envían permisos de solo lectura y no se pasan handlers de acción para
 *   ocultar botones operativos: iniciar, convocatoria, alineación, etc.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/src/shared/constants/colors';
import { ProgrammedMatchCard } from '@/src/features/matches/components/cards/ProgrammedMatchCard';
import { getDashboardPermissions } from '@/src/features/dashboard/services/dashboardService';
import type { EquipoDetalleResponse } from '../types/teams.types';
import type { PartidoApi } from '@/src/features/matches/types/matches.types';

interface TeamInformationTabProps {
  detail: EquipoDetalleResponse;
  /** Mismo array que alimenta “Partidos Programados”. */
  programmedMatches?: PartidoApi[];
}

interface StatItemProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

type AnyRecord = Record<string, unknown>;
type ProgrammedMatchCardProps = React.ComponentProps<typeof ProgrammedMatchCard>;
type ProgrammedCardMatch = ProgrammedMatchCardProps['match'];

interface UpcomingTeamMatch {
  id: number | string;
  date: Date;
  cardMatch: ProgrammedCardMatch;
}

const READ_ONLY_MATCH_PERMISSIONS = getDashboardPermissions('observer' as never);

function StatItem({ label, value, highlight }: StatItemProps) {
  return (
    <View style={statStyles.item}>
      <Text style={[statStyles.value, highlight && statStyles.valueHighlight]}>
        {value ?? '–'}
      </Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function asRecord(value: unknown): AnyRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as AnyRecord)
    : null;
}

function getPath(source: AnyRecord, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    const record = asRecord(current);
    return record ? record[key] : undefined;
  }, source);
}

function pickString(source: AnyRecord, paths: string[]): string {
  for (const path of paths) {
    const value = getPath(source, path);
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }

  return '';
}

function pickNumber(source: AnyRecord, paths: string[]): number | null {
  for (const path of paths) {
    const value = getPath(source, path);
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return null;
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function resolveTeamId(match: PartidoApi, side: 'home' | 'away'): number | null {
  const source = match as unknown as AnyRecord;

  return side === 'home'
    ? pickNumber(source, [
        'equipo_local.id_equipo',
        'equipo_local.id',
        'equipo_local.equipo_id',
        'local.id_equipo',
        'local.id',
        'homeTeam.id_equipo',
        'homeTeam.id',
        'id_equipo_local',
        'equipo_local_id',
        'local_id',
        'id_local',
        'homeTeamId',
        'home_team_id',
      ])
    : pickNumber(source, [
        'equipo_visitante.id_equipo',
        'equipo_visitante.id',
        'equipo_visitante.equipo_id',
        'visitante.id_equipo',
        'visitante.id',
        'awayTeam.id_equipo',
        'awayTeam.id',
        'id_equipo_visitante',
        'equipo_visitante_id',
        'visitante_id',
        'id_visitante',
        'awayTeamId',
        'away_team_id',
      ]);
}

function resolveTeamName(match: PartidoApi, side: 'home' | 'away'): string {
  const source = match as unknown as AnyRecord;

  return side === 'home'
    ? pickString(source, [
        'equipo_local.nombre',
        'equipo_local.name',
        'equipo_local.nombre_equipo',
        'local.nombre',
        'local.name',
        'homeTeam.nombre',
        'homeTeam.name',
        'nombre_equipo_local',
        'equipo_local_nombre',
        'nombre_local',
        'local_nombre',
        'home_team_name',
        'homeName',
        'homeTeamName',
        'homeTeam',
        'local',
      ])
    : pickString(source, [
        'equipo_visitante.nombre',
        'equipo_visitante.name',
        'equipo_visitante.nombre_equipo',
        'visitante.nombre',
        'visitante.name',
        'awayTeam.nombre',
        'awayTeam.name',
        'nombre_equipo_visitante',
        'equipo_visitante_nombre',
        'nombre_visitante',
        'visitante_nombre',
        'away_team_name',
        'awayName',
        'awayTeamName',
        'awayTeam',
        'visitante',
      ]);
}

function resolveTeamColor(match: PartidoApi, side: 'home' | 'away'): string | undefined {
  const source = match as unknown as AnyRecord;
  const color = side === 'home'
    ? pickString(source, [
        'equipo_local.color_primario',
        'equipo_local.color',
        'local.color_primario',
        'local.color',
        'homeTeam.color_primario',
        'homeTeam.color',
        'color_equipo_local',
        'local_color',
        'homeColor',
      ])
    : pickString(source, [
        'equipo_visitante.color_primario',
        'equipo_visitante.color',
        'visitante.color_primario',
        'visitante.color',
        'awayTeam.color_primario',
        'awayTeam.color',
        'color_equipo_visitante',
        'visitante_color',
        'awayColor',
      ]);

  return color || undefined;
}

function resolveMatchId(match: PartidoApi): number | string {
  const source = match as unknown as AnyRecord;
  return pickNumber(source, ['id_partido', 'id', 'match_id', 'partido_id']) ?? pickString(source, ['id_partido', 'id', 'match_id', 'partido_id']);
}

function resolveJornada(match: PartidoApi): number | string | undefined {
  const source = match as unknown as AnyRecord;
  const jornada = pickNumber(source, ['jornada', 'numero_jornada', 'num_jornada', 'round', 'ronda']);
  if (jornada != null) return jornada;

  const jornadaText = pickString(source, ['jornada_nombre', 'nombre_jornada', 'roundName']);
  return jornadaText || undefined;
}

function resolveVenue(match: PartidoApi): string | undefined {
  const source = match as unknown as AnyRecord;
  return pickString(source, ['estadio', 'venue', 'cancha', 'sede', 'location']) || undefined;
}

function buildDateCandidate(dateValue: string, timeValue: string): string {
  if (!dateValue) return '';
  if (!timeValue || dateValue.includes('T')) return dateValue;

  const normalizedTime = timeValue.length === 5 ? `${timeValue}:00` : timeValue;
  return `${dateValue}T${normalizedTime}`;
}

function resolveMatchDate(match: PartidoApi): Date | null {
  const source = match as unknown as AnyRecord;
  const dateValue = pickString(source, [
    'fecha_hora',
    'fechaHora',
    'scheduled_at',
    'scheduledAt',
    'fecha_partido',
    'fecha',
    'date',
  ]);
  const timeValue = pickString(source, ['hora', 'time', 'hora_partido']);
  const candidate = buildDateCandidate(dateValue, timeValue);
  if (!candidate) return null;

  const date = new Date(candidate);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDatePart(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('es-ES', options).format(date).replace('.', '');
}

function toProgrammedCardMatch(match: PartidoApi, teamId: number, teamName: string, date: Date): ProgrammedCardMatch {
  const homeId = resolveTeamId(match, 'home');
  const awayId = resolveTeamId(match, 'away');

  const homeName = resolveTeamName(match, 'home') || (homeId === teamId ? teamName : 'Equipo local');
  const awayName = resolveTeamName(match, 'away') || (awayId === teamId ? teamName : 'Equipo visitante');

  return {
    id: resolveMatchId(match),
    homeTeam: homeName,
    awayTeam: awayName,
    day: formatDatePart(date, { day: '2-digit' }),
    month: formatDatePart(date, { month: 'short' }).toUpperCase(),
    time: formatDatePart(date, { hour: '2-digit', minute: '2-digit' }),
    round: resolveJornada(match),
    venue: resolveVenue(match),
    homeColor: resolveTeamColor(match, 'home'),
    awayColor: resolveTeamColor(match, 'away'),
  } as ProgrammedCardMatch;
}

function findNextTeamMatch(
  teamId: number,
  teamName: string,
  programmedMatches: PartidoApi[] = [],
): UpcomingTeamMatch | null {
  const now = new Date();
  const normalizedTeamName = normalizeName(teamName);

  const futureMatches = programmedMatches
    .map((match) => {
      const date = resolveMatchDate(match);
      if (!date || date <= now) return null;

      const homeId = resolveTeamId(match, 'home');
      const awayId = resolveTeamId(match, 'away');
      const homeName = resolveTeamName(match, 'home');
      const awayName = resolveTeamName(match, 'away');

      const belongsToTeam =
        homeId === teamId ||
        awayId === teamId ||
        (homeName.length > 0 && normalizeName(homeName) === normalizedTeamName) ||
        (awayName.length > 0 && normalizeName(awayName) === normalizedTeamName);

      if (!belongsToTeam) return null;

      return {
        id: resolveMatchId(match),
        date,
        cardMatch: toProgrammedCardMatch(match, teamId, teamName, date),
      };
    })
    .filter((match): match is UpcomingTeamMatch => Boolean(match))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return futureMatches[0] ?? null;
}

function getReadOnlyProgrammedCardProps(match: ProgrammedCardMatch): ProgrammedMatchCardProps {
  return {
    match,
    permissions: READ_ONLY_MATCH_PERMISSIONS,
  } as ProgrammedMatchCardProps;
}

export function TeamInformationTab({ detail, programmedMatches = [] }: TeamInformationTabProps) {
  const pj = detail.partidos_jugados ?? 0;
  const v = detail.victorias ?? 0;
  const e = detail.empates ?? 0;
  const d = detail.derrotas ?? 0;
  const winRate = pj > 0 ? `${Math.round((v / pj) * 100)}%` : '–';

  const nextMatch = useMemo(
    () => findNextTeamMatch(detail.id_equipo, detail.nombre, programmedMatches),
    [detail.id_equipo, detail.nombre, programmedMatches],
  );

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Stats de temporada ── */}
      <Text style={styles.sectionTitle}>Temporada</Text>
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

      {/* ── Próximo partido: reutiliza la card real de partidos programados en modo informativo ── */}
      {nextMatch && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Próximo partido</Text>
          <View style={styles.nextMatchCardWrapper}>
            <ProgrammedMatchCard {...getReadOnlyProgrammedCardProps(nextMatch.cardMatch)} />
          </View>
        </>
      )}

      {/* ── Info del club ── */}
      {(detail.estadio || detail.entrenador || detail.temporada) && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Club</Text>
          <View style={styles.infoCard}>
            {detail.estadio && (
              <InfoRow icon="business-outline" label="Estadio" value={detail.estadio} />
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
      <View style={infoStyles.iconWrap}>
        <Ionicons name={icon} size={17} color={Colors.brand.primary} />
      </View>
      <View style={infoStyles.textGroup}>
        <Text style={infoStyles.label}>{label}</Text>
        <Text style={infoStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nextMatchCardWrapper: {
    marginHorizontal: -4,
  },
  infoCard: {
    backgroundColor: Colors.bg.surface1,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.bg.surface2,
  },
});

const statStyles = StyleSheet.create({
  item: {
    width: '18%',
    minWidth: 52,
    backgroundColor: Colors.bg.surface1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.bg.surface2,
  },
  value: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  valueHighlight: {
    color: Colors.brand.primary,
  },
  label: {
    color: Colors.text.secondary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bg.surface2,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(196, 241, 53, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: { flex: 1, gap: 2 },
  label: { color: Colors.text.secondary, fontSize: 11, fontWeight: '600' },
  value: { color: Colors.text.primary, fontSize: 14, fontWeight: '600' },
});
