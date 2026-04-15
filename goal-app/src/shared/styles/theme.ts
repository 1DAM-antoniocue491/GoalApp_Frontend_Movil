/**
 * Tema de la aplicación
 *
 * Define los valores semánticos del design system para uso
 * en componentes que necesitan acceso programático al tema.
 * Los estilos con Tailwind/NativeWind se definen en styles/index.ts
 */

import { Colors } from '@/src/shared/constants/colors';

export const theme = {
  colors: Colors,
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
} as const;