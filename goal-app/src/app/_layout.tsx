/**
 * RootLayout - Layout raíz de la aplicación
 *
 * Estructura de rutas:
 * - / → Redirige a /auth/login
 * - /auth/login, /auth/register → Autenticación (sin tabs)
 * - /onboarding → Listado de ligas (sin tabs)
 * - /(tabs) → Navegación principal (con tabs)
 */

import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../../global.css";
import React from "react";

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <Stack
                screenOptions={{
                    headerShown: false,
                }}
            >
                {/* Ruta de entrada (redirige a auth) */}
                <Stack.Screen name="index" options={{ title: "GoalApp" }} />

                {/* Rutas de autenticación (sin tabs) */}
                <Stack.Screen name="auth" options={{ title: "Autenticación" }} />

                {/* Onboarding - Listado de ligas (sin tabs) */}
                <Stack.Screen name="onboarding" options={{ title: "Ligas" }} />

                {/* Navegación principal con tabs */}
                <Stack.Screen name="(tabs)" options={{ title: "Inicio" }} />
            </Stack>
        </SafeAreaProvider>
    );
}
