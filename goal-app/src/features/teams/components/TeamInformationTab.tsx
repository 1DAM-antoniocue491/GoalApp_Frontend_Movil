/**
 * TeamInformationTab
 * Tab de información general de un equipo: estadio, colores, entrenador y delegado.
 * TODO: conectar con datos reales cuando la API esté disponible.
 */

import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native';


export function TeamInformationTab() {
    return (
        <SafeAreaView className="flex-1 items-center justify-center ">
            <Text>Hola desde TeamInformationTab.tsx</Text>
        </SafeAreaView>
    );
}
