/**
 * routes.ts
 *
 * Rutas semánticas de la aplicación.
 *
 * REGLA DE ARQUITECTURA (architecture.md §7.2):
 * Evitar strings hardcodeados en los componentes.
 * Usar siempre `routes.xxx` en lugar de `router.push('/calendario')`.
 *
 * Expo Router sigue siendo la fuente real de rutas (estructura de app/).
 * Este archivo es una capa semántica por encima que facilita refactors
 * y evita strings dispersos por el código.
 *
 * USO CORRECTO:
 *   import { routes } from '@/src/shared/config/routes';
 *   router.push(routes.private.tabs.calendar);
 *
 * NO HACER:
 *   router.push('/calendario');   ← string hardcodeado, frágil a renombrar
 */

export const routes = {
  /** Zona pública (sin autenticar) */
  public: {
    landing: '/',
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      forgotPassword: '/auth/forgot-password',
    },
  },

  /** Zona privada (requiere sesión activa) */
  private: {
    /** Selección de liga al inicio de sesión */
    onboarding: '/(private)/onboarding',

    /** Tabs principales de la app */
    tabs: {
      /** Dashboard / Inicio */
      home: '/(private)/(tabs)/',
      /** Vista de calendario de partidos */
      calendar: '/(private)/(tabs)/calendar',
      /** Listado de partidos */
      matches: '/(private)/(tabs)/matches',
      /** Perfil de usuario */
      profile: '/(private)/(tabs)/profile',
    },

    /** Pantallas fuera de tabs (push sobre las tabs) */
    matches: {
      /** Todos los partidos en vivo */
      allLive: '/(private)/matches/all_live',
      /** Todos los resultados recientes */
      allFinished: '/(private)/matches/all_finished',
      /** Todos los programados */
      allProgrammed: '/(private)/matches/all_programmed',
      /** Detalle de un partido específico */
      detail: (id: string) => `/(private)/matches/${id}`,
    },

    /** Modal de acciones rápidas (botón +) */
    quickActions: '/(private)/modals',

    /** Notificaciones */
    notifications: '/(private)/notifications',
  },
} as const;