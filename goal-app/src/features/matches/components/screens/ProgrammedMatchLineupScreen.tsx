/**
 * ProgrammedMatchLineupScreen
 *
 * Selección de titulares y suplentes a partir de los convocados.
 * Máximo 11 titulares. Suplentes son el resto de convocados disponibles.
 *
 * TODO:
 * - Recibir convocados desde GET /matches/:id/convocation
 * - Enviar via POST /matches/:id/lineup { titulares, suplentes }
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

interface ConvocadoPlayer {
  id: string;
  dorsal: number;
  name: string;
  position: 'POR' | 'DEF' | 'MED' | 'DEL';
}

// TODO: reemplazar por GET /matches/:id/convocation
const MOCK_CONVOCADOS: ConvocadoPlayer[] = [
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

const MAX_TITULARES = 11;

// ---------------------------------------------------------------------------
// Constantes de posición
// ---------------------------------------------------------------------------

const POSITION_ORDER: ConvocadoPlayer['position'][] = ['POR', 'DEF', 'MED', 'DEL'];

const POSITION_GROUP_LABEL: Record<ConvocadoPlayer['position'], string> = {
  POR: 'Porteros',
  DEF: 'Defensas',
  MED: 'Centrocampistas',
  DEL: 'Delanteros',
};

const POSITION_COLOR: Record<ConvocadoPlayer['position'], string> = {
  POR: Colors.semantic.warning,
  DEF: Colors.brand.secondary,
  MED: Colors.brand.primary,
  DEL: Colors.semantic.error,
};

// ---------------------------------------------------------------------------
// Tipos de la lógica
// ---------------------------------------------------------------------------

type Tab = 'titulares' | 'suplentes' | 'disponibles';
type PlayerRole = 'titular' | 'suplente' | 'none';

// ---------------------------------------------------------------------------
// Sub-componente: cabecera de grupo de posición
// ---------------------------------------------------------------------------

function PositionGroupHeader({
  position,
  count,
}: {
  position: ConvocadoPlayer['position'];
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
// Sub-componente: fila de jugador con acciones según rol
// ---------------------------------------------------------------------------

function PlayerRow({
  player,
  role,
  canBecomeTitular,
  onSetTitular,
  onSetSuplente,
  onRemove,
}: {
  player: ConvocadoPlayer;
  role: PlayerRole;
  canBecomeTitular: boolean;
  onSetTitular: () => void;
  onSetSuplente: () => void;
  onRemove: () => void;
}) {
  const posColor = POSITION_COLOR[player.position];
  const isAssigned = role !== 'none';

  // Color del borde según rol asignado
  const borderColor =
    role === 'titular'
      ? Colors.brand.primary + '50'
      : role === 'suplente'
      ? Colors.brand.secondary + '50'
      : 'transparent';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.bg.surface1,
        borderRadius: theme.borderRadius.lg,
        paddingHorizontal: 14,
        paddingVertical: 11,
        marginBottom: 5,
        borderWidth: 1,
        borderColor,
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
          marginRight: 10,
        }}
      >
        <Text style={{ color: posColor, fontSize: 10, fontWeight: '700' }}>
          {player.position}
        </Text>
      </View>

      {/* Acciones: asignado → pill de estado + quitar | sin rol → botones T y S */}
      {isAssigned ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* Pill de rol activo */}
          <View
            style={{
              backgroundColor:
                role === 'titular'
                  ? Colors.brand.primary + '20'
                  : Colors.brand.secondary + '20',
              borderRadius: 999,
              paddingHorizontal: 9,
              paddingVertical: 3,
            }}
          >
            <Text
              style={{
                color: role === 'titular' ? Colors.brand.primary : Colors.brand.secondary,
                fontSize: 11,
                fontWeight: '700',
              }}
            >
              {role === 'titular' ? 'Titular' : 'Suplente'}
            </Text>
          </View>

          {/* Quitar */}
          <TouchableOpacity
            onPress={onRemove}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: Colors.bg.surface2,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="close" size={12} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {/* Botón Titular */}
          <TouchableOpacity
            onPress={onSetTitular}
            disabled={!canBecomeTitular}
            style={{
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 5,
              backgroundColor: canBecomeTitular
                ? Colors.brand.primary + '20'
                : Colors.bg.surface2,
              borderWidth: 1,
              borderColor: canBecomeTitular
                ? Colors.brand.primary + '50'
                : 'transparent',
            }}
          >
            <Text
              style={{
                color: canBecomeTitular ? Colors.brand.primary : Colors.text.disabled,
                fontSize: 11,
                fontWeight: '700',
              }}
            >
              Titular
            </Text>
          </TouchableOpacity>

          {/* Botón Suplente */}
          <TouchableOpacity
            onPress={onSetSuplente}
            style={{
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 5,
              backgroundColor: Colors.bg.surface2,
            }}
          >
            <Text style={{ color: Colors.text.secondary, fontSize: 11, fontWeight: '700' }}>
              Suplente
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function ProgrammedMatchLineupScreen() {
  const router = useRouter();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();

  const [titulares, setTitulares] = useState<Set<string>>(new Set());
  const [suplentes, setSuplentes] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<Tab>('disponibles');
  const [query, setQuery] = useState('');

  const titularCount = titulares.size;
  const suplenteCount = suplentes.size;
  const canSave = titularCount === MAX_TITULARES;

  const setTitular = (id: string) => {
    if (titulares.size >= MAX_TITULARES) return;
    setTitulares(prev => new Set([...prev, id]));
    setSuplentes(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const setSuplente = (id: string) => {
    setSuplentes(prev => new Set([...prev, id]));
    setTitulares(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const removeRole = (id: string) => {
    setTitulares(prev => { const n = new Set(prev); n.delete(id); return n; });
    setSuplentes(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const getRole = (id: string): PlayerRole => {
    if (titulares.has(id)) return 'titular';
    if (suplentes.has(id)) return 'suplente';
    return 'none';
  };

  const handleSave = () => {
    // TODO: POST /matches/:id/lineup { titulares: [...titulares], suplentes: [...suplentes] }
    router.back();
  };

  // Filtra por tab y por query
  const visiblePlayers = useMemo(() => {
    let pool: ConvocadoPlayer[];
    if (activeTab === 'titulares')  pool = MOCK_CONVOCADOS.filter(p => titulares.has(p.id));
    else if (activeTab === 'suplentes') pool = MOCK_CONVOCADOS.filter(p => suplentes.has(p.id));
    else pool = MOCK_CONVOCADOS.filter(p => !titulares.has(p.id) && !suplentes.has(p.id));

    const q = query.trim().toLowerCase();
    if (!q) return pool;
    return pool.filter(p => p.name.toLowerCase().includes(q) || String(p.dorsal).includes(q));
  }, [activeTab, titulares, suplentes, query]);

  // Agrupa por posición, omitiendo grupos vacíos
  const groups = POSITION_ORDER.map(pos => ({
    position: pos,
    players: visiblePlayers.filter(p => p.position === pos),
  })).filter(g => g.players.length > 0);

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'titulares',  label: 'Titulares',  count: titularCount },
    { key: 'suplentes',  label: 'Suplentes',  count: suplenteCount },
    { key: 'disponibles', label: 'Disponibles' },
  ];

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
            Alineación titular
          </Text>
          <Text style={{ color: Colors.text.secondary, fontSize: 12, marginTop: 1 }}>
            Selecciona 11 jugadores para el once inicial
          </Text>
        </View>
      </View>

      {/* ── Barra de contadores ── */}
      <View
        style={{
          flexDirection: 'row',
          gap: 10,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: Colors.bg.surface2,
        }}
      >
        {/* Titulares */}
        <View
          style={{
            flex: 1,
            backgroundColor: Colors.bg.surface1,
            borderRadius: theme.borderRadius.lg,
            padding: 10,
            alignItems: 'center',
            borderWidth: 1,
            borderColor:
              canSave
                ? Colors.brand.primary + '50'
                : titularCount > 0
                ? Colors.brand.primary + '25'
                : 'transparent',
          }}
        >
          <Text
            style={{
              color: canSave ? Colors.brand.primary : Colors.text.primary,
              fontSize: 20,
              fontWeight: '800',
              lineHeight: 24,
            }}
          >
            {titularCount}
            <Text style={{ fontSize: 14, fontWeight: '400', color: Colors.text.disabled }}>
              /{MAX_TITULARES}
            </Text>
          </Text>
          <Text style={{ color: Colors.text.secondary, fontSize: 11, marginTop: 2 }}>
            Titulares
          </Text>
        </View>

        {/* Suplentes */}
        <View
          style={{
            flex: 1,
            backgroundColor: Colors.bg.surface1,
            borderRadius: theme.borderRadius.lg,
            padding: 10,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: suplenteCount > 0 ? Colors.brand.secondary : Colors.text.disabled,
              fontSize: 20,
              fontWeight: '800',
              lineHeight: 24,
            }}
          >
            {suplenteCount}
          </Text>
          <Text style={{ color: Colors.text.secondary, fontSize: 11, marginTop: 2 }}>
            Suplentes
          </Text>
        </View>

        {/* Disponibles */}
        <View
          style={{
            flex: 1,
            backgroundColor: Colors.bg.surface1,
            borderRadius: theme.borderRadius.lg,
            padding: 10,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: Colors.text.secondary,
              fontSize: 20,
              fontWeight: '800',
              lineHeight: 24,
            }}
          >
            {MOCK_CONVOCADOS.length - titularCount - suplenteCount}
          </Text>
          <Text style={{ color: Colors.text.secondary, fontSize: 11, marginTop: 2 }}>
            Disponibles
          </Text>
        </View>
      </View>

      {/* ── Tabs ── */}
      <View
        style={{
          flexDirection: 'row',
          marginHorizontal: 16,
          marginTop: 12,
          backgroundColor: Colors.bg.surface1,
          borderRadius: theme.borderRadius.xl,
          padding: 4,
        }}
      >
        {TABS.map(({ key, label, count }) => {
          const isActive = activeTab === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setActiveTab(key)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: theme.borderRadius.lg,
                alignItems: 'center',
                backgroundColor: isActive ? Colors.brand.primary : 'transparent',
              }}
            >
              <Text
                style={{
                  color: isActive ? Colors.bg.base : Colors.text.secondary,
                  fontSize: 12,
                  fontWeight: '700',
                }}
              >
                {label}
                {count !== undefined && count > 0 ? ` ${count}` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Buscador ── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: 16,
          marginTop: 10,
          backgroundColor: Colors.bg.surface1,
          borderRadius: theme.borderRadius.xl,
          paddingHorizontal: 12,
          paddingVertical: 9,
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
          <TouchableOpacity
            onPress={() => setQuery('')}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
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
            <Ionicons
              name={query.length > 0 ? 'search-outline' : 'people-outline'}
              size={32}
              color={Colors.text.disabled}
            />
            <Text style={{ color: Colors.text.disabled, fontSize: 14, marginTop: 10 }}>
              {query.length > 0
                ? `Sin resultados para "${query}"`
                : activeTab === 'titulares'
                ? 'Aún no has añadido titulares'
                : activeTab === 'suplentes'
                ? 'Aún no has añadido suplentes'
                : 'Todos los jugadores están asignados'}
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
                  role={getRole(player.id)}
                  canBecomeTitular={titularCount < MAX_TITULARES}
                  onSetTitular={() => setTitular(player.id)}
                  onSetSuplente={() => setSuplente(player.id)}
                  onRemove={() => removeRole(player.id)}
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
            Guardar alineación
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
