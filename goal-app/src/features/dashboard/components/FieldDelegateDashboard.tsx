/**
 * FieldDelegateDashboard.tsx
 *
 * Dashboard para el rol `field_delegate` (delegado de campo).
 *
 * DIFERENCIAS CON ADMIN:
 * - No ve métricas de liga ni tarjetas de progreso
 * - En partidos en vivo: puede registrar eventos y finalizar (igual que admin)
 *   pero NO gestiona convocatorias ni edita el partido
 * - En próximos: solo puede iniciar el partido (canStartMatch = true)
 *   pero sin convocatoria ni edición (canManageSquad = false, canEditMatch = false)
 *
 * El field_delegate es el "árbitro/delegado" que controla el partido en campo.
 * Tiene acceso operativo al partido pero no a la gestión administrativa de la liga.
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

interface FieldDelegateDashboardProps {
  leagueName: string;
  leagueId: string;
  userName: string;
  notificationCount?: number;
}

export function FieldDelegateDashboard({
  leagueName,
  leagueId,
  userName,
  notificationCount = 0,
}: FieldDelegateDashboardProps) {
  const { data, isLoading, isError, refetch } = useDashboardData(leagueId);
  const permissions = getDashboardPermissions('field_delegate');

  const handleRegisterEvent = (matchId: string) => {
    // TODO: abrir modal de registro de evento
    console.log('[FieldDelegate] Registrar evento:', matchId);
  };

  const handleEndMatch = (matchId: string) => {
    // TODO: abrir flujo de finalización
    console.log('[FieldDelegate] Finalizar partido:', matchId);
  };

  const handleStartMatch = (matchId: string) => {
    // TODO: confirmar inicio del partido
    console.log('[FieldDelegate] Iniciar partido:', matchId);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F13' }} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F13" />

      <WelcomeBlock
        userName={userName}
        leagueName={leagueName}
        role="field_delegate"
        notificationCount={notificationCount}
      />

      {isLoading && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="football-outline" size={32} color="#52525B" />
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
          {/* El field_delegate tiene acceso operativo completo al partido en vivo */}
          {data.liveMatch && (
            <View style={{ marginTop: 16 }}>
              <LiveMatchCard
                match={data.liveMatch}
                permissions={permissions}
                onRegisterEvent={handleRegisterEvent}
                onEndMatch={handleEndMatch}
              />
            </View>
          )}

          {/* Próximos: solo puede iniciar, sin convocatoria ni edición */}
          <UpcomingMatchesSection
            matches={data.upcomingMatches}
            permissions={permissions}
            onStartMatch={handleStartMatch}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}