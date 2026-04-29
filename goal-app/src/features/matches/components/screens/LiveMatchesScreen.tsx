/**
 * LiveMatchesScreen
 *
 * Lista de partidos en directo agrupados por jornada.
 * Usa LiveMatchCard como fuente visual única para partidos en vivo.
 *
 * DATOS:
 * Consume mockLiveMatch mientras la API no esté disponible.
 * Cuando exista el endpoint, sustituir mockLiveMatches por un hook
 * tipo useLiveMatches() que devuelva LiveMatchData[].
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

import { mockLiveMatch } from '@/src/mocks/dashboard.mocks';
import { getDashboardPermissions } from '@/src/features/dashboard/services/dashboardService';
import { LiveMatchCard } from '@/src/features/matches/components/cards/LiveMatchCard';
import { Colors } from '@/src/shared/constants/colors';
import { useMatchActionModals } from '@/src/features/matches/hooks/useMatchActionModals';
import { RegisterEventModal } from '@/src/features/matches/components/modals/RegisterEventModal';
import { GoalEventModal } from '@/src/features/matches/components/modals/GoalEventModal';
import { YellowCardModal } from '@/src/features/matches/components/modals/YellowCardModal';
import { RedCardModal } from '@/src/features/matches/components/modals/RedCardModal';
import { SubstitutionModal } from '@/src/features/matches/components/modals/SubstitutionModal';
import { EndMatchModal } from '@/src/features/matches/components/modals/EndMatchModal';

// Mock temporal: array de partidos en vivo
// Sustituir por hook cuando la API esté disponible
const mockLiveMatches = [mockLiveMatch];

// Placeholder de permisos — reemplazar por getDashboardPermissions(role) del contexto de sesión
const permissions = getDashboardPermissions('admin');

export function LiveMatchesScreen() {
    const {
        modals,
        activeEventMatch,
        activeEndMatch,
        openRegisterEvent,
        openEndMatch,
        modalProps,
    } = useMatchActionModals();

    if (mockLiveMatches.length === 0) {
        return (
            <View style={{ paddingHorizontal: 16, paddingTop: 24, alignItems: 'center' }}>
                <Text style={{ color: Colors.text.disabled, fontSize: 14 }}>
                    No hay partidos en vivo ahora mismo
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
                        Jornada 10
                    </Text>
                    {/* Línea separadora */}
                    <View style={{ flex: 1, height: 1, backgroundColor: Colors.bg.surface2 }} />
                </View>

                {/* ── Tarjetas de partidos en vivo ── */}
                {mockLiveMatches.map((match) => (
                    <LiveMatchCard
                        key={match.id}
                        match={match}
                        permissions={permissions}
                        onRegisterEvent={() =>
                            openRegisterEvent({
                                id: match.id,
                                homeTeam: match.homeTeam,
                                awayTeam: match.awayTeam,
                                homeScore: match.homeScore,
                                awayScore: match.awayScore,
                                minute: match.minute,
                            })
                        }
                        onEndMatch={() =>
                            openEndMatch({
                                id: match.id,
                                homeTeam: match.homeTeam,
                                awayTeam: match.awayTeam,
                                homeScore: match.homeScore,
                                awayScore: match.awayScore,
                            })
                        }
                    />
                ))}
            </ScrollView>

            {/* ── Modales operativos — estado gestionado por useMatchActionModals ── */}

            <RegisterEventModal
                visible={modals.registerEvent}
                match={activeEventMatch}
                onSelectEvent={modalProps.onSelectEvent}
                onCancel={modalProps.onCloseRegisterEvent}
            />

            <GoalEventModal
                visible={modals.goal}
                match={activeEventMatch}
                onConfirm={modalProps.onGoalConfirm}
                onCancel={modalProps.onCloseGoal}
            />

            <YellowCardModal
                visible={modals.yellowCard}
                match={activeEventMatch}
                onConfirm={modalProps.onYellowCardConfirm}
                onCancel={modalProps.onCloseYellowCard}
            />

            <RedCardModal
                visible={modals.redCard}
                match={activeEventMatch}
                onConfirm={modalProps.onRedCardConfirm}
                onCancel={modalProps.onCloseRedCard}
            />

            <SubstitutionModal
                visible={modals.substitution}
                match={activeEventMatch}
                onConfirm={modalProps.onSubstitutionConfirm}
                onCancel={modalProps.onCloseSubstitution}
            />

            <EndMatchModal
                visible={modals.endMatch}
                match={activeEndMatch}
                onConfirm={modalProps.onEndMatchConfirm}
                onCancel={modalProps.onCloseEndMatch}
            />
        </>
    );
}
