/**
 * ProgrammedMatchConvocationScreen
 *
 * Selección de jugadores convocados para un partido programado.
 * Respeta los límites mínimo y máximo de la configuración de la liga.
 *
 * TODO:
 * - Reemplazar MOCK_SQUAD por GET /leagues/:id/teams/:teamId/players
 * - Leer MIN/MAX desde League.minConvocados / maxConvocados
 * - Enviar via POST /matches/:id/convocation { playerIds }
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';

// ---------------------------------------------------------------------------
// Tipos y mock
// ---------------------------------------------------------------------------

interface SquadPlayer {
  id: string;
  dorsal: number;
  name: string;
  position: 'POR' | 'DEF' | 'MED' | 'DEL';
}

// TODO: reemplazar por GET /leagues/:id/teams/:teamId/players
const MOCK_SQUAD: SquadPlayer[] = [
  { id: 'p1',  dorsal: 1,  name: 'Ter Stegen',   position: 'POR' },
  { id: 'p2',  dorsal: 13, name: 'Iñaki Peña',    position: 'POR' },
  { id: 'p3',  dorsal: 3,  name: 'Balde',          position: 'DEF' },
  { id: 'p4',  dorsal: 4,  name: 'Christensen',    position: 'DEF' },
  { id: 'p5',  dorsal: 5,  name: 'I. Martínez',    position: 'DEF' },
  { id: 'p6',  dorsal: 23, name: 'Koundé',         position: 'DEF' },
  { id: 'p7',  dorsal: 24, name: 'Cubarsí',        position: 'DEF' },
  { id: 'p8',  dorsal: 8,  name: 'Pedri',          position: 'MED' },
  { id: 'p9',  dorsal: 16, name: 'Fermín',         position: 'MED' },
  { id: 'p10', dorsal: 6,  name: 'Gavi',           position: 'MED' },
  { id: 'p11', dorsal: 17, name: 'Dani Olmo',      position: 'MED' },
  { id: 'p12', dorsal: 26, name: 'Marc Casadó',    position: 'MED' },
  { id: 'p13', dorsal: 19, name: 'Lamine Yamal',   position: 'DEL' },
  { id: 'p14', dorsal: 9,  name: 'Lewandowski',    position: 'DEL' },
  { id: 'p15', dorsal: 11, name: 'Raphinha',       position: 'DEL' },
  { id: 'p16', dorsal: 10, name: 'Ansu Fati',      position: 'DEL' },
  { id: 'p17', dorsal: 29, name: 'Pau Víctor',     position: 'DEL' },
  { id: 'p18', dorsal: 7,  name: 'Ferran Torres',  position: 'DEL' },
];

// TODO: leer de League.minConvocados / maxConvocados
const MIN_CONVOCADOS = 14;
const MAX_CONVOCADOS = 18;

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

// Color de acento por posición
const POSITION_COLOR: Record<SquadPlayer['position'], string> = {
  POR: Colors.semantic.warning,
  DEF: Colors.brand.secondary,
  MED: Colors.brand.primary,
  DEL: Colors.semantic.error,
};

// ---------------------------------------------------------------------------
// Sub-componente: fila de jugador seleccionable
// ---------------------------------------------------------------------------

function PlayerRow({
  player,
  selected,
  blocked,
  onToggle,
}: {
  player: SquadPlayer;
  selected: boolean;
  /** true cuando se alcanzó el máximo y este jugador no está seleccionado */
  blocked: boolean;
  onToggle: () => void;
}) {
  const posColor = POSITION_COLOR[player.position];

  return (
    <TouchableOpacity
      onPress={onToggle}
      disabled={blocked}
      activeOpacity={0.65}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: selected ? Colors.bg.surface1 : 'transparent',
        borderRadius: theme.borderRadius.lg,
        paddingHorizontal: 14,
        paddingVertical: 11,
        marginBottom: 4,
        borderWidth: 1,
        // borde activo/inactivo con alpha dinámico
        borderColor: selected ? Colors.brand.primary + '40' : 'transparent',
        opacity: blocked ? 0.38 : 1,
      }}
    >
      {/* Dorsal */}
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: Colors.bg.surface2,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Text style={{ color: Colors.text.secondary, fontSize: 11, fontWeight: '700' }}>
          {player.dorsal}
        </Text>
      </View>

      {/* Nombre */}
      <Text style={{ color: Colors.text.primary, fontSize: 15, fontWeight: '500', flex: 1 }}>
        {player.name}
      </Text>

      {/* Badge posición */}
      <View
        style={{
          backgroundColor: posColor + '18',
          borderRadius: 999,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderWidth: 1,
          borderColor: posColor + '40',
          marginRight: 12,
        }}
      >
        <Text style={{ color: posColor, fontSize: 10, fontWeight: '700' }}>
          {player.position}
        </Text>
      </View>

      {/* Check circular */}
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 2,
          borderColor: selected ? Colors.brand.primary : Colors.bg.surface2,
          backgroundColor: selected ? Colors.brand.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected && (
          <Ionicons name="checkmark" size={13} color={Colors.bg.base} />
        )}
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Sub-componente: cabecera de grupo de posición
// ---------------------------------------------------------------------------

function PositionGroupHeader({
  position,
  count,
}: {
  position: SquadPlayer['position'];
  count: number;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
        marginBottom: 8,
      }}
    >
      <View
        style={{
          width: 3,
          height: 13,
          borderRadius: 2,
          backgroundColor: POSITION_COLOR[position],
        }}
      />
      <Text
        style={{
          color: Colors.text.secondary,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.8,
        }}
      >
        {POSITION_GROUP_LABEL[position].toUpperCase()}
      </Text>
      <Text style={{ color: Colors.text.disabled, fontSize: 11 }}>{count}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function ProgrammedMatchConvocationScreen() {
  const router = useRouter();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');

  const count = selected.size;
  const atMax = count >= MAX_CONVOCADOS;
  const canSave = count >= MIN_CONVOCADOS;
  // progreso 0–1 sobre el máximo
  const progress = Math.min(count / MAX_CONVOCADOS, 1);

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_CONVOCADOS) {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = () => {
    // TODO: POST /matches/:id/convocation { playerIds: Array.from(selected) }
    router.back();
  };

  // Filtra por búsqueda y agrupa por posición
  const filteredSquad = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_SQUAD;
    return MOCK_SQUAD.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        String(p.dorsal).includes(q),
    );
  }, [query]);

  const groups = POSITION_ORDER.map(pos => ({
    position: pos,
    players: filteredSquad.filter(p => p.position === pos),
  })).filter(g => g.players.length > 0);

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
            Convocatoria
          </Text>
          {/* TODO: nombre real del partido */}
          <Text style={{ color: Colors.text.secondary, fontSize: 12, marginTop: 1 }}>
            FC Barcelona · Partido programado
          </Text>
        </View>
      </View>

      {/* ── Banner de progreso ── */}
      <View
        style={{
          marginHorizontal: 16,
          marginTop: 14,
          backgroundColor: Colors.bg.surface1,
          borderRadius: theme.borderRadius.xl,
          padding: 14,
        }}
      >
        {/* Fila: etiqueta + contador */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <Text style={{ color: Colors.text.secondary, fontSize: 13 }}>
            Seleccionados
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '700',
              // warning si no alcanza el mínimo, brand si sí
              color: canSave ? Colors.brand.primary : Colors.semantic.warning,
            }}
          >
            {count} / {MAX_CONVOCADOS}
          </Text>
        </View>

        {/* Barra de progreso */}
        <View
          style={{
            height: 3,
            backgroundColor: Colors.bg.surface2,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              height: 3,
              // width como porcentaje dinámico — no expresable con Tailwind
              width: `${progress * 100}%`,
              backgroundColor: canSave ? Colors.brand.primary : Colors.semantic.warning,
              borderRadius: 2,
            }}
          />
        </View>

        {/* Aviso de mínimo solo si todavía no se cumple */}
        {!canSave && (
          <Text style={{ color: Colors.text.disabled, fontSize: 11, marginTop: 7 }}>
            Mínimo {MIN_CONVOCADOS} convocados requeridos
          </Text>
        )}
      </View>

      {/* ── Buscador ── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: 16,
          marginTop: 12,
          backgroundColor: Colors.bg.surface1,
          borderRadius: theme.borderRadius.xl,
          paddingHorizontal: 12,
          paddingVertical: 10,
          gap: 8,
          borderWidth: 1,
          borderColor: query.length > 0 ? Colors.brand.primary + '44' : 'transparent',
        }}
      >
        <Ionicons name="search" size={16} color={Colors.text.disabled} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar jugador..."
          placeholderTextColor={Colors.text.disabled}
          style={{ flex: 1, color: Colors.text.primary, fontSize: 14, padding: 0 }}
          returnKeyType="search"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Ionicons name="close-circle" size={16} color={Colors.text.disabled} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Lista agrupada por posición ── */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {groups.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 48 }}>
            <Ionicons name="search-outline" size={32} color={Colors.text.disabled} />
            <Text style={{ color: Colors.text.disabled, fontSize: 14, marginTop: 10 }}>
              Sin resultados para "{query}"
            </Text>
          </View>
        ) : (
          groups.map(({ position, players }) => (
            <View key={position}>
              <PositionGroupHeader position={position} count={players.length} />
              {players.map(player => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  selected={selected.has(player.id)}
                  blocked={atMax && !selected.has(player.id)}
                  onToggle={() => toggle(player.id)}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* ── Botón fijo inferior ── */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 16,
          paddingVertical: 16,
          backgroundColor: Colors.bg.base,
          borderTopWidth: 1,
          borderTopColor: Colors.bg.surface2,
        }}
      >
        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.8}
          style={{
            backgroundColor: canSave ? Colors.brand.primary : Colors.bg.surface2,
            borderRadius: theme.borderRadius.full,
            paddingVertical: 14,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: canSave ? Colors.bg.base : Colors.text.disabled,
              fontSize: 15,
              fontWeight: '700',
            }}
          >
            Guardar convocatoria
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
