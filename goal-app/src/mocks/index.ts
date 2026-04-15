/**
 * Mocks - Exportaciones centralizadas de datos mock
 *
 * Re-exporta los arrays y constantes mock desde data.ts.
 * Tipos y servicios se importan desde sus módulos correspondientes:
 * @example
 * import { mockUsers, mockLeagues } from '@/src/mocks';
 * import type { User } from '@/src/shared/types/user';
 * import { validateCredentials } from '@/src/features/auth/services/authService';
 */

export * from './data';
