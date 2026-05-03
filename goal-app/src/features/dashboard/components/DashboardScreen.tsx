/**
 * DashboardScreen - Pantalla principal del dashboard
 *
 * Renderiza contenido distinto según el rol del usuario en la liga activa:
 * - admin: AdminDashboard
 * - coach: CoachDashboard
 * - player: PlayerDashboard
 * - field_delegate: FieldDelegateDashboard
 * - observer: ObserverDashboard
 *
 * Requisitos:
 * - El usuario debe haber seleccionado una liga en onboarding
 * - El rol se obtiene del activeLeagueStore
 *
 * Responsabilidad de este archivo:
 * - Decidir qué dashboard renderizar según el rol activo
 * - Mostrar un estado vacío si no hay liga activa
 * - Evitar estilos hardcodeados usando Colors y theme
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useActiveLeague } from '@/src/state/activeLeague/activeLeagueStore';
import { useUnreadCount } from '@/src/features/notifications/hooks/useNotifications';
import { AdminDashboard } from '@/src/features/dashboard/components/AdminDashboard';
import { CoachDashboard } from '@/src/features/dashboard/components/CoachDashboard';
import { PlayerDashboard } from '@/src/features/dashboard/components/PlayerDashboard';
import { FieldDelegateDashboard } from '@/src/features/dashboard/components/FieldDelegateDashboard';
import { ObserverDashboard } from '@/src/features/dashboard/components/ObserverDashboard';

import { routes } from '@/src/shared/config/routes';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';

/**
 * Estado reutilizable dentro de esta pantalla para cuando no hay liga activa
 * o cuando el rol activo no tiene dashboard asignado.
 *
 * No se extrae todavía a shared porque de momento solo se usa aquí.
 */
function DashboardFallbackState({
  iconName,
  title,
  description,
  ctaLabel,
  onPress,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  ctaLabel?: string;
  onPress?: () => void;
}) {
  return (
    <SafeAreaView
      edges={['top']}
      style={{
        flex: 1,
        backgroundColor: Colors.bg.base,
      }}
    >
      <View
        className="flex-1 items-center justify-center px-6"
        style={{
          backgroundColor: Colors.bg.base,
        }}
      >
        {/* 
          Usamos style para colores porque vienen del sistema Colors.
          El tamaño del icono es una medida exacta propia del empty state.
        */}
        <View
          className="items-center justify-center rounded-full"
          style={{
            width: 76,
            height: 76,
            borderRadius: 38,
            backgroundColor: Colors.bg.surface1,
            borderWidth: 1,
            borderColor: Colors.bg.surface2,
          }}
        >
          <Ionicons
            name={iconName}
            size={36}
            color={Colors.text.disabled}
          />
        </View>

        <Text
          className="text-center"
          style={{
            color: Colors.text.primary,
            fontSize: theme.fontSize.lg,
            lineHeight: 24,
            fontWeight: '700',
            marginTop: theme.spacing.lg,
          }}
        >
          {title}
        </Text>

        <Text
          className="text-center"
          style={{
            color: Colors.text.secondary,
            fontSize: theme.fontSize.sm,
            lineHeight: 20,
            marginTop: theme.spacing.sm,
            maxWidth: 280,
          }}
        >
          {description}
        </Text>

        {ctaLabel && onPress ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            className="flex-row items-center justify-center"
            style={{
              marginTop: theme.spacing.xl,
              height: 48,
              paddingHorizontal: theme.spacing.xl,
              borderRadius: 20,
              backgroundColor: Colors.brand.primary,
            }}
          >
            <Text
              style={{
                color: Colors.bg.base,
                fontSize: theme.fontSize.sm + 1,
                lineHeight: 18,
                fontWeight: '700',
              }}
            >
              {ctaLabel}
            </Text>

            <Ionicons
              name="arrow-forward"
              size={17}
              color={Colors.bg.base}
              style={{
                marginLeft: theme.spacing.sm,
              }}
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { session, hasActiveLeague } = useActiveLeague();
  // Badge real desde GET /notificaciones/no-leidas — se recarga al entrar al dashboard
  const unreadCount = useUnreadCount();

  /**
   * Si no existe una liga activa, no renderizamos ningún dashboard.
   * En su lugar mostramos un estado vacío claro y permitimos volver al onboarding.
   */
  if (!hasActiveLeague() || !session) {
    return (
      <DashboardFallbackState
        iconName="warning-outline"
        title="No has seleccionado ninguna liga"
        description="Vuelve al onboarding para elegir una liga y acceder a su dashboard."
        ctaLabel="Ir al onboarding"
        onPress={() => router.replace(routes.private.onboarding)}
      />
    );
  }

  /**
   * Render del dashboard según rol.
   * Cada dashboard ya gestiona su propio contenido interno.
   */
  switch (session.role) {
    case 'admin':
      return (
        <AdminDashboard
          leagueId={session.leagueId}
          leagueName={session.leagueName}
          userName={session.userName}
          notificationCount={unreadCount}
        />
      );

    case 'coach':
      return (
        <CoachDashboard
          leagueId={session.leagueId}
          leagueName={session.leagueName}
          userName={session.userName}
          teamName={session.teamName}
          notificationCount={unreadCount}
        />
      );

    case 'player':
      return (
        <PlayerDashboard
          leagueId={session.leagueId}
          leagueName={session.leagueName}
          userName={session.userName}
          teamName={session.teamName}
          notificationCount={unreadCount}
        />
      );

    case 'field_delegate':
      return (
        <FieldDelegateDashboard
          leagueId={session.leagueId}
          leagueName={session.leagueName}
          userName={session.userName}
          notificationCount={unreadCount}
        />
      );

    case 'observer':
      return (
        <ObserverDashboard
          leagueId={session.leagueId}
          leagueName={session.leagueName}
          userName={session.userName}
          notificationCount={unreadCount}
        />
      );

    /**
     * Evitamos devolver null en un rol desconocido.
     * Esto ayuda a detectar problemas de datos sin dejar pantalla en blanco.
     */
    default:
      return (
        <DashboardFallbackState
          iconName="alert-circle-outline"
          title="Rol no disponible"
          description="No se ha encontrado un dashboard compatible con tu rol actual en esta liga."
          ctaLabel="Volver al onboarding"
          onPress={() => router.replace(routes.private.onboarding)}
        />
      );
  }
}