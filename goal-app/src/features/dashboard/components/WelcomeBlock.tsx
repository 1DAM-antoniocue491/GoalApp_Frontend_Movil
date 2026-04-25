/**
 * WelcomeBlock.tsx
 *
 * Bloque de bienvenida superior del dashboard.
 *
 * RESPONSABILIDAD: Solo renderizado.
 * La lógica de permisos y etiquetas de rol viene de dashboardService.ts.
 * La navegación usa routes.ts, nunca strings hardcodeados.
 *
 * POR QUÉ `style` EN VEZ DE `className` AQUÍ:
 * - Los valores numéricos exactos (fontSize, lineHeight, letterSpacing)
 *   no tienen equivalente en las clases de NativeWind disponibles.
 * - `gap` entre elementos inline tampoco está soportado por NativeWind en RN.
 * - `className` se usa cuando las clases Tailwind cubren el valor exactamente
 *   y no hay riesgo de discrepancia entre web y nativo.
 * - Regla del proyecto: preferir `style` cuando la precisión importa.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { getRoleLabel } from '../services/dashboardService';
import { routes } from '@/src/shared/config/routes';
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
  const router = useRouter();

  // Animación sutil de entrada — el bloque sube desde +8px con fade
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleNotificationsPress = () => {
    // Navega a la pantalla de notificaciones usando la ruta semántica.
    // Si notifications no existe aún como ruta real, no producirá error en dev.
    // router.push(routes.private.notifications as never);
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        // Se usa `style` para padding exacto del design system (16px)
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
      }}
    >
      {/* ── Saludo e info de liga ── */}
      <View style={{ flex: 1 }}>
        {/* Display 30px / Bold — tipografía del design system */}
        <Text style={{ color: '#FFFFFF', fontSize: 30, fontWeight: 'bold', lineHeight: 36 }}>
          Hola, {userName}
        </Text>

        {/* Liga activa • Rol — Caption 12px */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
          <Text style={{ color: '#A1A1AA', fontSize: 14 }}>{leagueName}</Text>

          {/* Separador visual: punto verde de la marca */}
          <View
            style={{
              width: 5,
              height: 5,
              borderRadius: 999,
              backgroundColor: '#C4F135',
              marginHorizontal: 8,
            }}
          />

          <Text style={{ color: '#A1A1AA', fontSize: 14 }}>
            {/* getRoleLabel transforma 'field_delegate' → 'Delegado', etc. */}
            {getRoleLabel(role)}
          </Text>
        </View>
      </View>

      {/* ── Campana de notificaciones ── */}
      <TouchableOpacity
        onPress={handleNotificationsPress}
        // hitSlop agranda el área táctil sin afectar el layout visual
        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        style={{ marginTop: 4 }}
        accessibilityLabel="Notificaciones"
        accessibilityRole="button"
      >
        <Ionicons name="notifications-outline" size={26} color="#FFFFFF" />

        {/* Indicador de notificaciones no leídas — punto verde */}
        {notificationCount > 0 && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 9,
              height: 9,
              borderRadius: 999,
              backgroundColor: '#C4F135',
              // Borde oscuro para separar del icono
              borderWidth: 1.5,
              borderColor: '#0F0F13',
            }}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}