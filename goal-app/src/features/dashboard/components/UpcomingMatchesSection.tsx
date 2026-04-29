/**
 * UpcomingMatchesSection.tsx
 *
 * Lista de próximos partidos del dashboard.
 *
 * RESPONSABILIDAD: Renderizado de la sección "Próximos partidos".
 * Navega al calendario completo o al detalle de cada partido.
 * Los colores de equipo proceden de UpcomingMatchData.homeColor/awayColor.
 *
 * PERMISOS:
 * Las acciones visibles (Iniciar, Convocatoria, Plantilla, Solo consulta)
 * se controlan mediante la prop `permissions` — nunca hardcodeadas aquí.
 * Esto permite que el mismo componente sirva a admin, coach, player y
 * field_delegate con distintas acciones sin duplicar el componente.
 *
 * POR QUÉ `style` EN VEZ DE `className`:
 * - Los valores de spacing y tamaño exactos se mantienen consistentes
 *   con el resto del design system usando `style` inline.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { routes } from '@/src/shared/config/routes';
import type { UpcomingMatchData } from '@/src/shared/types/dashboard.types';
import type { DashboardPermissions } from '../services/dashboardService';
import { ProgrammedMatchCard } from '@/src/features/matches/components/cards/ProgrammedMatchCard';
import { Colors } from '@/src/shared/constants/colors';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface UpcomingMatchesSectionProps {
    matches: UpcomingMatchData[];
    permissions: DashboardPermissions;
    /** Callback cuando el usuario pulsa "Iniciar partido" */
    onStartMatch?: (matchId: string) => void;
}


// ---------------------------------------------------------------------------
// Componente exportado
// ---------------------------------------------------------------------------

export function UpcomingMatchesSection({
    matches,
    permissions,
    onStartMatch,
}: UpcomingMatchesSectionProps) {
    const router = useRouter();

    if (matches.length === 0) {
        return (
            <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
                <Text style={{ color: Colors.text.primary, fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
                    Próximos partidos
                </Text>
                {/* Empty state: no hay partidos programados */}
                <View
                    style={{
                        backgroundColor: Colors.bg.surface1,
                        borderRadius: 12,
                        padding: 24,
                        alignItems: 'center',
                    }}
                >
                    <Ionicons name="calendar-outline" size={32} color={Colors.text.disabled} />
                    <Text style={{ color: Colors.text.disabled, fontSize: 14, marginTop: 8 }}>
                        No hay partidos programados
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
            {/* ── Cabecera de sección ── */}
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                }}
            >
                <Text style={{ color: Colors.text.primary, fontSize: 18, fontWeight: '600' }}>
                    Próximos partidos
                </Text>

                {/* Enlace "Ver calendario" → navega a la tab de calendario */}
                <TouchableOpacity
                    onPress={() => {
                        // router.push(routes.private.tabs.calendar as never)
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}
                >
                    <Text style={{ color: Colors.brand.primary, fontSize: 13, fontWeight: '500' }}>
                        Ver calendario
                    </Text>
                    <Ionicons name="chevron-forward" size={14} color={Colors.brand.primary} />
                </TouchableOpacity>
            </View>

            {/* ── Lista de partidos ── */}
            {matches.map((match) => (
                <ProgrammedMatchCard
                    key={match.id}
                    match={match}
                    permissions={permissions}
                    onPress={() => {
                        router.push(routes.private.matchRoutes.programmed.detail(match.id) as never);
                    }}
                    onStartMatch={() => onStartMatch?.(match.id)}
                />
            ))}
        </View>
    );
}