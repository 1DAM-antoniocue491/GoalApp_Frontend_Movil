/**
 * Pantalla de entrada (index)
 *
 * Verifica si hay sesión activa al iniciar:
 * - Si hay sesión → redirige a onboarding
 * - Si no hay sesión → redirige a login
 */

import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { Loader } from '@/src/shared/components/feedback/Loader';
import { sessionStore } from '@/src/state/session/sessionStore';
import { routes } from '@/src/shared/config/routes';

export default function Index() {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const session = await sessionStore.getSession();
        setIsAuthenticated(session.isAuthenticated);
      } catch (error) {
        console.error('[Index] Error checking session:', error);
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    }

    checkSession();
  }, []);

  // Mostrar loader mientras verifica sesión
  if (isChecking) {
    return <Loader fullScreen />;
  }

  // Redirigir según estado de autenticación
  return (
    <Redirect href={
      isAuthenticated
        ? routes.private.onboarding
        : routes.public.auth.login
    } />
  );
}
