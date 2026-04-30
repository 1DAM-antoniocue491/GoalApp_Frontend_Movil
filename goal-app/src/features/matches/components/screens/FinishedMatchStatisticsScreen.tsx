/**
 * FinishedMatchStatisticsScreen
 * Estadísticas de un partido finalizado (tarjetas, eventos, etc.).
 * TODO: conectar con datos reales cuando la API esté disponible.
 */

import React from 'react';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function FinishedMatchStatisticsScreen() {
    return (
        <SafeAreaView className="flex-1">
            <Text className="text-center text-white">Hola desde FinishedMatchStatisticsScreen.tsx</Text>
        </SafeAreaView>
    );
}
