/**
 * ProgrammedMatchDetailScreen
 *
 * Vista detallada de un partido programado.
 * Muestra los datos del encuentro en la cabecera y la alineación de:
 *   - Equipo local (titulares / suplentes )
 *   - Equipo visitante (titulares / suplentes)
 *
 * MODO: Solo lectura. No se guarda ningún dato.
 *
 * DATOS:
 * Consume mockUpcomingMatches mientras la API no esté disponible.
 *
 * TODO:
 * - Recibir alineación desde GET /matches/:id/lineup
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { mockUpcomingMatches } from '@/src/mocks/dashboard.mocks';

// ---------------------------------------------------------------------------
// Tipos y mocks de plantilla
// ---------------------------------------------------------------------------

interface SquadPlayer {
  id: string;
  dorsal: number;
  name: string;
  position: 'POR' | 'DEF' | 'MED' | 'DEL';
  role: 'titular' | 'suplente';
}

const MOCK_SQUAD_HOME: SquadPlayer[] = [
  { id: 'h1', dorsal: 1, name: 'Ter Stegen', position: 'POR', role: 'titular' },
  { id: 'h2', dorsal: 13, name: 'Iñaki Peña', position: 'POR', role: 'suplente' },
  { id: 'h3', dorsal: 3, name: 'Balde', position: 'DEF', role: 'titular' },
  { id: 'h4', dorsal: 4, name: 'Christensen', position: 'DEF', role: 'titular' },
  { id: 'h5', dorsal: 5, name: 'I. Martínez', position: 'DEF', role: 'titular' },
  { id: 'h6', dorsal: 23, name: 'Koundé', position: 'DEF', role: 'titular' },
  { id: 'h7', dorsal: 24, name: 'Cubarsí', position: 'DEF', role: 'suplente' },
  { id: 'h8', dorsal: 8, name: 'Pedri', position: 'MED', role: 'titular' },
  { id: 'h9', dorsal: 16, name: 'Fermín', position: 'MED', role: 'suplente' },
  { id: 'h10', dorsal: 6, name: 'Gavi', position: 'MED', role: 'titular' },
  { id: 'h11', dorsal: 17, name: 'Dani Olmo', position: 'MED', role: 'titular' },
  { id: 'h13', dorsal: 19, name: 'Lamine Yamal', position: 'DEL', role: 'titular' },
  { id: 'h14', dorsal: 9, name: 'Lewandowski', position: 'DEL', role: 'titular' },
  { id: 'h15', dorsal: 11, name: 'Raphinha', position: 'DEL', role: 'titular' },
  { id: 'h16', dorsal: 10, name: 'Ansu Fati', position: 'DEL', role: 'suplente' },
  { id: 'h18', dorsal: 7, name: 'Ferran Torres', position: 'DEL', role: 'suplente' },
];

const MOCK_SQUAD_AWAY: SquadPlayer[] = [
  { id: 'a1', dorsal: 1, name: 'Courtois', position: 'POR', role: 'titular' },
  { id: 'a2', dorsal: 25, name: 'Lunin', position: 'POR', role: 'suplente' },
  { id: 'a3', dorsal: 3, name: 'F. Mendy', position: 'DEF', role: 'titular' },
  { id: 'a5', dorsal: 5, name: 'Rüdiger', position: 'DEF', role: 'titular' },
  { id: 'a6', dorsal: 23, name: 'Militão', position: 'DEF', role: 'titular' },
  { id: 'a7', dorsal: 6, name: 'Nacho', position: 'DEF', role: 'suplente' },
  { id: 'a8', dorsal: 8, name: 'Kroos', position: 'MED', role: 'titular' },
  { id: 'a9', dorsal: 15, name: 'Valverde', position: 'MED', role: 'titular' },
  { id: 'a10', dorsal: 18, name: 'Tchouaméni', position: 'MED', role: 'titular' },
  { id: 'a11', dorsal: 10, name: 'Modric', position: 'MED', role: 'suplente' },
  { id: 'a12', dorsal: 14, name: 'Camavinga', position: 'MED', role: 'suplente' },
  { id: 'a13', dorsal: 11, name: 'Rodrygo', position: 'DEL', role: 'titular' },
  { id: 'a15', dorsal: 7, name: 'Vinicius Jr.', position: 'DEL', role: 'titular' },
  { id: 'a16', dorsal: 20, name: 'Brahim Díaz', position: 'DEL', role: 'suplente' },
  { id: 'a17', dorsal: 17, name: 'Lucas Vázquez', position: 'DEL', role: 'suplente' },
  { id: 'a18', dorsal: 21, name: 'Joselu', position: 'DEL', role: 'titular' },
];

// ---------------------------------------------------------------------------
// Constantes de posición
// ---------------------------------------------------------------------------

const POSITION_ORDER: SquadPlayer['position'][] = ['POR', 'DEF', 'MED', 'DEL'];

const POSITION_GROUP_LABEL: Record<SquadPlayer['position'], string> = {
  POR: 'Porteros',
  DEF: 'Defensas',
  MED: 'Centrocampistas',
  DEL: 'Delanteros',
};

const POSITION_COLOR: Record<SquadPlayer['position'], string> = {
  POR: Colors.semantic.warning,
  DEF: Colors.brand.secondary,
  MED: Colors.brand.primary,
  DEL: Colors.semantic.error,
};

const ROLE_COLOR: Record<SquadPlayer['role'], string> = {
  titular: Colors.brand.primary,
  suplente: Colors.brand.secondary,
};

const ROLE_LABEL: Record<SquadPlayer['role'], string> = {
  titular: 'Titular',
  suplente: 'Suplente',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function PositionGroupHeader({
  position,
  count,
}: {
  position: SquadPlayer['position'];
  count: number;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 8 }}>
      <View style={{ width: 3, height: 13, borderRadius: 2, backgroundColor: POSITION_COLOR[position] }} />
      <Text style={{ color: Colors.text.secondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 }}>
        {POSITION_GROUP_LABEL[position].toUpperCase()}
      </Text>
      <Text style={{ color: Colors.text.disabled, fontSize: 11 }}>{count}</Text>
    </View>
  );
}

function PositionBadge({ position }: { position: SquadPlayer['position'] }) {
  const color = POSITION_COLOR[position];
  return (
    <View style={{
      backgroundColor: color + '18',
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderWidth: 1,
      borderColor: color + '40',
      marginRight: 10,
    }}>
      <Text style={{ color, fontSize: 10, fontWeight: '700' }}>{position}</Text>
    </View>
  );
}

function DorsalBadge({ dorsal }: { dorsal: number }) {
  return (
    <View style={{
      width: 30, height: 30, borderRadius: 15,
      backgroundColor: Colors.bg.surface2,
      alignItems: 'center', justifyContent: 'center', marginRight: 12,
    }}>
      <Text style={{ color: Colors.text.secondary, fontSize: 11, fontWeight: '700' }}>
        {dorsal}
      </Text>
    </View>
  );
}

function RoleBadge({ role }: { role: SquadPlayer['role'] }) {
  const color = ROLE_COLOR[role];
  return (
    <View style={{
      backgroundColor: color + '20',
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 3,
    }}>
      <Text style={{ color, fontSize: 11, fontWeight: '700' }}>
        {ROLE_LABEL[role]}
      </Text>
    </View>
  );
}

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      marginHorizontal: 16, marginTop: 10,
      backgroundColor: Colors.bg.surface1,
      borderRadius: theme.borderRadius.xl,
      paddingHorizontal: 12, paddingVertical: 9, gap: 8,
      borderWidth: 1,
      borderColor: value.length > 0 ? Colors.brand.primary + '44' : 'transparent',
    }}>
      <Ionicons name="search" size={16} color={Colors.text.disabled} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Buscar jugador..."
        placeholderTextColor={Colors.text.disabled}
        style={{ flex: 1, color: Colors.text.primary, fontSize: 14, padding: 0 }}
        returnKeyType="search"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChange('')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Ionicons name="close-circle" size={16} color={Colors.text.disabled} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function TeamBadge({ letter, color }: { letter: string; color: string }) {
  return (
    <View style={{
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: color + '22',
      borderWidth: 2, borderColor: color,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ color, fontSize: 18, fontWeight: '800' }}>{letter}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

type ActiveSubTab = 'titulares' | 'suplentes';
type ActiveTeam = 'home' | 'away';

export function ProgrammedMatchDetailScreen() {
  const router = useRouter();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();

  const [activeTeam, setActiveTeam] = useState<ActiveTeam>('home');
  const [activeSubTab, setActiveSubTab] = useState<ActiveSubTab>('titulares');
  const [query, setQuery] = useState('');

  const match = mockUpcomingMatches[0];
  const homeColor = match?.homeColor ?? '#A1A1AA';
  const awayColor = match?.awayColor ?? '#C4F135';

  const currentSquad = activeTeam === 'home' ? MOCK_SQUAD_HOME : MOCK_SQUAD_AWAY;

  const titularCount = currentSquad.filter(p => p.role === 'titular').length;
  const suplenteCount = currentSquad.filter(p => p.role === 'suplente').length;

  const filteredPlayers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return currentSquad.filter(p => {
      const matchesTab =
        activeSubTab === 'titulares'
          ? p.role === 'titular'
          : p.role === 'suplente';
      const matchesQuery =
        !q || p.name.toLowerCase().includes(q) || String(p.dorsal).includes(q);
      return matchesTab && matchesQuery;
    });
  }, [currentSquad, query, activeSubTab]);

  const groups = POSITION_ORDER
    .map(pos => ({ position: pos, players: filteredPlayers.filter(p => p.position === pos) }))
    .filter(g => g.players.length > 0);

  const SUB_TABS: { key: ActiveSubTab; label: string; count: number }[] = [
    { key: 'titulares', label: 'Titulares', count: titularCount },
    { key: 'suplentes', label: 'Suplentes', count: suplenteCount },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg.base }}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: Colors.bg.surface2,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: 12, padding: 2 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.text.primary, fontSize: 17, fontWeight: '700' }}>
            Detalle del partido
          </Text>
          {match && (
            <Text style={{ color: Colors.text.secondary, fontSize: 12, marginTop: 1 }}>
              {match.round}
            </Text>
          )}
        </View>
      </View>

      {/* ── Tarjeta de enfrentamiento ── */}
      {match ? (
        <View className="mx-4 mt-4 bg-[#18181B] rounded-2xl px-5 py-5 border border-[#27272A]">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 items-center">
              <TeamBadge letter={match.homeTeam.charAt(0)} color={homeColor} />
              <Text className="text-white text-sm font-medium mt-2 text-center" numberOfLines={2}>
                {match.homeTeam}
              </Text>
            </View>

            <View className="items-center px-4 min-w-[90px]">
              <Text className="text-zinc-400 text-xs font-medium">
                {match.day} {match.month}
              </Text>
              <Text className="text-white text-lg font-semibold mt-1">
                {match.time}
              </Text>
              <Text className="text-zinc-600 text-[10px] mt-1 tracking-widest">VS</Text>
            </View>

            <View className="flex-1 items-center">
              <TeamBadge letter={match.awayTeam.charAt(0)} color={awayColor} />
              <Text className="text-white text-sm font-medium mt-2 text-center" numberOfLines={2}>
                {match.awayTeam}
              </Text>
            </View>
          </View>

          <View className="mt-5 h-px bg-[#27272A]" />

          <View className="mt-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5 flex-1">
              <Ionicons name="location-outline" size={13} color="#71717A" />
              <Text className="text-zinc-400 text-xs" numberOfLines={1}>{match.venue}</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="trophy-outline" size={13} color="#71717A" />
              <Text className="text-zinc-400 text-xs">{match.round}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View className="items-center p-10">
          <Ionicons name="alert-circle-outline" size={32} color="#71717A" />
          <Text className="text-zinc-500 text-sm mt-2 text-center">
            No se encontró información del partido
          </Text>
        </View>
      )}

      {/* ── Selector de equipo ── */}
      <View style={{
        flexDirection: 'row',
        marginHorizontal: 16, marginTop: 16,
        borderRadius: theme.borderRadius.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.bg.surface2,
      }}>
        {/* Equipo local */}
        <TouchableOpacity
          onPress={() => { setActiveTeam('home'); setActiveSubTab('titulares'); setQuery(''); }}
          activeOpacity={0.8}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 11,
            backgroundColor: activeTeam === 'home' ? homeColor + '22' : Colors.bg.surface1,
            borderRightWidth: 1,
            borderRightColor: Colors.bg.surface2,
          }}
        >
          <View style={{
            width: 10, height: 10, borderRadius: 5,
            backgroundColor: activeTeam === 'home' ? homeColor : Colors.text.disabled,
          }} />
          <Text style={{
            color: activeTeam === 'home' ? homeColor : Colors.text.secondary,
            fontSize: 13, fontWeight: '700',
          }} numberOfLines={1}>
            {match?.homeTeam ?? 'Local'}
          </Text>
        </TouchableOpacity>

        {/* Equipo visitante */}
        <TouchableOpacity
          onPress={() => { setActiveTeam('away'); setActiveSubTab('titulares'); setQuery(''); }}
          activeOpacity={0.8}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 11,
            backgroundColor: activeTeam === 'away' ? awayColor + '22' : Colors.bg.surface1,
          }}
        >
          <View style={{
            width: 10, height: 10, borderRadius: 5,
            backgroundColor: activeTeam === 'away' ? awayColor : Colors.text.disabled,
          }} />
          <Text style={{
            color: activeTeam === 'away' ? awayColor : Colors.text.secondary,
            fontSize: 13, fontWeight: '700',
          }} numberOfLines={1}>
            {match?.awayTeam ?? 'Visitante'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Resumen de contadores ── */}
      <View style={{
        flexDirection: 'row', gap: 10,
        paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: Colors.bg.surface2,
      }}>
        {[
          { label: 'Titulares', value: titularCount, color: Colors.brand.primary },
          { label: 'Suplentes', value: suplenteCount, color: Colors.brand.secondary },
        ].map(({ label, value, color }) => (
          <View key={label} style={{
            flex: 1, backgroundColor: Colors.bg.surface1,
            borderRadius: theme.borderRadius.lg, padding: 10, alignItems: 'center',
          }}>
            <Text style={{ color, fontSize: 20, fontWeight: '800', lineHeight: 24 }}>
              {value}
            </Text>
            <Text style={{ color: Colors.text.secondary, fontSize: 11, marginTop: 2 }}>{label}</Text>
          </View>
        ))}
      </View>

      {/* ── Sub-tabs: Titulares / Suplentes / Disponibles ── */}
      <View style={{
        flexDirection: 'row',
        marginHorizontal: 16, marginTop: 12,
        backgroundColor: Colors.bg.surface1,
        borderRadius: theme.borderRadius.xl,
        padding: 4,
      }}>
        {SUB_TABS.map(({ key, label, count }) => {
          const isActive = activeSubTab === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setActiveSubTab(key)}
              style={{
                flex: 1, paddingVertical: 8,
                borderRadius: theme.borderRadius.lg,
                alignItems: 'center',
                backgroundColor: isActive ? Colors.brand.primary : 'transparent',
              }}
            >
              <Text style={{
                color: isActive ? Colors.bg.base : Colors.text.secondary,
                fontSize: 12, fontWeight: '700',
              }}>
                {label}{count > 0 ? ` ${count}` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <SearchBar value={query} onChange={setQuery} />

      {/* ── Lista de jugadores (solo lectura) ── */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {groups.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 48 }}>
            <Ionicons
              name={query.length > 0 ? 'search-outline' : 'people-outline'}
              size={32}
              color={Colors.text.disabled}
            />
            <Text style={{ color: Colors.text.disabled, fontSize: 14, marginTop: 10 }}>
              {query.length > 0
                ? `Sin resultados para "${query}"`
                : activeSubTab === 'titulares' ? 'No hay titulares registrados'
                  : activeSubTab === 'suplentes' ? 'No hay suplentes registrados'
                    : 'No hay jugadores disponibles'}
            </Text>
          </View>
        ) : (
          groups.map(({ position, players }) => (
            <View key={position}>
              <PositionGroupHeader position={position} count={players.length} />
              {players.map(player => {
                const borderColor =
                  player.role === 'titular' ? Colors.brand.primary + '50' :
                    player.role === 'suplente' ? Colors.brand.secondary + '50' : 'transparent';

                return (
                  <View key={player.id} style={{
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: Colors.bg.surface1,
                    borderRadius: theme.borderRadius.lg,
                    paddingHorizontal: 14, paddingVertical: 11, marginBottom: 5,
                    borderWidth: 1, borderColor,
                  }}>
                    <DorsalBadge dorsal={player.dorsal} />
                    <Text style={{
                      color: Colors.text.primary, fontSize: 15, fontWeight: '500', flex: 1,
                    }}>
                      {player.name}
                    </Text>
                    <PositionBadge position={player.position} />
                    <RoleBadge role={player.role} />
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
