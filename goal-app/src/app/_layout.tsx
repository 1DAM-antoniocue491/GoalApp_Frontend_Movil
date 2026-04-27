/**
 * RootLayout - Layout raíz de la aplicación
 *
 * Estructura de rutas:
 * - / → Redirige a /auth/login o /onboarding (según sesión)
 * - /auth/login, /auth/register → Autenticación (sin tabs)
 * - /onboarding → Listado de ligas (sin tabs, protegido)
 * - /(tabs) → Navegación principal (con tabs, protegido)
 *
 * Envuelve toda la app con AuthProvider para estado global de autenticación
 */

import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../../global.css";
import React from "react";

// Import AuthProvider para estado global de autenticación
import { AuthProvider } from "@/src/providers/AuthProvider";
import { ProtectedRoute } from "@/src/components/ProtectedRoute";

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <Stack
                    screenOptions={{
                        headerShown: false,
                    }}
                >
                    {/* Ruta de entrada (redirige según sesión) */}
                    <Stack.Screen name="index" options={{ title: "GoalApp" }} />

                    {/* Rutas de autenticación (sin tabs, públicas) */}
                    <Stack.Screen name="auth" options={{ title: "Autenticación" }} />

                    {/* Onboarding - Listado de ligas (sin tabs, protegido) */}
                    <Stack.Screen
                        name="onboarding"
                        options={{ title: "Ligas" }}
                    />

                    {/* Navegación principal con tabs (protegido) */}
                    <Stack.Screen name="(tabs)" options={{ title: "Inicio" }} />
                </Stack>
            </AuthProvider>
        </SafeAreaProvider>
    );
}
