/**
 * CoachDashboard.tsx
 *
 * Dashboard para el rol `coach` (entrenador).
 *
 * DIFERENCIAS CON ADMIN:
 * - No ve las métricas generales de la liga (canViewLeagueMetrics = false)
 * - No ve las tarjetas de progreso (canViewProgressMetrics = false)
 * - En partidos en vivo: solo puede ver plantillas (canRegisterEvent = false)
 * - En próximos: puede gestionar convocatoria pero NO iniciar (canStartMatch = false)
 *   → Nota: canManageSquad = true, pero el botón de convocatoria se implementa
 *     en la feature Matches cuando esté lista.
 *
 * DATOS:
 * Usa el mismo hook `useDashboardData` que el admin.
 * En el futuro, si el backend devuelve datos distintos por rol,
 * solo hay que actualizar el hook sin tocar este componente.
 *
 * EQUIPO DEL ENTRENADOR:
 * Se muestra el nombre del equipo en el WelcomeBlock (teamName).
 * Esto diferencia al coach del admin en la cabecera visual.
 */

import React from 'react';
import { View, ScrollView, Text, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useDashboardData } from '@/src/shared/hooks/usedashboarddata';
import { getDashboardPermissions } from '../services/dashboardService';
import { WelcomeBlock } from './WelcomeBlock';
import { LiveMatchCard } from './LiveMatchCard';
import { UpcomingMatchesSection } from './UpcomingMatchesSection';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CoachDashboardProps {
  leagueName: string;
  leagueId: string;
  userName: string;
  teamName?: string;
  notificationCount?: number;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function CoachDashboard({
  leagueName,
  leagueId,
  userName,
  teamName,
  notificationCount = 0,
}: CoachDashboardProps) {
  const { data, isLoading, isError, refetch } = useDashboardData(leagueId);
  // Permisos del rol coach — distintos a admin
  const permissions = getDashboardPermissions('coach');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F13' }} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F13" />

      {/* WelcomeBlock incluye el equipo en el subtítulo si se pasa teamName */}
      <WelcomeBlock
        userName={userName}
        leagueName={teamName ? `${teamName} · ${leagueName}` : leagueName}
        role="coach"
        notificationCount={notificationCount}
      />

      {isLoading && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="football-outline" size={32} color="#52525B" />
          <Text style={{ color: '#52525B', marginTop: 8 }}>Cargando...</Text>
        </View>
      )}

      {isError && !isLoading && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <TouchableOpacity onPress={refetch}>
            <Text style={{ color: '#C4F135' }}>Error — pulsa para reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {data && !isLoading && !isError && (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Partido en vivo: el coach solo puede ver plantillas */}
          {data.liveMatch && (
            <View style={{ marginTop: 16 }}>
              <LiveMatchCard
                match={data.liveMatch}
                permissions={permissions}
              // onRegisterEvent y onEndMatch no se pasan: coach no los usa
              />
            </View>
          )}

          {/* Próximos: el coach puede gestionar convocatoria pero no iniciar */}
          <UpcomingMatchesSection
            matches={data.upcomingMatches}
            permissions={permissions}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}