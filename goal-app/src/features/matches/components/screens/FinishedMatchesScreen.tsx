/**
 * FinishedMatchesScreen
 *
 * Histórico de resultados: lista de partidos finalizados por jornada.
 * Usa FinishedMatchCard como fuente visual única para partidos finalizados.
 *
 * DATOS:
 * Consume mockFinishedMatches mientras la API no esté disponible.
 * Cuando exista el endpoint, sustituir por un hook tipo useFinishedMatches()
 * que devuelva FinishedMatchData[].
 *
 * NAVEGACIÓN:
 * El tap en una card debe abrir el detalle completo del partido (FinishedMatchLiveScreen).
 * La ruta se activa cuando router esté configurado para esta pantalla.
 */

import React from 'react';
import { View, Text, ScrollView } from 'react-native';

import { mockFinishedMatches } from '@/src/mocks/dashboard.mocks';
import { FinishedMatchCard } from '@/src/features/matches/components/cards/FinishedMatchCard';
import { Colors } from '@/src/shared/constants/colors';

export function FinishedMatchesScreen() {
    if (mockFinishedMatches.length === 0) {
        return (
            <View style={{ paddingHorizontal: 16, paddingTop: 24, alignItems: 'center' }}>
                <Text style={{ color: Colors.text.disabled, fontSize: 14 }}>
                    No hay resultados disponibles
                </Text>
            </View>
        );
    }

    return (
        <ScrollView
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
        >
            {/* ── Cabecera de jornada ── */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    paddingTop: 20,
                    paddingBottom: 12,
                    gap: 10,
                }}
            >
                <Text
                    style={{
                        backgroundColor: Colors.brand.primary,
                        color: Colors.bg.base,
                        fontWeight: '700',
                        fontSize: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        borderRadius: 6,
                        overflow: 'hidden',
                    }}
                >
                    Jornada 10
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: Colors.bg.surface2 }} />
            </View>

            {/* ── Tarjetas de resultados ── */}
            <View style={{ paddingHorizontal: 16 }}>
                {mockFinishedMatches.map((match) => (
                    <FinishedMatchCard
                        key={match.id}
                        match={match}
                        onPress={() => {
                            // TODO: navegar al detalle del partido finalizado
                            // router.push(routes.private.matchRoutes.allFinished.live as never)
                        }}
                    />
                ))}
            </View>
        </ScrollView>
    );
}
