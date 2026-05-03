/**
 * DashboardHeader - Cabecera principal del dashboard de liga
 *
 * Solo se usa en el dashboard, NUNCA en el onboarding.
 * Motivo: el dashboard es el contexto de una liga activa; el encabezado
 * debe reflejar esa liga y dar acceso operativo (notificaciones, cambio de liga).
 * El onboarding no tiene liga activa todavía, por lo que no necesita este
 * header ni acceso a notificaciones.
 *
 * Estructura:
 *   Izquierda → logo + nombre de liga + "Cambiar liga" (navega al onboarding)
 *   Derecha   → campana de notificaciones (navega a /notifications)
 */
import React from 'react';
import { View, Image, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { routes } from '@/src/shared/config/routes';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';

interface DashboardHeaderProps {
  leagueName: string;
  /** Si > 0 muestra punto indicador sobre la campana */
  notificationCount?: number;
}

export function DashboardHeader({ leagueName, notificationCount = 0 }: DashboardHeaderProps) {
  const router = useRouter();

  /**
   * "Cambiar liga" navega al onboarding.
   * El onboarding es el punto de entrada al ecosistema de ligas:
   * permite cambiar de liga, crear una nueva o unirse a otra.
   */
  const handleChangeLeague = () => {
    router.push(routes.private.onboarding as never);
  };

  /**
   * Abre la pantalla de notificaciones de la liga activa.
   * Las notificaciones son contextuales a la liga: solo tienen sentido
   * dentro del dashboard, nunca en el onboarding.
   */
  const handleNotificationsPress = () => {
    router.push(routes.private.notifications as never);
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.sm,
        paddingBottom: theme.spacing.sm,
      }}
    >
      {/* ── Izquierda: logo + contexto de liga activa ── */}
      <TouchableOpacity
        onPress={handleChangeLeague}
        activeOpacity={0.75}
        style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, flex: 1 }}
        hitSlop={{ top: 8, bottom: 8, right: 16, left: 0 }}
        accessibilityLabel={`Liga activa: ${leagueName}. Tocar para cambiar de liga`}
        accessibilityRole="button"
      >
        {/* Logo circular de GoalApp */}
        <View
          style={{
            height: 36,
            width: 36,
            borderRadius: 18,
            backgroundColor: Colors.brand.primary,
            alignItems: 'center',
            justifyContent: 'center',
            // Borde sutil que separa el logo del fondo oscuro
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.12)',
          }}
        >
          <Image
            source={require('../../../../assets/images/logo.png')}
            style={{ height: 28, width: 28, borderRadius: 14 }}
            resizeMode="cover"
          />
        </View>

        {/* Nombre de liga + etiqueta interactiva "Cambiar liga" */}
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{
              color: Colors.text.primary,
              fontSize: theme.fontSize.sm,
              fontWeight: '700',
              letterSpacing: 0.1,
            }}
          >
            {leagueName}
          </Text>

          {/* Icono de swap + texto: aclara que el bloque es interactivo */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
            <Ionicons name="swap-horizontal-outline" size={11} color={Colors.brand.primary} />
            <Text
              style={{
                color: Colors.brand.primary,
                fontSize: theme.fontSize.xs,
                fontWeight: '600',
                letterSpacing: 0.2,
              }}
            >
              Cambiar liga
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* ── Derecha: campana de notificaciones ── */}
      <TouchableOpacity
        onPress={handleNotificationsPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={{ padding: theme.spacing.sm, position: 'relative' }}
        accessibilityLabel="Notificaciones"
        accessibilityRole="button"
      >
        <Ionicons name="notifications-outline" size={24} color={Colors.text.secondary} />

        {/* Punto verde si hay notificaciones no leídas */}
        {notificationCount > 0 && (
          <View
            style={{
              position: 'absolute',
              top: theme.spacing.sm - 2,
              right: theme.spacing.sm - 2,
              width: 8,
              height: 8,
              borderRadius: 999,
              backgroundColor: Colors.semantic.success,
              // Borde oscuro para separar el punto del icono
              borderWidth: 1.5,
              borderColor: Colors.bg.base,
            }}
          />
        )}
      </TouchableOpacity>
    </View>
  );
}
