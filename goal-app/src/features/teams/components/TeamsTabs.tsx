/**
 * TeamsTabs.tsx
 *
 * Tabs de navegación en el detalle de un equipo:
 * Información / Plantilla.
 *
 * Movida desde features/matches/components a su feature correcta.
 */

import React from "react";
import { SafeAreaView, } from "react-native-safe-area-context";
import { Text } from 'react-native';


export function TeamsTabs() {
    return (
        <SafeAreaView className="flex-1">
            <Text>Hola desde TeamsTabs.tsx</Text>
        </SafeAreaView>
    );
}
