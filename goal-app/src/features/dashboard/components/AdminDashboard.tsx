/**
 * AdminDashboard.tsx
 *
 * Dashboard para el rol `admin`. Orquesta todos los sub-componentes
 * y gestiona el ciclo de datos (loading → error → datos → refresco).
 *
 * RESPONSABILIDAD:
 * - Leer datos del dashboard via `useDashboardData` (nunca directamente del mock)
 * - Calcular permisos via `getDashboardPermissions` (nunca hardcodear en hijos)
 * - Pasar datos y permisos a cada sub-componente
 * - Gestionar navegación de alto nivel (registrar evento, finalizar partido)
 *
 * PATRÓN DE DATOS:
 * AdminDashboard → useDashboardData → (hoy) mockDashboardData
 *                                   → (futuro) API real vía TanStack Query
 *
 * Los sub-componentes no saben si los datos vienen de mock o API.
 * Solo conocen su prop contract.
 *
 * ESTADOS VISUALES:
 * ✅ Loading   → skeletons animados
 * ✅ Error     → pantalla de error con retry
 * ✅ Sin live  → la sección "EN VIVO" simplemente no se renderiza
 * ✅ Sin próximos → UpcomingMatchesSection muestra su propio empty state
 * ✅ Con datos → layout completo
 *
 * POR QUÉ SafeAreaView EN LUGAR DE View:
 * La tab bar inferior de Expo Router ya gestiona el safe area inferior,
 * pero el notch/isla dinámica superior necesita SafeAreaView aquí.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useActiveLeague } from '@/src/state/activeLeague/activeLeagueStore';
import { useDashboardData } from '@/src/shared/hooks/usedashboarddata';
import { getDashboardPermissions } from '../services/dashboardService';
import { routes } from '@/src/shared/config/routes';

import { WelcomeBlock } from './WelcomeBlock';
import { LeagueMetrics } from './LeagueMetrics';
import { LiveMatchCard } from './LiveMatchCard';
import { UpcomingMatchesSection } from './UpcomingMatchesSection';
import { ProgressMetrics } from './ProgressMetrics';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AdminDashboardProps {
  leagueName: string;
  /** ID de la liga activa — se usa como clave de datos en useDashboardData */
  leagueId: string;
  /** Nombre del usuario autenticado — viene de la sesión global */
  userName: string;
  /** Número de notificaciones no leídas */
  notificationCount?: number;
}

// ---------------------------------------------------------------------------
// Estado de carga (skeleton simplificado)
// ---------------------------------------------------------------------------

function DashboardSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 20, gap: 16 }}>
      {/* Skeleton de métricas */}
      {[...Array(2)].map((_, row) => (
        <View key={row} style={{ flexDirection: 'row', gap: 12 }}>
          {[...Array(2)].map((_, col) => (
            <View
              key={col}
              style={{
                flex: 1,
                height: 110,
                backgroundColor: '#1C1C22',
                borderRadius: 12,
                opacity: 0.6,
              }}
            />
          ))}
        </View>
      ))}
      {/* Skeleton de tarjeta live */}
      <View
        style={{ height: 200, backgroundColor: '#1C1C22', borderRadius: 20, opacity: 0.6 }}
      />
      {/* Skeleton de partidos próximos */}
      {[...Array(3)].map((_, i) => (
        <View
          key={i}
          style={{ height: 80, backgroundColor: '#1C1C22', borderRadius: 12, opacity: 0.4 }}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Estado de error con retry
// ---------------------------------------------------------------------------

function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Ionicons name="cloud-offline-outline" size={52} color="#52525B" />
      <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600', marginTop: 16 }}>
        Error al cargar el dashboard
      </Text>
      <Text
        style={{ color: '#A1A1AA', fontSize: 14, textAlign: 'center', marginTop: 8 }}
      >
        Revisa tu conexión y vuelve a intentarlo.
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        style={{
          marginTop: 24,
          backgroundColor: '#C4F135',
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 999,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Ionicons name="refresh-outline" size={16} color="#0F0F13" />
        <Text style={{ color: '#0F0F13', fontWeight: '700', fontSize: 14 }}>
          Reintentar
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function AdminDashboard({
  leagueName,
  leagueId,
  userName,
  notificationCount = 0,
}: AdminDashboardProps) {
  const router = useRouter();

  // Datos del dashboard desde el hook (mock hoy, API mañana)
  const { data, isLoading, isError, refetch } = useDashboardData(leagueId);

  // Permisos del rol admin — calculados una sola vez en el padre
  // para pasarlos a todos los hijos que los necesiten
  const permissions = getDashboardPermissions('admin');

  // ── Handlers de navegación y acciones ──

  const handleRegisterEvent = (matchId: string) => {
    // Abre el modal de registro de evento (gol, tarjeta, sustitución)
    // TODO: cuando exista el modal de eventos, navegar aquí
    // router.push(routes.private.matches.detail(matchId));
    console.log('[AdminDashboard] Registrar evento para partido:', matchId);
  };

  const handleEndMatch = (matchId: string) => {
    // Abre el flujo de finalización (resultado final + MVP + observaciones)
    // TODO: navegar al modal de finalización cuando esté implementado
    console.log('[AdminDashboard] Finalizar partido:', matchId);
  };

  const handleStartMatch = (matchId: string) => {
    // Confirma el inicio del partido (cambia estado a `live`)
    // TODO: llamar a la API de inicio cuando esté disponible
    console.log('[AdminDashboard] Iniciar partido:', matchId);
  };

  // ── Render ──

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#0F0F13' }}
      // edges: 'top' porque la tab bar inferior ya gestiona el safe area inferior
      edges={['top']}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0F0F13" />

      {/* WelcomeBlock siempre visible, incluso en loading/error */}
      <WelcomeBlock
        userName={userName}
        leagueName={leagueName}
        role="admin"
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
        <DashboardError onRetry={refetch} />
      )}

      {/* ── Estado: datos listos ── */}
      {data && !isLoading && !isError && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Métricas 2×2 (solo admin: canViewLeagueMetrics) ── */}
          <LeagueMetrics metrics={data.metrics} />

          {/* ── Partido en vivo (si existe) ── */}
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

          {/* ── Próximos partidos ── */}
          <UpcomingMatchesSection
            matches={data.upcomingMatches}
            permissions={permissions}
            onStartMatch={handleStartMatch}
          />

          {/* ── Progreso: equipos activos + jornadas (solo admin) ── */}
          {permissions.canViewProgressMetrics && (
            <ProgressMetrics metrics={data.metrics} />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}