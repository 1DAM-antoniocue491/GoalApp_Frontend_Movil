/**
 * ProtectedRoute - Wrapper para rutas que requieren autenticación
 *
 * Verifica si el usuario está autenticado antes de renderizar:
 * - Si está autenticado → renderiza children
 * - Si no está autenticado → redirige a login
 */

import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/features/auth/hooks/useAuth';
import { Loader } from '@/src/shared/components/feedback/Loader';
import { routes } from '@/src/shared/config/routes';
import React from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // No autenticado → redirigir a login
      router.replace(routes.public.auth.login);
    }
  }, [isAuthenticated, isLoading]);

  // Mostrar loader mientras verifica
  if (isLoading) {
    return <Loader fullScreen />;
  }

  // Si está autenticado, renderizar children
  return isAuthenticated ? children : null;
}
