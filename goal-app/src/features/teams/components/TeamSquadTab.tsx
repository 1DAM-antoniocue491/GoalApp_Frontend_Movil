/**
 * TeamSquadTab.tsx
 *
 * Tab "Plantilla" del detalle de un equipo.
 *
 * Regla de datos:
 * - No se inventan jugadores.
 * - Si el endpoint de plantilla o detalle devuelve jugadores, se agrupan por posición.
 * - Si no llegan jugadores, se muestra un empty state premium preparado para producción.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import type { JugadorResumen } from '../types/teams.types';

interface TeamSquadTabProps {
  /** Jugadores del endpoint de plantilla o del detalle del equipo. */
  jugadores?: JugadorResumen[];
}

type NormalizedPosition = 'Porteros' | 'Defensas' | 'Centrocampistas' | 'Delanteros' | 'Otros';

const POSITION_ORDER: NormalizedPosition[] = [
  'Porteros',
  'Defensas',
  'Centrocampistas',
  'Delanteros',
  'Otros',
];

function normalizePosition(position?: string | null): NormalizedPosition {
  const value = String(position ?? '').trim().toLowerCase();

  if (['portero', 'porteros', 'goalkeeper', 'arquero'].includes(value)) return 'Porteros';
  if (['defensa', 'defensas', 'defender', 'central', 'lateral'].includes(value)) return 'Defensas';
  if (['centrocampista', 'centrocampistas', 'mediocentro', 'medio', 'midfielder'].includes(value)) {
    return 'Centrocampistas';
  }
  if (['delantero', 'delanteros', 'forward', 'striker', 'atacante', 'extremo'].includes(value)) return 'Delanteros';

  return 'Otros';
}

function getPlayerName(player: JugadorResumen): string {
  const fullName = [player.nombre, player.apellido].filter(Boolean).join(' ').trim();
  return fullName || 'Jugador sin nombre';
}

function getPlayerKey(player: JugadorResumen, index: number): string {
  return String((player as any).id_jugador ?? player.id_usuario ?? `${getPlayerName(player)}-${index}`);
}

function getInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

function EmptySquadState() {
  return (
    <View style={emptyStyles.wrapper}>
      <View style={emptyStyles.iconBox}>
        <Ionicons name="people-outline" size={34} color={Colors.text.secondary} />
      </View>
      <Text style={emptyStyles.title}>Plantilla no disponible</Text>
      <Text style={emptyStyles.subtitle}>
        Los jugadores aparecerán aquí cuando estén registrados o cuando el endpoint de plantilla devuelva datos.
      </Text>
    </View>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <View style={styles.groupHeader}>
      <View style={styles.groupTitleRow}>
        <View style={styles.groupAccent} />
        <Text style={styles.groupTitle}>{title}</Text>
      </View>
      <Text style={styles.groupCount}>{count}</Text>
    </View>
  );
}

function PlayerRow({ jugador }: { jugador: JugadorResumen }) {
  const name = getPlayerName(jugador);
  const initials = getInitials(name);
  const position = jugador.posicion ?? 'Sin posición';

  return (
    <View style={playerStyles.row}>
      <View style={playerStyles.avatar}>
        <Text style={playerStyles.avatarText}>{initials}</Text>
      </View>

      <View style={playerStyles.info}>
        <View style={playerStyles.nameRow}>
          <Text style={playerStyles.name} numberOfLines={1}>{name}</Text>
          {jugador.es_capitan ? (
            <View style={playerStyles.captainBadge}>
              <Ionicons name="star" size={10} color={Colors.bg.base} />
              <Text style={playerStyles.captainText}>C</Text>
            </View>
          ) : null}
        </View>
        <Text style={playerStyles.position} numberOfLines={1}>{position}</Text>
      </View>

      <View style={playerStyles.dorsalBox}>
        <Text style={playerStyles.dorsal}>{jugador.dorsal ?? '–'}</Text>
      </View>
    </View>
  );
}

export function TeamSquadTab({ jugadores }: TeamSquadTabProps) {
  const hasPlayers = Array.isArray(jugadores) && jugadores.length > 0;

  if (!hasPlayers) {
    return <EmptySquadState />;
  }

  // Agrupación defensiva: se normalizan posiciones para que API pueda devolver nombres variados.
  const groups = jugadores.reduce<Record<NormalizedPosition, JugadorResumen[]>>((acc, player) => {
    const group = normalizePosition(player.posicion);
    acc[group].push(player);
    return acc;
  }, {
    Porteros: [],
    Defensas: [],
    Centrocampistas: [],
    Delanteros: [],
    Otros: [],
  });

  const visibleGroups = POSITION_ORDER.filter((position) => groups[position].length > 0);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.summaryCard}>
        <View style={styles.summaryIconBox}>
          <Ionicons name="shirt-outline" size={20} color={Colors.brand.primary} />
        </View>
        <View style={styles.summaryTextGroup}>
          <Text style={styles.summaryTitle}>Plantilla registrada</Text>
          <Text style={styles.summarySubtitle}>{jugadores.length} jugadores en el equipo</Text>
        </View>
      </View>

      {visibleGroups.map((position) => (
        <View key={position} style={styles.group}>
          <SectionHeader title={position} count={groups[position].length} />
          <View style={styles.groupCard}>
            {groups[position].map((jugador, index) => (
              <PlayerRow key={getPlayerKey(jugador, index)} jugador={jugador} />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: 110,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: 18,
    backgroundColor: Colors.bg.surface1,
    borderWidth: 1,
    borderColor: Colors.bg.surface2,
    marginBottom: theme.spacing.lg,
  },
  summaryIconBox: {
    width: 42,
    height: 42,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.brand.primary + '12',
  },
  summaryTextGroup: { flex: 1 },
  summaryTitle: {
    color: Colors.text.primary,
    fontSize: theme.fontSize.md,
    fontWeight: '900',
  },
  summarySubtitle: {
    color: Colors.text.secondary,
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    marginTop: 2,
  },
  group: { marginBottom: theme.spacing.lg },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  groupAccent: {
    width: 4,
    height: 16,
    borderRadius: theme.borderRadius.full,
    backgroundColor: Colors.brand.primary,
  },
  groupTitle: {
    color: Colors.text.primary,
    fontSize: theme.fontSize.md,
    fontWeight: '900',
  },
  groupCount: {
    minWidth: 28,
    textAlign: 'center',
    color: Colors.brand.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: '900',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    backgroundColor: Colors.brand.primary + '12',
    overflow: 'hidden',
  },
  groupCard: {
    gap: theme.spacing.sm,
  },
});

const playerStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: Colors.bg.surface1,
    borderRadius: 18,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.bg.surface2,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg.surface2,
  },
  avatarText: {
    color: Colors.text.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: '900',
  },
  info: { flex: 1, minWidth: 0 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  name: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: '900',
  },
  position: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  dorsalBox: {
    minWidth: 42,
    height: 36,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: Colors.brand.primary + '12',
    borderWidth: 1,
    borderColor: Colors.brand.primary + '33',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  dorsal: {
    color: Colors.brand.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: '900',
  },
  captainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
    backgroundColor: Colors.brand.primary,
  },
  captainText: {
    color: Colors.bg.base,
    fontSize: 10,
    fontWeight: '900',
  },
});

const emptyStyles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xxl,
    gap: theme.spacing.sm,
  },
  iconBox: {
    width: 74,
    height: 74,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg.surface1,
    borderWidth: 1,
    borderColor: Colors.bg.surface2,
    marginBottom: theme.spacing.sm,
  },
  title: {
    color: Colors.text.primary,
    fontSize: theme.fontSize.md,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.text.secondary,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
