/**
 * ClassificationScreen.tsx
 *
 * Tabla de clasificación de la liga activa.
 *
 * OBJETIVO DE DISEÑO MOBILE:
 * - Mantener fija la columna de posición + equipo para que siempre sea legible.
 * - Permitir scroll horizontal SOLO sobre las estadísticas: PJ, V, E, D, GF, GC, DG y Pts.
 * - Mejorar el espaciado, la jerarquía visual y la lectura en pantallas pequeñas.
 *
 * INTEGRACIÓN API:
 * - No se toca la lógica de datos.
 * - Sigue usando useClassification(ligaId).
 * - Sigue dependiendo de GET /ligas/{liga_id}/clasificacion desde el hook existente.
 * - Si el hook devuelve [] o falla, la pantalla muestra estados controlados.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useActiveLeague } from '@/src/state/activeLeague/activeLeagueStore';
import { useClassification } from '../hooks/useTeams';
import { Colors } from '@/src/shared/constants/colors';
import type { ClasificacionItem } from '../types/teams.types';

// ---------------------------------------------------------------------------
// Tokens locales defensivos
// ---------------------------------------------------------------------------

/**
 * Usamos Colors como fuente principal, pero añadimos fallbacks para evitar romper
 * si algún token no existe todavía en el proyecto.
 */
const C = {
  bg: Colors.bg.base,
  surface: (Colors as any).bg?.surface ?? '#181820',
  surfaceSoft: (Colors as any).bg?.surfaceSoft ?? '#20202A',
  surfaceMuted: (Colors as any).bg?.muted ?? '#252532',
  border: (Colors as any).border?.default ?? 'rgba(255,255,255,0.08)',
  borderStrong: (Colors as any).border?.strong ?? 'rgba(255,255,255,0.14)',
  text: Colors.text.primary,
  textSecondary: Colors.text.secondary,
  textMuted: (Colors as any).text?.muted ?? Colors.text.secondary,
  brand: Colors.brand.primary,
  danger: (Colors as any).semantic?.error ?? '#FF4D4A',
  warning: (Colors as any).semantic?.warning ?? '#FFD60A',
};

// ---------------------------------------------------------------------------
// Columnas de estadísticas con scroll horizontal
// ---------------------------------------------------------------------------

const STAT_COLS: { key: keyof ClasificacionItem; label: string; highlight?: boolean }[] = [
  { key: 'partidos_jugados', label: 'PJ' },
  { key: 'victorias', label: 'V' },
  { key: 'empates', label: 'E' },
  { key: 'derrotas', label: 'D' },
  { key: 'goles_favor', label: 'GF' },
  { key: 'goles_contra', label: 'GC' },
  { key: 'diferencia_goles', label: 'DG' },
  { key: 'puntos', label: 'Pts', highlight: true },
];

const LEFT_COL_WIDTH = 188;
const STAT_COL_WIDTH = 58;
const HEADER_HEIGHT = 44;
const ROW_HEIGHT = 58;
const STATS_TABLE_WIDTH = STAT_COLS.length * STAT_COL_WIDTH;

// ---------------------------------------------------------------------------
// Helpers defensivos de render
// ---------------------------------------------------------------------------

function safeString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function safeNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getTeamName(item: ClasificacionItem): string {
  const raw = (item as any)?.nombre_equipo ?? (item as any)?.equipo?.nombre ?? (item as any)?.nombre;
  return safeString(raw, 'Equipo sin nombre');
}

function getPositionColor(position: number): string {
  if (position === 1) return C.warning;
  if (position === 2) return '#C7C7D1';
  if (position === 3) return '#CD7F32';
  return C.textSecondary;
}

function getStatDisplay(item: ClasificacionItem, key: keyof ClasificacionItem): string {
  const value = (item as any)?.[key];

  if (typeof value !== 'number') {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return '0';

    if (key === 'diferencia_goles' && parsed > 0) return `+${parsed}`;
    return String(parsed);
  }

  if (key === 'diferencia_goles' && value > 0) return `+${value}`;
  return String(value);
}

function getRowKey(item: ClasificacionItem, index: number): string {
  const id = (item as any)?.id_equipo ?? (item as any)?.equipo?.id_equipo ?? (item as any)?.id;
  return id !== undefined && id !== null ? String(id) : `classification-row-${index}`;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ClassificationSkeleton() {
  return (
    <View style={styles.tableShell}>
      <View style={styles.fixedColumn}>
        <View style={[styles.fixedHeaderCell, styles.skeletonBlock]} />
        {[1, 2, 3, 4, 5].map((item) => (
          <View key={`left-skeleton-${item}`} style={styles.fixedBodyCell}>
            <View style={styles.skeletonPosition} />
            <View style={styles.skeletonName} />
          </View>
        ))}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalSkeletonContent}
      >
        <View style={{ width: STATS_TABLE_WIDTH }}>
          <View style={styles.statsHeaderRow}>
            {STAT_COLS.map((col) => (
              <View key={`header-skeleton-${String(col.key)}`} style={[styles.skeletonStatHeader, { width: STAT_COL_WIDTH }]} />
            ))}
          </View>

          {[1, 2, 3, 4, 5].map((row) => (
            <View key={`stats-skeleton-${row}`} style={styles.statsDataRow}>
              {STAT_COLS.map((col) => (
                <View key={`${row}-${String(col.key)}`} style={[styles.skeletonStatCell, { width: STAT_COL_WIDTH }]} />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Columnas fijas y scrolleables
// ---------------------------------------------------------------------------

interface ClassificationTableProps {
  rows: ClasificacionItem[];
}

function ClassificationTable({ rows }: ClassificationTableProps) {
  return (
    <View style={styles.tableCard}>
      <View style={styles.tableTopBar}>
        <Text style={styles.tableTitle}>Tabla de clasificación</Text>
        <Text style={styles.tableHint}>Desliza para ver más datos</Text>
      </View>

      <View style={styles.tableShell}>
        {/* Columna fija: mantiene visible el ranking y el nombre del equipo */}
        <View style={styles.fixedColumn}>
          <View style={styles.fixedHeaderCell}>
            <Text style={styles.headerText}># Equipo</Text>
          </View>

          {rows.map((item, index) => {
            const position = safeNumber((item as any)?.posicion, index + 1);
            const teamName = getTeamName(item);
            const isEven = index % 2 === 0;

            return (
              <View
                key={`fixed-${getRowKey(item, index)}`}
                style={[styles.fixedBodyCell, isEven && styles.rowAlt]}
              >
                <Text style={[styles.positionText, { color: getPositionColor(position) }]}>
                  {position}
                </Text>
                <Text style={styles.teamNameText} numberOfLines={1} ellipsizeMode="tail">
                  {teamName}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Bloque horizontal: solo las estadísticas se desplazan */}
        <ScrollView
          horizontal
          bounces={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalContent}
        >
          <View style={{ width: STATS_TABLE_WIDTH }}>
            <View style={styles.statsHeaderRow}>
              {STAT_COLS.map((col) => (
                <View
                  key={`header-${String(col.key)}`}
                  style={[styles.statHeaderCell, { width: STAT_COL_WIDTH }]}
                >
                  <Text style={[styles.headerText, col.highlight && styles.pointsHeaderText]}>
                    {col.label}
                  </Text>
                </View>
              ))}
            </View>

            {rows.map((item, index) => {
              const isEven = index % 2 === 0;

              return (
                <View
                  key={`stats-${getRowKey(item, index)}`}
                  style={[styles.statsDataRow, isEven && styles.rowAlt]}
                >
                  {STAT_COLS.map((col) => {
                    const rawValue = (item as any)?.[col.key];
                    const numericValue = Number(rawValue);
                    const isNegativeGoalDiff =
                      col.key === 'diferencia_goles' && Number.isFinite(numericValue) && numericValue < 0;

                    return (
                      <View
                        key={`${getRowKey(item, index)}-${String(col.key)}`}
                        style={[styles.statCell, { width: STAT_COL_WIDTH }]}
                      >
                        <Text
                          style={[
                            styles.statText,
                            col.highlight && styles.pointsText,
                            isNegativeGoalDiff && styles.negativeText,
                          ]}
                        >
                          {getStatDisplay(item, col.key)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ClassificationScreen
// ---------------------------------------------------------------------------

interface ClassificationScreenProps {
  /** Si es true, no renderiza el header propio porque está embebida en otra pantalla. */
  embedded?: boolean;
}

export function ClassificationScreen({ embedded = false }: ClassificationScreenProps) {
  const { session } = useActiveLeague();
  const ligaId = session?.leagueId ? Number(session.leagueId) : 0;

  const { data, isLoading, isError, refetch } = useClassification(ligaId);

  // El hook debería devolver array, pero defendemos el render para evitar roturas visuales.
  const rows = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  if (!session || ligaId <= 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredState}>
          <Text style={styles.emptyTitle}>Sin liga activa</Text>
          <Text style={styles.emptySubtitle}>Selecciona una liga para ver su clasificación.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={embedded ? [] : ['top']}>
      {/* Header propio. Se oculta cuando esta pantalla se usa dentro de otro layout. */}
      {!embedded && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Clasificación</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {session.leagueName}
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={C.brand}
            colors={[C.brand]}
          />
        }
      >
        {isLoading && <ClassificationSkeleton />}

        {!isLoading && isError && (
          <View style={styles.centeredState}>
            <Text style={styles.emptyTitle}>No se pudo cargar la clasificación</Text>
            <Text style={styles.emptySubtitle}>Desliza hacia abajo para intentarlo de nuevo.</Text>
          </View>
        )}

        {!isLoading && !isError && rows.length === 0 && (
          <View style={styles.centeredState}>
            <View style={styles.emptyIconWrap}>
              <Text style={styles.emptyIcon}>📊</Text>
            </View>
            <Text style={styles.emptyTitle}>Sin clasificación todavía</Text>
            <Text style={styles.emptySubtitle}>
              La tabla se actualizará cuando haya partidos finalizados.
            </Text>
          </View>
        )}

        {!isLoading && !isError && rows.length > 0 && <ClassificationTable rows={rows} />}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Estilos
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  headerTitle: {
    color: C.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    marginTop: 4,
    color: C.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },

  // Estados de carga, vacío y error
  centeredState: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyTitle: {
    color: C.text,
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: C.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },

  // Card principal de la tabla
  tableCard: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  tableTopBar: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  tableTitle: {
    color: C.text,
    fontSize: 17,
    fontWeight: '800',
  },
  tableHint: {
    marginTop: 3,
    color: C.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },

  // Shell con columna fija + bloque horizontal
  tableShell: {
    flexDirection: 'row',
    backgroundColor: C.surface,
  },
  fixedColumn: {
    width: LEFT_COL_WIDTH,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: C.borderStrong,
    backgroundColor: C.surface,
    zIndex: 2,
  },
  fixedHeaderCell: {
    height: HEADER_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: C.surfaceMuted,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  fixedBodyCell: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  rowAlt: {
    backgroundColor: 'rgba(255,255,255,0.018)',
  },
  positionText: {
    width: 30,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'left',
  },
  teamNameText: {
    flex: 1,
    color: C.text,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  // Bloque horizontal de estadísticas
  horizontalContent: {
    minWidth: STATS_TABLE_WIDTH,
  },
  horizontalSkeletonContent: {
    minWidth: STATS_TABLE_WIDTH,
  },
  statsHeaderRow: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    backgroundColor: C.surfaceMuted,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  statHeaderCell: {
    height: HEADER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  headerText: {
    color: C.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  pointsHeaderText: {
    color: C.brand,
  },
  statsDataRow: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  statCell: {
    height: ROW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  statText: {
    color: C.textSecondary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  pointsText: {
    color: C.text,
    fontSize: 17,
    fontWeight: '900',
  },
  negativeText: {
    color: C.danger,
  },

  // Skeleton
  skeletonBlock: {
    backgroundColor: C.surfaceMuted,
  },
  skeletonPosition: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.surfaceMuted,
    marginRight: 10,
  },
  skeletonName: {
    flex: 1,
    height: 14,
    borderRadius: 7,
    backgroundColor: C.surfaceMuted,
  },
  skeletonStatHeader: {
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignSelf: 'center',
    marginTop: 15,
    marginHorizontal: 10,
  },
  skeletonStatCell: {
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignSelf: 'center',
    marginTop: 22,
    marginHorizontal: 10,
  },
});
