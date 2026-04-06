// Expo Router usa _layout.tsx para envolver todas las rutas de esa carpeta.
// Aquí controlamos: que no haya header de navegación nativo,
// y que el fondo sea siempre el oscuro del design system.

import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../constants/colors';

export default function AuthLayout() {
    return (
        <Stack
            screenOptions={{
                // Ocultamos el header nativo — el diseño es completamente custom
                headerShown: false,
                // Color de fondo durante la animación de transición entre pantallas
                contentStyle: { backgroundColor: Colors.bg.surface1 },
                // Animación suave entre login y register
                animation: 'fade',
            }}
        />
    );
}