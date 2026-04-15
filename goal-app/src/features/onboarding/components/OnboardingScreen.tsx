/**
 * OnboardingScreen - Pantalla de listado de ligas
 * Primera pantalla después del login/registro.
 *
 * Muestra:
 * - Header con logo y notificaciones
 * - Bienvenida al usuario
 * - Acciones rápidas (crear/unirse a liga)
 * - Sección "Mis ligas" con buscador, filtros y listado
 * - Estrella de favoritos interactiva por cada liga
 *
 * Flujo:
 * - Usuario toca estrella → se pone amarilla → liga se marca como favorita
 * - Usuario toca "Entrar" → se guarda liga activa + rol → se navega a (tabs)
 */

import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { routes } from '@/src/shared/config/routes';

import { AppHeader } from '@/src/shared/components/layout/AppHeader';
import { QuickActionCard } from '@/src/features/onboarding/components/QuickActionCard';
import { LeagueFilterTabs } from '@/src/features/leagues/components/LeagueFilterTabs';
import { LeagueCard } from '@/src/features/leagues/components/LeagueCard';
import { EmptyLeaguesState } from '@/src/features/leagues/components/EmptyLeaguesState';
import { LeaguesSkeleton } from '@/src/features/leagues/components/LeaguesSkeleton';

import { LeagueItem, LeagueFilter } from '@/src/shared/types/league';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAllLeagues, toggleFavoriteLeague, isLeagueFavorite } from '@/src/features/leagues/services/leagueService';
import { mockUsers } from '@/src/mocks/data';
import type { User } from '@/src/shared/types/user';
import { activeLeagueStore } from '@/src/state/activeLeague/activeLeagueStore';

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Estado de carga simulado
  const [isLoading, setIsLoading] = useState(true);

  // Usuario mock actual (en producción vendría del contexto de auth)
  const [currentUser] = useState<User>(mockUsers[0]);

  // Estado para las ligas
  const [leagues, setLeagues] = useState<LeagueItem[]>([]);

  // Estado para filtros y búsqueda
  const [selectedFilter, setSelectedFilter] = useState<LeagueFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar ligas al montar
  useEffect(() => {
    const timer = setTimeout(() => {
      setLeagues(getAllLeagues());
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Filtrar ligas con useMemo para optimizar rendimiento
  const filteredLeagues = useMemo(() => {
    let result = leagues;

    // Aplicar filtro
    if (selectedFilter === 'active') {
      result = result.filter((l) => l.status === 'active');
    } else if (selectedFilter === 'finished') {
      result = result.filter((l) => l.status === 'finished');
    } else if (selectedFilter === 'favorites') {
      result = result.filter((l) => isLeagueFavorite(currentUser, l.id));
    }

    // Aplicar búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((l) =>
        l.name.toLowerCase().includes(term) ||
        l.season.toLowerCase().includes(term)
      );
    }

    return result;
  }, [leagues, selectedFilter, searchTerm, currentUser]);

  /**
   * Manejar toggle de favorito
   */
  const handleToggleFavorite = (leagueId: string) => {
    // Actualizar estado localmente
    setLeagues((prev) =>
      prev.map((league) =>
        league.id === leagueId
          ? { ...league, isFavorite: !league.isFavorite }
          : league
      )
    );
  };

  /**
   * Manejar presión en botón "Entrar" de una liga
   */
  const handleEnterLeague = (league: LeagueItem) => {
    // Guardar la liga activa y el rol del usuario en esa liga
    activeLeagueStore.setSession({
      leagueId: league.id,
      leagueName: league.name,
      role: league.role,
    });

    // Navegar a los tabs (dashboard principal)
    router.push(routes.private.dashboard);
  };

  /**
   * Manejar presión en el logo del header
   */
  const handleLogoPress = () => {
    // En onboarding, el logo puede refrescar o hacer scroll al top
    // Por ahora, no hace nada especial ya que estamos en la pantalla base
  };

  return (
    <View className="flex-1 bg-[#0F0F13]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pb-6">
          {/* 1. Header superior */}
          <AppHeader onNotificationPress={() => console.log('Notifications')} />

          {/* 2. Bloque de bienvenida */}
          <View className="mt-4 mb-6">
            <Text className="text-white font-bold text-2xl">
              Hola, {currentUser.name.split(' ')[0]}
            </Text>
            <Text className="text-[#8A9AA4] text-sm mt-1">
              Selecciona una liga para comenzar
            </Text>
          </View>

          {/* 3. Acciones principales */}
          <View className="gap-4 mb-6">
            <QuickActionCard
              iconName="add"
              iconColor="#C4F135"
              title="Crear nueva liga"
              description="Configura tu competición y empieza a gestionarla"
              ctaText="Crear liga"
              onPress={() => Alert.alert('Crear liga', 'Funcionalidad próximamente')}
            />
            <QuickActionCard
              iconName="link"
              iconColor="#18A2FB"
              title="Unirme a una liga"
              description="Únete con un código de invitación y accede al instante"
              ctaText="Unirme"
              onPress={() => Alert.alert('Unirme', 'Funcionalidad próximamente')}
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
                <View className="gap-4 mt-4">
                  {filteredLeagues.map((league) => (
                    <LeagueCard
                      key={league.id}
                      league={league}
                      isFavorite={isLeagueFavorite(currentUser, league.id)}
                      onToggleFavorite={() => handleToggleFavorite(league.id)}
                      onPress={() => handleEnterLeague(league)}
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
        </View>
      </ScrollView>
    </View>
  );
}