/**
 * LiveMatchSquadsScreen
 *
 * Pantalla informativa de plantillas para un partido EN VIVO.
 * Solo lectura — no permite selección ni acciones.
 *
 * TODO: reemplazar mock por GET /matches/:id/squads cuando la API esté disponible.
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';

// ---------------------------------------------------------------------------
// Tipos y mock de jugadores
// ---------------------------------------------------------------------------

interface SquadPlayer {
  dorsal: number;
  name: string;
  position: 'POR' | 'DEF' | 'MED' | 'DEL';
}

// TODO: reemplazar por GET /matches/:id/squads
const MOCK_HOME_PLAYERS: SquadPlayer[] = [
  { dorsal: 1,  name: 'Ter Stegen',   position: 'POR' },
  { dorsal: 3,  name: 'Balde',         position: 'DEF' },
  { dorsal: 4,  name: 'Christensen',   position: 'DEF' },
  { dorsal: 5,  name: 'I. Martínez',   position: 'DEF' },
  { dorsal: 23, name: 'Koundé',        position: 'DEF' },
  { dorsal: 8,  name: 'Pedri',         position: 'MED' },
  { dorsal: 16, name: 'Fermín',        position: 'MED' },
  { dorsal: 6,  name: 'Gavi',          position: 'MED' },
  { dorsal: 19, name: 'Lamine Yamal',  position: 'DEL' },
  { dorsal: 9,  name: 'Lewandowski',   position: 'DEL' },
  { dorsal: 11, name: 'Raphinha',      position: 'DEL' },
];

const MOCK_AWAY_PLAYERS: SquadPlayer[] = [
  { dorsal: 1,  name: 'Courtois',   position: 'POR' },
  { dorsal: 3,  name: 'Mendy',      position: 'DEF' },
  { dorsal: 4,  name: 'Alaba',      position: 'DEF' },
  { dorsal: 6,  name: 'Nacho',      position: 'DEF' },
  { dorsal: 22, name: 'Carvajal',   position: 'DEF' },
  { dorsal: 8,  name: 'Kroos',      position: 'MED' },
  { dorsal: 10, name: 'Modric',     position: 'MED' },
  { dorsal: 14, name: 'Valverde',   position: 'MED' },
  { dorsal: 5,  name: 'Bellingham', position: 'MED' },
  { dorsal: 7,  name: 'Vinicius',   position: 'DEL' },
  { dorsal: 11, name: 'Rodrygo',    position: 'DEL' },
];

// ---------------------------------------------------------------------------
// Constantes de posición
// ---------------------------------------------------------------------------

const POSITION_LABEL: Record<SquadPlayer['position'], string> = {
  POR: 'Portero',
  DEF: 'Defensa',
  MED: 'Centrocampista',
  DEL: 'Delantero',
};

// Color de acento por posición — no existe token global para esto, se define aquí
const POSITION_COLOR: Record<SquadPlayer['position'], string> = {
  POR: Colors.semantic.warning,
  DEF: Colors.brand.secondary,
  MED: Colors.brand.primary,
  DEL: Colors.semantic.error,
};

/** Orden canónico de grupos de posición en una plantilla */
const POSITION_ORDER: SquadPlayer['position'][] = ['POR', 'DEF', 'MED', 'DEL'];

const POSITION_GROUP_LABEL: Record<SquadPlayer['position'], string> = {
  POR: 'Porteros',
  DEF: 'Defensas',
  MED: 'Centrocampistas',
  DEL: 'Delanteros',
};

// ---------------------------------------------------------------------------
// Sub-componente: fila de jugador
// ---------------------------------------------------------------------------

function PlayerRow({ player }: { player: SquadPlayer }) {
  const posColor = POSITION_COLOR[player.position];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.bg.surface1,
        borderRadius: theme.borderRadius.lg,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 6,
        gap: 12,
      }}
    >
      {/* Dorsal — fondo circular sutil */}
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: Colors.bg.surface2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: Colors.text.secondary, fontSize: 12, fontWeight: '700' }}>
          {player.dorsal}
        </Text>
      </View>

      {/* Nombre */}
      <Text style={{ color: Colors.text.primary, fontSize: 15, fontWeight: '500', flex: 1 }}>
        {player.name}
      </Text>

      {/* Badge de posición con color de acento */}
      <View
        style={{
          backgroundColor: posColor + '18',
          borderRadius: 999,
          paddingHorizontal: 9,
          paddingVertical: 3,
          borderWidth: 1,
          // borderColor dinámico — no expresable con Tailwind estático
          borderColor: posColor + '44',
        }}
      >
        <Text style={{ color: posColor, fontSize: 11, fontWeight: '700' }}>
          {POSITION_LABEL[player.position]}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sub-componente: grupo de posición con cabecera
// ---------------------------------------------------------------------------

function PositionGroup({
  position,
  players,
}: {
  position: SquadPlayer['position'];
  players: SquadPlayer[];
}) {
  if (players.length === 0) return null;

  return (
    <View style={{ marginBottom: 20 }}>
      {/* Cabecera del grupo */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 10,
        }}
      >
        {/* Línea de acento izquierda */}
        <View
          style={{
            width: 3,
            height: 14,
            borderRadius: 2,
            // backgroundColor dinámico por posición
            backgroundColor: POSITION_COLOR[position],
          }}
        />
        <Text style={{ color: Colors.text.secondary, fontSize: 12, fontWeight: '700', letterSpacing: 0.8 }}>
          {POSITION_GROUP_LABEL[position].toUpperCase()}
        </Text>
        <Text style={{ color: Colors.text.disabled, fontSize: 12 }}>
          {players.length}
        </Text>
      </View>

      {players.map((p) => (
        <PlayerRow key={p.dorsal} player={p} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

type TeamTab = 'home' | 'away';

export function LiveMatchSquadsScreen() {
  const router = useRouter();
  // matchId disponible para GET /matches/:id/squads cuando la API esté lista
  const { matchId } = useLocalSearchParams<{ matchId: string }>();

  const [activeTab, setActiveTab] = useState<TeamTab>('home');

  // TODO: reemplazar por hook useMatchSquads(matchId)
  const homeTeam = 'FC Barcelona';
  const awayTeam = 'Real Madrid';

  const players = activeTab === 'home' ? MOCK_HOME_PLAYERS : MOCK_AWAY_PLAYERS;

  // Agrupa los jugadores por posición según el orden canónico
  const grouped = POSITION_ORDER.map((pos) => ({
    position: pos,
    players: players.filter((p) => p.position === pos),
  }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.base }}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: Colors.bg.surface2,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: 12, padding: 2 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.text.primary, fontSize: 17, fontWeight: '700' }}>
            Plantillas
          </Text>
          <Text style={{ color: Colors.text.secondary, fontSize: 12, marginTop: 1 }}>
            {homeTeam} vs {awayTeam}
          </Text>
        </View>

        {/* Badge EN VIVO con pulso visual pasivo */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            backgroundColor: Colors.bg.surface1,
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderWidth: 1,
            borderColor: Colors.brand.primary + '33',
          }}
        >
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: Colors.brand.primary,
            }}
          />
          <Text style={{ color: Colors.brand.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
            EN VIVO
          </Text>
        </View>
      </View>

      {/* ── Tabs de equipo ── */}
      <View
        style={{
          flexDirection: 'row',
          marginHorizontal: 16,
          marginTop: 14,
          marginBottom: 4,
          backgroundColor: Colors.bg.surface1,
          borderRadius: theme.borderRadius.xl,
          padding: 4,
        }}
      >
        {([
          { key: 'home' as TeamTab, label: homeTeam },
          { key: 'away' as TeamTab, label: awayTeam },
        ]).map(({ key, label }) => {
          const isActive = activeTab === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setActiveTab(key)}
              style={{
                flex: 1,
                paddingVertical: 9,
                borderRadius: theme.borderRadius.lg,
                alignItems: 'center',
                // Fondo activo sólido vs transparente
                backgroundColor: isActive ? Colors.brand.primary : 'transparent',
              }}
            >
              <Text
                style={{
                  color: isActive ? Colors.bg.base : Colors.text.secondary,
                  fontSize: 13,
                  fontWeight: '700',
                }}
                numberOfLines={1}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Lista de jugadores agrupados por posición ── */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingTop: 14, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {grouped.map(({ position, players: posPlayers }) => (
          <PositionGroup key={position} position={position} players={posPlayers} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
