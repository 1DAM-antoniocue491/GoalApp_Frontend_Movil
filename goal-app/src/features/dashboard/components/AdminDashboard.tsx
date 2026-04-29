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
 * SHELL:
 * SafeAreaView, StatusBar, WelcomeBlock, loading y error están centralizados
 * en DashboardLayout. AdminDashboard solo se preocupa de sus secciones.
 */

import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { useDashboardData } from '@/src/shared/hooks/usedashboarddata';
import { getDashboardPermissions } from '../services/dashboardService';
import { routes } from '@/src/shared/config/routes';
import { DashboardLayout } from './DashboardLayout';
import { LeagueMetrics } from './LeagueMetrics';
import { LiveMatchCard } from '@/src/features/matches/components/cards/LiveMatchCard';
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
    <DashboardLayout
      userName={userName}
      leagueName={leagueName}
      role="admin"
      notificationCount={notificationCount}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
    >
      {/*
        data se null-chequea aquí porque DashboardLayout no conoce el tipo
        de datos de cada rol. Cuando data es null (antes de la primera carga)
        este bloque se omite y el layout sigue mostrando el skeleton.
      */}
      {data && (
        <>
          {/* ── Métricas 2×2 (solo admin: canViewLeagueMetrics) ── */}
          {permissions.canViewLeagueMetrics && (
            <LeagueMetrics metrics={data.metrics} />
          )}

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
        </>
      )}
    </DashboardLayout>
  );
}