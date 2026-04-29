/**
 * ProgrammedMatchCard.tsx
 *
 * Tarjeta compacta para un partido programado (próximo).
 * Fuente de verdad visual para partidos programados en toda la app.
 *
 * RESPONSABILIDAD: Renderizado de una fila de partido próximo.
 * Incluye equipos, fecha/hora y botón de acción según permisos.
 *
 * PERMISOS:
 * El botón "Iniciar" solo aparece si permissions.canStartMatch === true.
 * La lógica de permisos no está hardcodeada aquí — viene siempre del padre.
 *
 * POR QUÉ `style` EN VEZ DE `className` EN LOS BADGES DE EQUIPO:
 * - `backgroundColor: color + '22'` (transparencia dinámica) no es
 *   expresable con clases estáticas de Tailwind.
 * - `borderColor: color` dinámico tampoco tiene equivalente estático.
 * - El resto de layout usa `style` inline para consistencia dentro del componente.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { UpcomingMatchData } from '@/src/shared/types/dashboard.types';
// DashboardPermissions vive en dashboard — esta card la consume como contrato externo
import type { DashboardPermissions } from '@/src/features/dashboard/services/dashboardService';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ProgrammedMatchCardProps {
    match: UpcomingMatchData;
    permissions: DashboardPermissions;
    onPress: () => void;
    onStartMatch?: () => void;
}

// ---------------------------------------------------------------------------
// Regla de negocio: ventana de inicio — solo se puede iniciar si faltan ≤60 min
// ---------------------------------------------------------------------------

/** Mapa de mes abreviado (ES) → índice JS (0-based) */
const MONTH_MAP: Record<string, number> = {
  ENE: 0, FEB: 1, MAR: 2, ABR: 3, MAY: 4, JUN: 5,
  JUL: 6, AGO: 7, SEP: 8, OCT: 9, NOV: 10, DIC: 11,
};

/**
 * Devuelve true si el partido está dentro de la ventana de 1 hora.
 * Regla: now >= matchTime - 60 min
 * Devuelve false si la fecha no puede parsearse (conservador: no permite iniciar).
 * Asume el año actual; si la fecha ya pasó este año, intenta el siguiente.
 */
function canStartMatchNow(day: string, month: string, time: string): boolean {
  if (!day || !month || !time) return false;
  const monthIndex = MONTH_MAP[month.toUpperCase()];
  if (monthIndex === undefined) return false;
  const [hStr, mStr] = time.split(':');
  const hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr, 10);
  if (isNaN(hours) || isNaN(minutes)) return false;

  const now = new Date();
  const matchDate = new Date(now.getFullYear(), monthIndex, parseInt(day, 10), hours, minutes, 0);

  // Si ya pasó hace más de 2 horas este año, asumir que es del año siguiente
  if (matchDate.getTime() < now.getTime() - 2 * 60 * 60 * 1000) {
    matchDate.setFullYear(now.getFullYear() + 1);
  }

  return now.getTime() >= matchDate.getTime() - 60 * 60 * 1000;
}

// ---------------------------------------------------------------------------
// Sub-componente privado: badge circular con la inicial del equipo
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
// Componente principal
// ---------------------------------------------------------------------------

export function ProgrammedMatchCard({
    match,
    permissions,
    onPress,
    onStartMatch,
}: ProgrammedMatchCardProps) {
    const homeColor = match.homeColor ?? '#A1A1AA';
    const awayColor = match.awayColor ?? '#C4F135';

    // Regla de negocio: el partido solo puede iniciarse dentro de la ventana de 1 hora
    const startAllowed = canStartMatchNow(match.day, match.month, match.time);

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
                    <View style={{ marginTop: 6 }}>
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation?.();
                                if (startAllowed) onStartMatch?.();
                            }}
                            disabled={!startAllowed}
                            style={{
                                alignSelf: 'flex-start',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 5,
                                // Color según disponibilidad
                                backgroundColor: startAllowed ? '#C4F135' : '#2A2A35',
                                paddingHorizontal: 12,
                                paddingVertical: 5,
                                borderRadius: 999,
                            }}
                        >
                            <Ionicons
                                name="play-circle-outline"
                                size={13}
                                color={startAllowed ? '#0F0F13' : '#52525B'}
                            />
                            <Text style={{
                                color: startAllowed ? '#0F0F13' : '#52525B',
                                fontSize: 12,
                                fontWeight: '700',
                            }}>
                                Iniciar
                            </Text>
                        </TouchableOpacity>
                        {/* Ayuda discreta cuando el partido aún no está en ventana */}
                        {!startAllowed && (
                            <Text style={{ color: '#52525B', fontSize: 10, marginTop: 3 }}>
                                Disponible 1 hora antes
                            </Text>
                        )}
                    </View>
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
