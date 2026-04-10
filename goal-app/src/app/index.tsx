/**
 * Pantalla de entrada (index)
 *
 * Redirige al flujo de autenticación (login/registro).
 * En una implementación futura, podría verificar si hay sesión activa
 * y redirigir directamente al onboarding o tabs.
 */

import { Redirect, RelativePathString } from "expo-router";
import React from "react";

export default function Index() {
  // Redirigir al flujo de auth (login/registro)
  return (
    <Redirect href={('/auth/login') as RelativePathString} />
  );
}
