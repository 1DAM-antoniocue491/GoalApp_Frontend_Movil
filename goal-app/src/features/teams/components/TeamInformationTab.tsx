/**
 * TeamInformationTab.tsx
 *
 * Tab "Información" del detalle de un equipo.
 * Muestra stats de temporada + info del club (estadio, entrenador).
 *
 * Recibe el detalle ya cargado desde TeamDetailScreen — no hace fetch propio.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '@/src/shared/constants/colors';
import type { EquipoDetalleResponse } from '../types/teams.types';

interface TeamInformationTabProps {
  detail: EquipoDetalleResponse;
}

interface StatItemProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

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

export function TeamInformationTab({ detail }: TeamInformationTabProps) {
  const pj = detail.partidos_jugados ?? 0;
  const v  = detail.victorias ?? 0;
  const e  = detail.empates ?? 0;
  const d  = detail.derrotas ?? 0;
  // Win rate solo si hay partidos jugados
  const winRate = pj > 0 ? `${Math.round((v / pj) * 100)}%` : '–';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Stats de temporada ── */}
      <Text style={styles.sectionTitle}>Temporada</Text>
      <View style={styles.statsGrid}>
        <StatItem label="PJ"     value={pj} />
        <StatItem label="V"      value={v} />
        <StatItem label="E"      value={e} />
        <StatItem label="D"      value={d} />
        <StatItem label="GF"     value={detail.goles_favor    ?? '–'} />
        <StatItem label="GC"     value={detail.goles_contra   ?? '–'} />
        <StatItem label="DG"     value={detail.diferencia_goles != null
          ? (detail.diferencia_goles > 0 ? `+${detail.diferencia_goles}` : String(detail.diferencia_goles))
          : '–'} />
        <StatItem label="Pts"    value={detail.puntos ?? '–'} highlight />
        <StatItem label="Win %"  value={winRate} highlight />
        <StatItem label="Pos."   value={detail.posicion ?? '–'} />
      </View>

      {/* ── Info del club ── */}
      {(detail.estadio || detail.entrenador || detail.temporada) && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Club</Text>
          <View style={styles.infoCard}>
            {detail.estadio && (
              <InfoRow icon="🏟" label="Estadio" value={detail.estadio} />
            )}
            {detail.entrenador && (
              <InfoRow icon="👤" label="Entrenador" value={detail.entrenador} />
            )}
            {detail.temporada && (
              <InfoRow icon="📅" label="Temporada" value={detail.temporada} />
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.icon}>{icon}</Text>
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
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 4,
  },
  value: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  valueHighlight: {
    color: Colors.brand.primary,
  },
  label: {
    color: Colors.text.secondary,
    fontSize: 10,
    fontWeight: '500',
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
  icon: { fontSize: 18 },
  textGroup: { flex: 1, gap: 2 },
  label: { color: Colors.text.secondary, fontSize: 11 },
  value: { color: Colors.text.primary, fontSize: 14, fontWeight: '500' },
});
