/**
 * HomeScreen - Pantalla principal de GoalApp
 *
 * Muestra:
 * - Header con logo y notificaciones
 * - Bienvenida al usuario
 * - Acciones rápidas (crear/unirse a liga)
 * - Sección "Mis ligas" con buscador, filtros y listado
 * - Empty state cuando no hay ligas
 * - Skeleton loading mientras se cargan los datos
 */

import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppHeader } from '@/src/components/layout/AppHeader';
import { QuickActionCard } from '@/src/components/ui/QuickActionCard';
import { LeagueFilterTabs } from '@/src/components/ui/LeagueFilterTabs';
import { LeagueCard } from '@/src/components/ui/LeagueCard';
import { EmptyLeaguesState } from '@/src/components/feedback/EmptyLeaguesState';
import { LeaguesSkeleton } from '@/src/components/feedback/LeaguesSkeleton';

import { LeagueItem, LeagueFilter } from '@/src/types/league';
import { filterLeagues } from '@/src/utils/leagueFilters';

/**
 * Mock data temporal para probar la UI
 * Incluye varios casos: activa, finalizada con/sin permiso, favorita, sin escudo
 */
const MOCK_LEAGUES: LeagueItem[] = [
  {
    id: '1',
    name: 'Liga Provincial de Fútbol',
    season: '2025/26',
    status: 'active',
    role: 'admin',
    isFavorite: true,
    teamName: 'Real Betis',
    teamsCount: 12,
    crestUrl: null, // Para probar fallback
    canReactivate: false,
  },
  {
    id: '2',
    name: 'Copa Regional',
    season: '2025',
    status: 'finished',
    role: 'coach',
    isFavorite: false,
    teamName: 'Sevilla FC',
    teamsCount: 8,
    crestUrl: 'https://example.com/crest.png',
    canReactivate: true,
  },
  {
    id: '3',
    name: 'Torneo de Verano',
    season: '2025',
    status: 'finished',
    role: 'player',
    isFavorite: false,
    teamName: 'Local United',
    teamsCount: 6,
    crestUrl: null,
    canReactivate: false,
  },
  {
    id: '4',
    name: 'Liga Elite',
    season: '2025/26',
    status: 'active',
    role: 'field_delegate',
    isFavorite: true,
    teamName: 'Athletic Club',
    teamsCount: 10,
    crestUrl: 'https://example.com/elite.png',
    canReactivate: false,
  },
];

export default function HomeScreen() {
  // Estado de carga simulado
  const [isLoading, setIsLoading] = useState(true);

  // Estado para las ligas (en producción vendría de la API/store)
  const [leagues] = useState<LeagueItem[]>(MOCK_LEAGUES);

  // Estado para filtros y búsqueda
  const [selectedFilter, setSelectedFilter] = useState<LeagueFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar ligas con useMemo para optimizar rendimiento
  const filteredLeagues = useMemo(
    () => filterLeagues(leagues, selectedFilter, searchTerm),
    [leagues, selectedFilter, searchTerm]
  );

  // Simular carga inicial
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Manejar toggle de favorito
   * (En producción esto actualizaría la API/store)
   */
  const handleToggleFavorite = (leagueId: string) => {
    console.log('Toggle favorite for league:', leagueId);
    // Aquí iría la lógica real para actualizar el estado
  };

  /**
   * Manejar presión en botón de liga
   */
  const handleLeaguePress = (league: LeagueItem) => {
    console.log('Press league:', league.name);
    // Navegar a la pantalla de la liga o reactivar
  };

  return (
    <View className="flex-1 bg-[#0F0F13]">
      <ScrollView className="flex-1 px-4 pb-6">
        {/* 1. Header superior */}
        <AppHeader onNotificationPress={() => console.log('Notifications pressed')} />

        {/* 2. Bloque de bienvenida */}
        <View className="mt-2 mb-4">
          <Text className="text-white font-bold text-2xl">Hola, Miguel</Text>
          <Text className="text-[#8A9AA4] text-sm">Primer acceso</Text>
          <Text className="text-[#8A9AA4] text-sm mt-3">Elige cómo empezar</Text>
        </View>

        {/* 3. Acciones principales */}
        <View className="gap-4 mb-6">
          <QuickActionCard
            iconName="add"
            iconColor="#C4F135"
            title="Crear nueva liga"
            description="Configura tu competición y empieza a gestionarla"
            ctaText="Crear liga"
            onPress={() => console.log('Crear liga')}
          />
          <QuickActionCard
            iconName="link"
            iconColor="#18A2FB"
            title="Unirme a una liga"
            description="Únete con un código de invitación y accede al instante"
            ctaText="Unirme"
            onPress={() => console.log('Unirme a liga')}
          />
        </View>

        {/* 4. Sección "Mis ligas" */}
        {isLoading ? (
          // Estado loading: mostrar skeletons
          <>
            <Text className="text-white font-semibold text-lg mb-4">Mis ligas</Text>
            <LeaguesSkeleton count={2} />
          </>
        ) : leagues.length === 0 ? (
          // Estado vacío: mostrar empty state
          <EmptyLeaguesState />
        ) : (
          // Estado con datos: mostrar sección completa
          <>
            <Text className="text-white font-semibold text-lg mb-3">Mis ligas</Text>

            {/* Buscador */}
            <View className="flex-row items-center bg-[#1D1C22] rounded-xl px-4 h-12 mb-4 border border-[#2A2A35]">
              <Ionicons name="search" size={20} color="#525258" />
              <TextInput
                className="flex-1 text-white text-base ml-3"
                placeholder="Buscar liga..."
                placeholderTextColor="#525258"
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
              {searchTerm.length > 0 && (
                <TouchableOpacity onPress={() => setSearchTerm('')}>
                  <Ionicons name="close-circle" size={20} color="#525258" />
                </TouchableOpacity>
              )}
            </View>

            {/* Filtros */}
            <LeagueFilterTabs
              selectedFilter={selectedFilter}
              onSelectFilter={setSelectedFilter}
            />

            {/* Listado de ligas */}
            {filteredLeagues.length > 0 ? (
              <View className="gap-4">
                {filteredLeagues.map((league) => (
                  <LeagueCard
                    key={league.id}
                    league={league}
                    onPress={() => handleLeaguePress(league)}
                    onToggleFavorite={() => handleToggleFavorite(league.id)}
                  />
                ))}
              </View>
            ) : (
              // No hay resultados después de filtrar/buscar
              <View className="py-8 items-center">
                <Ionicons name="filter-outline" size={40} color="#525258" />
                <Text className="text-[#8A9AA4] text-sm mt-2 text-center">
                  No se encontraron ligas con los filtros actuales
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
