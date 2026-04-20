/**
 * Pantalla de entrada (index)
 *
 * Redirige al flujo de autenticación (login/registro).
 * En una implementación futura, podría verificar si hay sesión activa
 * y redirigir directamente al onboarding o tabs.
 */

import { Redirect, RelativePathString } from "expo-router";
import React from "react";
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function Index() {
  // Redirigir al flujo de auth (login/registro)
  return (
    <SafeAreaProvider>
      <Redirect href={('../auth') as RelativePathString} />
    </SafeAreaProvider>
  );
}
