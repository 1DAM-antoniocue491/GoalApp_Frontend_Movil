/**
 * Variables de entorno para GoalApp Mobile
 *
 * Lee desde process.env.EXPO_PUBLIC_* variables configuradas en .env
 */

import Constants from 'expo-constants';

const getApiUrl = () => {
  if (__DEV__) {
    return process.env.EXPO_PUBLIC_API_URL_DEV || 'http://localhost:8000/api/v1';
  }
  return process.env.EXPO_PUBLIC_API_URL_PROD || 'https://goalapp-backend-j2cx.onrender.com/api/v1';
};

export const ENV = {
  API_URL: getApiUrl(),
  USE_MOCKS: process.env.EXPO_PUBLIC_USE_MOCKS === 'true' || false,
  ENABLE_LOGS: process.env.EXPO_PUBLIC_ENABLE_LOGS === 'true' || false,
  REQUEST_TIMEOUT: parseInt(process.env.EXPO_PUBLIC_REQUEST_TIMEOUT || '30', 10),
  MAX_RETRIES: parseInt(process.env.EXPO_PUBLIC_MAX_RETRIES || '3', 10),
  API_VERSION: 'v1',
} as const;

// Validar variables requeridas
if (!ENV.API_URL) {
  throw new Error('API_URL no configurada. Revisa tu archivo .env');
}
