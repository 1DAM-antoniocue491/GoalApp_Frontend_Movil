/**
 * MatchStatusTabs.tsx
 *
 * Tabs de navegación entre estados de partido: Directo / Programados / Finalizados.
 * Usada por MatchesHubScreen para cambiar la vista activa del hub.
 *
 * Renombrada desde MatchesTabs para reflejar su propósito real.
 */

import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export function MatchStatusTabs() {

    return (
        <SafeAreaView className="flex-1 ">
            <text>Hola desde MatchStatusTabs.tsx</text>
        </SafeAreaView>
    );
}
