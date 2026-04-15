/**
 * Configuración de entorno
 *
 * En producción, estas variables se leen desde expo-constants o .env
 * Por ahora, se usan valores por defecto para desarrollo con mocks.
 */

export const ENV = {
  /** URL base de la API del backend */
  API_URL: __DEV__
    ? 'http://localhost:8000/api/v1'
    : 'https://goalapp-backend-j2cx.onrender.com/api/v1',

  /** Indica si se usan datos mock en lugar de la API real */
  USE_MOCKS: __DEV__ ? true : false,

  /** Versión de la API */
  API_VERSION: 'v1',
} as const;