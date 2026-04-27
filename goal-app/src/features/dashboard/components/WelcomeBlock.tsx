/**
 * WelcomeBlock.tsx
 *
 * Bloque superior del dashboard. Compuesto por dos secciones:
 *
 * 1. DashboardHeader (logo + liga activa + "Cambiar liga" + notificaciones)
 *    — el header contextual que identifica la liga y da acceso operativo.
 *
 * 2. Saludo al usuario + rol
 *    — presentación personal dentro del contexto de esa liga.
 *
 * POR QUÉ `style` EN VEZ DE `className` AQUÍ:
 * - Los valores numéricos exactos (fontSize, lineHeight, letterSpacing)
 *   no tienen equivalente en las clases de NativeWind disponibles.
 * - Regla del proyecto: preferir `style` cuando la precisión importa.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';

import { DashboardHeader } from '@/src/shared/components/layout/AppHeader';
import { getRoleLabel } from '../services/dashboardService';
import type { LeagueRole } from '@/src/shared/types/league';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WelcomeBlockProps {
  userName: string;
  leagueName: string;
  role: LeagueRole;
  /** Número de notificaciones no leídas. 0 oculta el indicador. */
  notificationCount?: number;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function WelcomeBlock({
  userName,
  leagueName,
  role,
  notificationCount = 0,
}: WelcomeBlockProps) {
  // Animación sutil de entrada — el saludo sube desde +8px con fade
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View>
      {/*
        DashboardHeader gestiona logo, liga activa, "Cambiar liga" y notificaciones.
        La navegación de vuelta al onboarding y a notificaciones ocurre dentro
        del propio DashboardHeader — este bloque no necesita conocerla.
      */}
      <DashboardHeader leagueName={leagueName} notificationCount={notificationCount} />

      {/* ── Saludo personal con animación de entrada ── */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          // Se usa `style` para padding exacto del design system (16px)
          paddingHorizontal: 16,
          paddingTop: 4,
          paddingBottom: 8,
        }}
      >

        {/* Rol del usuario en la liga actual */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
          {/* Punto verde de la marca como separador visual */}
          <View
            style={{
              width: 5,
              height: 5,
              borderRadius: 999,
              backgroundColor: '#C4F135',
              marginRight: 8,
            }}
          />
          <Text style={{ color: '#A1A1AA', fontSize: 14 }}>
            {/* getRoleLabel transforma 'field_delegate' → 'Delegado', etc. */}
            {getRoleLabel(role)}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}