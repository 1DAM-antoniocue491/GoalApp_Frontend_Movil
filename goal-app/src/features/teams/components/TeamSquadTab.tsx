/**
 * TeamSquadTab.tsx
 *
 * Tab "Plantilla" del detalle de un equipo.
 *
 * ESTADO ACTUAL:
 * El endpoint GET /equipos/{id}/detalle puede devolver `jugadores[]` dentro del detalle.
 * Si viene vacío o no hay endpoint claro de plantilla independiente,
 * se muestra empty state. No se inventan datos.
 *
 * CUANDO ESTÉ DISPONIBLE EL ENDPOINT:
 * - Conectar GET /equipos/{id}/jugadores o similar
 * - Organizar por posición: Porteros / Defensas / Centrocampistas / Delanteros
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '@/src/shared/constants/colors';
import type { JugadorResumen } from '../types/teams.types';

interface TeamSquadTabProps {
  /** Jugadores del detalle del equipo. Puede ser undefined si el endpoint no los incluye aún. */
  jugadores?: JugadorResumen[];
}

// Orden de posiciones para agrupar la plantilla
const POSITION_ORDER = ['Portero', 'Defensa', 'Centrocampista', 'Delantero'];
const POSITION_FALLBACK = 'Sin posición';

export function TeamSquadTab({ jugadores }: TeamSquadTabProps) {
  const hasPlayers = Array.isArray(jugadores) && jugadores.length > 0;

  if (!hasPlayers) {
    return (
      <View style={styles.centered}>
        <Text style={styles.icon}>👥</Text>
        <Text style={styles.title}>Plantilla no disponible</Text>
        <Text style={styles.subtitle}>
          Los jugadores se mostrarán aquí cuando estén registrados en la liga.
        </Text>
      </View>
    );
  }

  // Agrupar jugadores por posición
  const groups: Record<string, JugadorResumen[]> = {};
  for (const j of jugadores) {
    const pos = j.posicion ?? POSITION_FALLBACK;
    if (!groups[pos]) groups[pos] = [];
    groups[pos].push(j);
  }

  // Ordenar grupos: primero los conocidos, luego el resto
  const sortedKeys = [
    ...POSITION_ORDER.filter((p) => groups[p]),
    ...Object.keys(groups).filter((k) => !POSITION_ORDER.includes(k)),
  ];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {sortedKeys.map((pos) => (
        <View key={pos} style={styles.group}>
          <Text style={styles.groupTitle}>{pos}</Text>
          {groups[pos].map((j) => (
            <PlayerRow key={j.id_usuario} jugador={j} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

function PlayerRow({ jugador }: { jugador: JugadorResumen }) {
  const name = [jugador.nombre, jugador.apellido].filter(Boolean).join(' ');
  return (
    <View style={playerStyles.row}>
      {/* Dorsal */}
      <View style={playerStyles.dorsalBox}>
        <Text style={playerStyles.dorsal}>{jugador.dorsal ?? '–'}</Text>
      </View>
      {/* Nombre */}
      <Text style={playerStyles.name} numberOfLines={1}>{name}</Text>
      {/* Capitán */}
      {jugador.es_capitan && (
        <Text style={playerStyles.captain}>C</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  icon: { fontSize: 40, marginBottom: 8 },
  title: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  group: { marginBottom: 20 },
  groupTitle: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
});

const playerStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.surface1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    gap: 12,
  },
  dorsalBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.bg.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dorsal: {
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  name: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  captain: {
    color: Colors.brand.primary,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.brand.primary,
    borderRadius: 4,
  },
});
