/**
 * ProgrammedMatchDetailTabs.tsx
 *
 * Tabs internas del detalle de un partido programado:
 * Encuentros anteriores / Convocatoria.
 * Usada por ProgrammedMatchDetailScreen.
 *
 * Renombrada desde MatchesProgrammed para reflejar su propósito real.
 */

import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";


export function ProgrammedMatchDetailTabs() {
    return (
        <SafeAreaView className="flex-1 m-3 ">
            <text>Hola desde ProgrammedMatchDetailTabs.tsx</text>
        </SafeAreaView>
    );
}
