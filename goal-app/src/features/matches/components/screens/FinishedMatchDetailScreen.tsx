/**
 * FinishedMatchDetailScreen.tsx
 *
 * Vista detallada de un partido finalizado (o en vivo con mismo layout).
 * Muestra marcador, eventos y tabs de estadísticas/alineación.
 *
 * Renombrada desde FinishedMatchLiveScreen para eliminar la ambigüedad
 * del término "Live" en una pantalla que sirve tanto a finished como a live.
 *
 * TODO: conectar con datos reales cuando la API esté disponible.
 * TODO: diferenciar layout live vs finished si divergen en el futuro.
 */

import React from 'react';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function FinishedMatchDetailScreen() {
    return (
        <SafeAreaView className="flex-1">
            <><Text>Hola desde FinishedMatchDetailScreen.tsx</Text></>
        </SafeAreaView>
    );
}
