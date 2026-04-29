/**
 * ProgrammedMatchesScreen
 *
 * Lista de partidos programados (próximos) agrupados por jornada.
 * Usa ProgrammedMatchCard como fuente visual única para partidos programados.
 *
 * DATOS:
 * Consume mockUpcomingMatches mientras la API no esté disponible.
 * Cuando exista el endpoint, sustituir por un hook tipo useScheduledMatches()
 * que devuelva UpcomingMatchData[].
 *
 * PERMISOS:
 * getDashboardPermissions se llama con 'admin' como placeholder.
 * Cuando exista el contexto de sesión, reemplazar por:
 *   const { role } = useSession();
 *   const permissions = getDashboardPermissions(role);
 *
 * MODALES:
 * Estado centralizado en useMatchActionModals — mismo flujo que el calendario.
 */

import React from 'react';
import { View, Text, ScrollView } from 'react-native';

import { mockUpcomingMatches } from '@/src/mocks/dashboard.mocks';
import { getDashboardPermissions } from '@/src/features/dashboard/services/dashboardService';
import { ProgrammedMatchCard } from '../cards/ProgrammedMatchCard';
import { Colors } from '@/src/shared/constants/colors';
import { useMatchActionModals } from '../../hooks/useMatchActionModals';
import { StartMatchModal } from '../modals/StartMatchModal';

// Placeholder de permisos — reemplazar por getDashboardPermissions(role) del contexto de sesión
const permissions = getDashboardPermissions('admin');

export function ProgrammedMatchesScreen() {
    const { modals, activeStartMatch, openStartMatch, modalProps } = useMatchActionModals();

    if (mockUpcomingMatches.length === 0) {
        return (
            <View style={{ paddingHorizontal: 16, paddingTop: 24, alignItems: 'center' }}>
                <Text style={{ color: Colors.text.disabled, fontSize: 14 }}>
                    No hay partidos programados
                </Text>
            </View>
        );
    }

    return (
        <>
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
                        Jornada 21
                    </Text>
                    {/* Línea separadora */}
                    <View style={{ flex: 1, height: 1, backgroundColor: Colors.bg.surface2 }} />
                </View>

                {/* ── Tarjetas de partidos programados ── */}
                <View style={{ paddingHorizontal: 16 }}>
                    {mockUpcomingMatches.map((match) => (
                        <ProgrammedMatchCard
                            key={match.id}
                            match={match}
                            permissions={permissions}
                            onPress={() => {
                                // TODO: navegar al detalle del partido programado
                                // router.push(routes.private.matchRoutes.programmed.detail(match.id) as never)
                            }}
                            onStartMatch={() =>
                                openStartMatch({
                                    id: match.id,
                                    homeTeam: match.homeTeam,
                                    awayTeam: match.awayTeam,
                                    // day + month como date display; year se añadirá cuando venga de API
                                    date: `${match.day}/${match.month}`,
                                    time: match.time,
                                    venue: match.venue,
                                })
                            }
                        />
                    ))}
                </View>
            </ScrollView>

            {/* ── Modal de inicio de partido — estado gestionado por useMatchActionModals ── */}
            <StartMatchModal
                visible={modals.startMatch}
                match={activeStartMatch}
                onConfirm={modalProps.onStartMatchConfirm}
                onCancel={modalProps.onCloseStartMatch}
            />
        </>
    );
}
