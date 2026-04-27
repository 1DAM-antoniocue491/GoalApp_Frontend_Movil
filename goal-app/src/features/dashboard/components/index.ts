/**
 * index.ts — Exportaciones centralizadas del feature Dashboard
 *
 * REGLA: Los consumidores externos importan SIEMPRE desde este índice,
 * nunca directamente desde las subcarpetas del feature.
 *
 * Correcto:
 *   import { AdminDashboard } from '@/src/features/dashboard/components';
 *
 * Incorrecto:
 *   import { AdminDashboard } from '@/src/features/dashboard/components/AdminDashboard';
 *
 * Esto permite refactorizar la estructura interna del feature sin
 * romper los imports en el resto de la app.
 *
 * Se exporta solo lo que necesitan los consumidores externos.
 * Los sub-componentes internos (TeamShield, MetricCard, etc.) NO se exportan.
 */

// ── Pantalla orquestadora (usada en app/(private)/(tabs)/index.tsx) ──
export { default as DashboardScreen } from "./DashboardScreen";

// ── Dashboards por rol (usados en DashboardScreen y en tests) ──
export { AdminDashboard } from "./AdminDashboard";
export { CoachDashboard } from "./CoachDashboard";
export { PlayerDashboard } from "./PlayerDashboard";
export { FieldDelegateDashboard } from "./FieldDelegateDashboard";
export { ObserverDashboard } from "./ObserverDashboard";

// ── Tipos (para componentes que consumen datos del dashboard externamente) ──
export type {
  DashboardData,
  LeagueMetricsData,
  LiveMatchData,
  UpcomingMatchData,
} from "@/src/shared/types/dashboard.types";

// ── Servicio (para usar getDashboardPermissions en otros contextos) ──
export {
  getDashboardPermissions,
  getRoleLabel,
} from "@/src/features/dashboard/services/dashboardService";
