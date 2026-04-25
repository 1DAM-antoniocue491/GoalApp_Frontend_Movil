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
 * POR QUÉ `style` EN VEZ DE `className` EN LOS BADGES DE EQUIPO:
 * - `backgroundColor: color + '22'` (transparencia dinámica) no es
 *   expresable con clases estáticas de Tailwind.
 * - `borderColor: color` dinámico tampoco tiene equivalente estático.
 * - El resto de layout (flex, gap, padding) usa `style` inline para
 *   mantener consistencia y legibilidad dentro del mismo componente.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { routes } from '@/src/shared/config/routes';
import type { UpcomingMatchData } from '@/src/shared/types/dashboard.types';
import type { DashboardPermissions } from '../services/dashboardService';

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
// Sub-componente: badge circular con la inicial del equipo
// ---------------------------------------------------------------------------

function TeamBadge({ letter, color }: { letter: string; color: string }) {
    return (
        <View
            style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                // Color con alpha 22 (hex) ≈ 13% de opacidad — fondo tintado del equipo
                backgroundColor: color + '22',
                borderWidth: 1.5,
                borderColor: color,
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Text style={{ color, fontSize: 12, fontWeight: '700' }}>{letter}</Text>
        </View>
    );
}

// ---------------------------------------------------------------------------
// Sub-componente: fila individual de partido próximo
// ---------------------------------------------------------------------------

interface MatchRowProps {
    match: UpcomingMatchData;
    permissions: DashboardPermissions;
    onPress: () => void;
    onStartMatch?: () => void;
}

function UpcomingMatchRow({ match, permissions, onPress, onStartMatch }: MatchRowProps) {
    const homeColor = match.homeColor ?? '#A1A1AA';
    const awayColor = match.awayColor ?? '#C4F135';

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.75}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#1C1C22', // Surface L1 del design system
                borderRadius: 12,
                padding: 14,
                marginBottom: 8,
            }}
        >
            {/* ── Columna de equipos ── */}
            <View style={{ flex: 1, gap: 6 }}>
                {/* Equipo local */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <TeamBadge letter={match.homeTeam.charAt(0)} color={homeColor} />
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '500' }}>
                        {match.homeTeam}
                    </Text>
                </View>

                {/* Equipo visitante */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <TeamBadge letter={match.awayTeam.charAt(0)} color={awayColor} />
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '500' }}>
                        {match.awayTeam}
                    </Text>
                </View>

                {/* Jornada y estadio — Caption 12px */}
                <Text style={{ color: '#52525B', fontSize: 12, marginTop: 2 }}>
                    {match.round} · {match.venue}
                </Text>

                {/* Botón Iniciar — solo para roles con canStartMatch */}
                {permissions.canStartMatch && (
                    <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation?.(); // Evita propagar al onPress del row
                            onStartMatch?.();
                        }}
                        style={{
                            alignSelf: 'flex-start',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 5,
                            marginTop: 6,
                            backgroundColor: '#C4F135',
                            paddingHorizontal: 12,
                            paddingVertical: 5,
                            borderRadius: 999,
                        }}
                    >
                        <Ionicons name="play-circle-outline" size={13} color="#0F0F13" />
                        <Text style={{ color: '#0F0F13', fontSize: 12, fontWeight: '700' }}>
                            Iniciar
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* ── Divisor vertical ── */}
            <View
                style={{
                    width: 1,
                    height: 56,
                    backgroundColor: '#2A2A35', // Surface L2 del design system
                    marginHorizontal: 14,
                }}
            />

            {/* ── Fecha y hora ── */}
            <View style={{ alignItems: 'center', minWidth: 52 }}>
                {/* Número del día — Title 24px Bold */}
                <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', lineHeight: 28 }}>
                    {match.day}
                </Text>
                {/* Mes — Caption uppercase */}
                <Text style={{ color: '#A1A1AA', fontSize: 11, textTransform: 'uppercase' }}>
                    {match.month}
                </Text>
                {/* Hora — color brand para destacar */}
                <Text style={{ color: '#C4F135', fontSize: 13, fontWeight: '600', marginTop: 3 }}>
                    {match.time}
                </Text>
            </View>
        </TouchableOpacity>
    );
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
                <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
                    Próximos partidos
                </Text>
                {/* Empty state: no hay partidos programados */}
                <View
                    style={{
                        backgroundColor: '#1C1C22',
                        borderRadius: 12,
                        padding: 24,
                        alignItems: 'center',
                    }}
                >
                    <Ionicons name="calendar-outline" size={32} color="#52525B" />
                    <Text style={{ color: '#52525B', fontSize: 14, marginTop: 8 }}>
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
                <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600' }}>
                    Próximos partidos
                </Text>

                {/* Enlace "Ver calendario" → navega a la tab de calendario */}
                <TouchableOpacity
                    onPress={() => {
                        // router.push(routes.private.tabs.calendar as never)
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}
                >
                    <Text style={{ color: '#C4F135', fontSize: 13, fontWeight: '500' }}>
                        Ver calendario
                    </Text>
                    <Ionicons name="chevron-forward" size={14} color="#C4F135" />
                </TouchableOpacity>
            </View>

            {/* ── Lista de partidos ── */}
            {matches.map((match) => (
                <UpcomingMatchRow
                    key={match.id}
                    match={match}
                    permissions={permissions}
                    onPress={() => {
                        // router.push(routes.private.matches.detail(match.id) as never)
                    }}
                    onStartMatch={() => onStartMatch?.(match.id)}
                />
            ))}
        </View>
    );
}