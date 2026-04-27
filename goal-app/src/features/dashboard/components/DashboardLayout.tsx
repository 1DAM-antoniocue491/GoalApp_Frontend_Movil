/**
 * DashboardLayout.tsx
 *
 * Shell común para todos los dashboards por rol.
 *
 * RESPONSABILIDAD:
 * Centraliza la estructura que estaba copiada en AdminDashboard,
 * CoachDashboard, FieldDelegateDashboard y PlayerDashboard:
 *   - SafeAreaView + StatusBar
 *   - WelcomeBlock (header con logo, liga, notificaciones y saludo)
 *   - Estado loading  → DashboardSkeleton animado (mismo para todos los roles)
 *   - Estado error    → DashboardError con acción de retry
 *   - ScrollView con padding correcto
 *
 * USO:
 * Cada dashboard de rol pasa sus datos de sesión, los estados de carga
 * y sus secciones específicas como `children`.
 * El dashboard es responsable de null-chequear su `data` antes de
 * renderizar las secciones:
 *
 *   <DashboardLayout ... isLoading={isLoading} isError={isError} onRetry={refetch}>
 *     {data && (
 *       <>
 *         <LeagueMetrics metrics={data.metrics} />
 *         <UpcomingMatchesSection ... />
 *       </>
 *     )}
 *   </DashboardLayout>
 *
 * POR QUÉ `children` Y NO RENDER PROPS:
 * Las secciones de cada rol no necesitan datos del layout para renderizarse.
 * No hay interacción layout↔contenido que justifique render props.
 * `children` es suficiente y más legible.
 *
 * POR QUÉ DashboardSkeleton Y DashboardError SON INTERNOS:
 * Solo los usa DashboardLayout. No tienen valor fuera de este contexto.
 * Si en el futuro un rol necesita un skeleton distinto, se añade una
 * prop opcional `skeleton?: React.ReactNode` sin romper la interfaz.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { WelcomeBlock } from './WelcomeBlock';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import type { LeagueRole } from '@/src/shared/types/league';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DashboardLayoutProps {
  /** Nombre del usuario autenticado — aparece en el saludo del WelcomeBlock */
  userName: string;
  /**
   * Nombre de la liga activa. Puede venir pre-formateado por el rol:
   *   - admin / field_delegate → nombre de la liga directamente
   *   - coach / player         → "NombreEquipo · NombreLiga"
   * El layout no necesita saber el formato; lo decide el dashboard de rol.
   */
  leagueName: string;
  /**
   * Rol del usuario en la liga activa.
   * Se usa `LeagueRole` en vez de `string` para que WelcomeBlock pueda
   * llamar a `getRoleLabel` con tipo seguro sin resolver la etiqueta aquí.
   */
  role: LeagueRole;
  /** Número de notificaciones no leídas. 0 oculta el indicador. */
  notificationCount?: number;
  /** Si los datos del dashboard están cargando */
  isLoading: boolean;
  /** Si se ha producido un error al cargar los datos */
  isError: boolean;
  /** Callback para reintentar la carga tras un error */
  onRetry: () => void;
  /**
   * Secciones específicas del rol.
   * Se renderizan dentro del ScrollView cuando !isLoading && !isError.
   * El dashboard de rol es responsable de null-chequear su `data`.
   */
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Estado de carga — esqueleto animado unificado
//
// Migrado desde AdminDashboard para que todos los roles tengan el mismo
// skeleton de calidad en lugar de los spinners inconsistentes que había.
// Si en el futuro un rol necesita un skeleton distinto, DashboardLayoutProps
// puede aceptar un `skeleton?: React.ReactNode` opcional.
// ---------------------------------------------------------------------------

function DashboardSkeleton() {
  return (
    <View
      style={{
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.xl,
        gap: theme.spacing.lg,
      }}
    >
      {/* Skeleton del grid de métricas 2×2 */}
      {[...Array(2)].map((_, row) => (
        <View key={row} style={{ flexDirection: 'row', gap: theme.spacing.md }}>
          {[...Array(2)].map((_, col) => (
            <View
              key={col}
              style={{
                flex: 1,
                height: 110,
                backgroundColor: Colors.bg.surface1,
                borderRadius: theme.borderRadius.lg,
                opacity: 0.6,
              }}
            />
          ))}
        </View>
      ))}

      {/* Skeleton de la tarjeta EN VIVO */}
      <View
        style={{
          height: 200,
          backgroundColor: Colors.bg.surface1,
          borderRadius: 20,
          opacity: 0.6,
        }}
      />

      {/* Skeleton de próximos partidos — opacidad decreciente para dar profundidad */}
      {[...Array(3)].map((_, i) => (
        <View
          key={i}
          style={{
            height: 80,
            backgroundColor: Colors.bg.surface1,
            borderRadius: theme.borderRadius.lg,
            opacity: Math.max(0.4 - i * 0.1, 0.15),
          }}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Estado de error con retry
//
// Migrado desde AdminDashboard. Antes, Coach, FieldDelegate y Player tenían
// un TouchableOpacity inline sin estilo. Ahora todos comparten este estado.
// ---------------------------------------------------------------------------

function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xl,
      }}
    >
      <Ionicons name="cloud-offline-outline" size={52} color={Colors.text.disabled} />

      <Text
        style={{
          color: Colors.text.primary,
          fontSize: theme.fontSize.lg,
          fontWeight: '600',
          marginTop: theme.spacing.lg,
          textAlign: 'center',
        }}
      >
        Error al cargar el dashboard
      </Text>

      <Text
        style={{
          color: Colors.text.secondary,
          fontSize: theme.fontSize.sm,
          textAlign: 'center',
          marginTop: theme.spacing.sm,
          lineHeight: 20,
        }}
      >
        Revisa tu conexión y vuelve a intentarlo.
      </Text>

      <TouchableOpacity
        onPress={onRetry}
        style={{
          marginTop: theme.spacing.xl,
          backgroundColor: Colors.brand.primary,
          paddingHorizontal: theme.spacing.xl,
          paddingVertical: theme.spacing.md,
          borderRadius: theme.borderRadius.full,
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm,
        }}
        accessibilityRole="button"
        accessibilityLabel="Reintentar carga del dashboard"
      >
        <Ionicons name="refresh-outline" size={16} color={Colors.bg.base} />
        <Text
          style={{
            color: Colors.bg.base,
            fontWeight: '700',
            fontSize: theme.fontSize.sm,
          }}
        >
          Reintentar
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Componente principal exportado
// ---------------------------------------------------------------------------

export function DashboardLayout({
  userName,
  leagueName,
  role,
  notificationCount = 0,
  isLoading,
  isError,
  onRetry,
  children,
}: DashboardLayoutProps) {
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.bg.base }}
      // edges: 'top' — la tab bar inferior ya gestiona el safe area inferior
      edges={['top']}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg.base} />

      {/*
        WelcomeBlock siempre visible: incluso en loading y error el usuario
        necesita ver en qué liga está y con qué rol. El encabezado no depende
        de que los datos del dashboard hayan cargado.
      */}
      <WelcomeBlock
        userName={userName}
        leagueName={leagueName}
        role={role}
        notificationCount={notificationCount}
      />

      {/* ── Estado: cargando ── */}
      {isLoading && (
        <ScrollView showsVerticalScrollIndicator={false}>
          <DashboardSkeleton />
        </ScrollView>
      )}

      {/* ── Estado: error ── */}
      {isError && !isLoading && (
        <DashboardError onRetry={onRetry} />
      )}

      {/*
        ── Estado: datos listos → secciones específicas del rol ──
        El dashboard de rol es responsable de null-chequear `data` dentro
        de children antes de renderizar secciones que lo necesiten.
        DashboardLayout no conoce el tipo de datos de cada rol.
      */}
      {!isLoading && !isError && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
