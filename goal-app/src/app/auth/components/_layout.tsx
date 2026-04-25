/**
 * AuthLayout - Layout para pantallas de autenticación
 *
 * Este layout controla exclusivamente las pantallas de login y registro.
 * Aquí unificamos:
 * - Ocultación del header nativo
 * - Fondo oscuro consistente durante toda la transición
 * - Animación suave entre pantallas de auth
 */

import React from 'react';
import { Stack } from 'expo-router';

// Importamos los colores del sistema de diseño para no hardcodear
import { Colors } from '@/src/shared/constants/colors';

export default function AuthLayout() {
    return (
        <Stack
            screenOptions={{
                // Ocultamos el header nativo porque el diseño de auth es custom
                headerShown: false,

                // Mantenemos el mismo color de fondo durante la transición
                // para evitar flashes o "luces" entre pantallas
                contentStyle: {
                    backgroundColor: Colors.bg.surface1,
                },

                // Transición suave y profesional entre login y registro
                animation: 'fade',

                // Reducimos un poco la duración para que el cambio se sienta más limpio
                // y menos pesado visualmente
                animationDuration: 220,
            }}
        >
            {/* Pantalla de login */}
            <Stack.Screen name="login" />

            {/* Pantalla de registro */}
            <Stack.Screen name="register" />

            {/* Flujo de recuperación de contraseña */}
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="check-email" />
            <Stack.Screen name="reset-password" />
        </Stack>
    );
}