/**
 * ClassificationScreen.tsx
 *
 * Tabla de clasificación de la liga activa.
 *
 * DISEÑO MOBILE:
 * - Columna izquierda fija: posición + nombre de equipo (no scrollea horizontalmente)
 * - Columna derecha scrolleable: PJ, V, E, D, GF, GC, DG, Pts
 * - Pts siempre en negrita y destacado
 *
 * DATOS:
 * - GET /ligas/{liga_id}/clasificacion via useClassification
 * - Empty state si [] (liga sin partidos finalizados)
 * - No rompe si el endpoint falla (fallback [] en el hook)
 */

import React from 'react';
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
// Columnas de stats scrolleables
// ---------------------------------------------------------------------------

const STAT_COLS: { key: keyof ClasificacionItem; label: string; highlight?: boolean }[] = [
  { key: 'partidos_jugados', label: 'PJ' },
  { key: 'victorias',        label: 'V' },
  { key: 'empates',          label: 'E' },
  { key: 'derrotas',         label: 'D' },
  { key: 'goles_favor',      label: 'GF' },
  { key: 'goles_contra',     label: 'GC' },
  { key: 'diferencia_goles', label: 'DG' },
  { key: 'puntos',           label: 'Pts', highlight: true },
];

const COL_WIDTH = 36;
const LEFT_COL_WIDTH = 180; // pos (28) + nombre

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function TableSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={[skeletonStyles.row, { opacity: 1 - i * 0.12 }]}>
          <View style={skeletonStyles.left}>
            <View style={skeletonStyles.posBox} />
            <View style={skeletonStyles.nameLine} />
          </View>
          <View style={skeletonStyles.right}>
            {STAT_COLS.map((c) => (
              <View key={c.key} style={[skeletonStyles.cell, { width: COL_WIDTH }]} />
            ))}
          </View>
        </View>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Fila de la tabla
// ---------------------------------------------------------------------------

interface RowProps {
  item: ClasificacionItem;
  index: number;
}

function TableRow({ item, index }: RowProps) {
  // Top 3 con color especial en la posición
  const posColor =
    item.posicion === 1 ? '#FFD60A'
    : item.posicion === 2 ? '#A8A9AD'
    : item.posicion === 3 ? '#CD7F32'
    : Colors.text.secondary;

  const isEven = index % 2 === 0;

  return (
    <View style={[rowStyles.row, isEven && rowStyles.rowAlt]}>
      {/* ── Columna fija: posición + nombre ── */}
      <View style={rowStyles.leftCol}>
        <Text style={[rowStyles.pos, { color: posColor }]}>
          {item.posicion}
        </Text>
        <Text style={rowStyles.name} numberOfLines={1}>
          {item.nombre_equipo}
        </Text>
      </View>

      {/* ── Columnas scrolleables ── */}
      {STAT_COLS.map((col) => {
        const val = item[col.key];
        const display = typeof val === 'number'
          ? (val > 0 && col.key === 'diferencia_goles' ? `+${val}` : String(val))
          : '–';
        return (
          <Text
            key={col.key}
            style={[
              rowStyles.cell,
              { width: COL_WIDTH },
              col.highlight && rowStyles.pts,
              col.key === 'diferencia_goles' && typeof val === 'number' && val < 0 && rowStyles.negative,
            ]}
          >
            {display}
          </Text>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// ClassificationScreen
// ---------------------------------------------------------------------------

interface ClassificationScreenProps {
  /** Si es true, no renderiza el header propio (usado al embeber en otra pantalla) */
  embedded?: boolean;
}

export function ClassificationScreen({ embedded = false }: ClassificationScreenProps) {
  const { session } = useActiveLeague();
  const ligaId = session?.leagueId ? Number(session.leagueId) : 0;

  const { data: rows, isLoading, isError, refetch } = useClassification(ligaId);

  if (!session || ligaId <= 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Sin liga activa</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={embedded ? [] : ['top']}>
      {/* Header — oculto en modo embebido */}
      {!embedded && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Clasificación</Text>
          <Text style={styles.headerSubtitle}>{session.leagueName}</Text>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={Colors.brand.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Error */}
        {!isLoading && isError && (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>No se pudo cargar la clasificación</Text>
          </View>
        )}

        {/* Empty state */}
        {!isLoading && !isError && rows.length === 0 && (
          <View style={styles.centered}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>Sin clasificación todavía</Text>
            <Text style={styles.emptySubtitle}>
              La tabla se actualizará cuando haya partidos finalizados.
            </Text>
          </View>
        )}

        {/* Tabla */}
        {(isLoading || rows.length > 0) && (
          <View style={styles.tableWrapper}>
            {/* Cabecera */}
            <View style={headerStyles.row}>
              <Text style={[headerStyles.leftCell, { width: LEFT_COL_WIDTH }]}># Equipo</Text>
              {STAT_COLS.map((col) => (
                <Text
                  key={col.key}
                  style={[
                    headerStyles.cell,
                    { width: COL_WIDTH },
                    col.highlight && headerStyles.ptsHeader,
                  ]}
                >
                  {col.label}
                </Text>
              ))}
            </View>

            {/* Skeleton o filas */}
            {isLoading
              ? <TableSkeleton />
              : rows.map((item, idx) => (
                  <TableRow key={item.id_equipo} item={item} index={idx} />
                ))
            }
          </View>
        )}
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
    backgroundColor: Colors.bg.base,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    color: Colors.text.primary,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: Colors.text.secondary,
    fontSize: 13,
    marginTop: 2,
  },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 32 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
    gap: 8,
  },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyTitle: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: Colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  tableWrapper: {
    // La tabla entera scrollea horizontalmente para las columnas de stats
    // La columna izquierda (pos + nombre) se comporta como sticky visualmente
    // porque el ScrollView horizontal envuelve solo la parte derecha.
    marginHorizontal: 0,
  },
});

const headerStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.surface2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bg.base,
  },
  leftCell: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    flex: 1,
  },
  cell: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  ptsHeader: {
    color: Colors.brand.primary,
  },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bg.surface2,
  },
  rowAlt: {
    // Filas alternas ligeramente más claras para mejorar legibilidad
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  leftCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 8,
  },
  pos: {
    width: 22,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  name: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  cell: {
    color: Colors.text.secondary,
    fontSize: 13,
    textAlign: 'center',
  },
  pts: {
    color: Colors.text.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  negative: {
    color: Colors.semantic.error,
  },
});

const skeletonStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bg.surface2,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 8,
  },
  posBox: {
    width: 22,
    height: 14,
    borderRadius: 4,
    backgroundColor: Colors.bg.surface2,
  },
  nameLine: {
    flex: 1,
    height: 12,
    borderRadius: 4,
    backgroundColor: Colors.bg.surface2,
    maxWidth: 120,
  },
  right: {
    flexDirection: 'row',
    gap: 0,
  },
  cell: {
    height: 12,
    borderRadius: 4,
    backgroundColor: Colors.bg.surface2,
    marginHorizontal: 4,
  },
});
