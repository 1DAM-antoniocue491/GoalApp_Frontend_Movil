/**
 * DashboardScreen - Pantalla principal del dashboard
 *
 * Renderiza contenido distinto segun el rol del usuario en la liga activa:
 * - admin: AdminDashboard (acceso completo)
 * - coach: CoachDashboard (gestion de equipo)
 * - player: PlayerDashboard (vista personal)
 * - field_delegate: FieldDelegateDashboard (gestion de campo)
 *
 * Requisitos:
 * - El usuario debe haber seleccionado una liga en onboarding
 * - El rol se obtiene del activeLeagueStore
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useActiveLeague } from '@/src/state/activeLeague/activeLeagueStore';
import {
  AdminDashboard,
  CoachDashboard,
  PlayerDashboard,
  FieldDelegateDashboard,
} from '@/src/features/dashboard/components';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const { session, hasActiveLeague } = useActiveLeague();

  // Si no hay liga activa, mostrar mensaje
  if (!hasActiveLeague() || !session) {
    return (
      <SafeAreaView className='flex-1'>
      <View className="flex-1 bg-[#0F0F13] items-center justify-center px-6">
        <Ionicons name="warning-outline" size={48} color="#525258" />
        <Text className="text-white font-bold text-lg mt-4 text-center">
          No hay liga activa
        </Text>
        <Text className="text-[#8A9AA4] text-sm mt-2 text-center">
          Debes seleccionar una liga desde el onboarding
        </Text>
      </View>
      </SafeAreaView>
    );
  }

  // Renderizar dashboard segun el rol
  switch (session.role) {
    case 'admin':
      return <AdminDashboard leagueName={session.leagueName} />;

    case 'coach':
      return <CoachDashboard leagueName={session.leagueName} />;

    case 'player':
      return <PlayerDashboard leagueName={session.leagueName} />;

    case 'field_delegate':
      return <FieldDelegateDashboard leagueName={session.leagueName} />;

    default:
      return null;
  }
}