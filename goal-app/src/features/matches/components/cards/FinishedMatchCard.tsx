/**
 * FinishedMatchCard.tsx
 *
 * Tarjeta de resultado para un partido finalizado.
 * Fuente de verdad visual para partidos finalizados en toda la app.
 *
 * DIFERENCIAS CON LiveMatchCard:
 * - Sin gradiente verde ni animación de pulso (el partido ya terminó)
 * - Badge "FINALIZADO" estático en gris
 * - Score prominente pero sin minuto activo
 * - Sin botones de acción operativos — el tap lleva al detalle completo
 * - Diseño más compacto y sobrio
 *
 * COLORES:
 * Proceden de FinishedMatchData.homeColor / awayColor.
 * Fallback a gris neutro si no llegan del mock/API.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { FinishedMatchData } from '@/src/shared/types/dashboard.types';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface FinishedMatchCardProps {
    match: FinishedMatchData;
    onPress: () => void;
}

// ---------------------------------------------------------------------------
// Sub-componente privado: escudo con inicial y color corporativo
// ---------------------------------------------------------------------------

function TeamShield({ letter, color }: { letter: string; color: string }) {
    return (
        <View
            style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                borderWidth: 1.5,
                borderColor: color,
                // Fondo tintado suave con el color del equipo
                backgroundColor: color + '18',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Text style={{ color, fontSize: 18, fontWeight: 'bold' }}>{letter}</Text>
        </View>
    );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function FinishedMatchCard({ match, onPress }: FinishedMatchCardProps) {
    const homeColor = match.homeColor ?? Colors.text.secondary;
    const awayColor = match.awayColor ?? Colors.text.secondary;
    const homeLetter = match.homeShieldLetter ?? match.homeTeam.charAt(0);
    const awayLetter = match.awayShieldLetter ?? match.awayTeam.charAt(0);

    // Determina el resultado desde la perspectiva local: victoria, derrota o empate
    const isHomeWin = match.homeScore > match.awayScore;
    const isAwayWin = match.awayScore > match.homeScore;

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => ({
                backgroundColor: pressed ? Colors.bg.surface2 : Colors.bg.surface1,
                borderRadius: theme.borderRadius.lg,
                padding: 16,
                marginBottom: 10,
            })}
        >
            {/* ── Fila superior: jornada + badge FINALIZADO + fecha ── */}
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 14,
                }}
            >
                <Text style={{ color: Colors.text.disabled, fontSize: 11 }}>
                    {match.round}
                </Text>

                {/* Badge FINALIZADO — gris neutro, sin pulso */}
                <View
                    style={{
                        backgroundColor: Colors.bg.surface2,
                        paddingHorizontal: 5,
                        paddingVertical: 3,
                        borderRadius: 999,
                    }}
                >
                    <Text
                        style={{
                            color: Colors.text.disabled,
                            fontSize: 10,
                            fontWeight: '700',
                            letterSpacing: 1,
                        }}
                    >
                        FINALIZADO
                    </Text>
                </View>

                <Text style={{ color: Colors.text.disabled, fontSize: 11 }}>
                    {match.date}
                </Text>
            </View>

            {/* ── Marcador: escudo local — resultado — escudo visitante ── */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                {/* Equipo local */}
                <View style={{ alignItems: 'center', flex: 1, gap: 6 }}>
                    <TeamShield letter={homeLetter} color={homeColor} />
                    <Text
                        style={{
                            color: isHomeWin ? Colors.text.primary : Colors.text.secondary,
                            fontSize: 12,
                            fontWeight: isHomeWin ? '700' : '400',
                            textAlign: 'center',
                        }}
                        numberOfLines={2}
                    >
                        {match.homeTeam}
                    </Text>
                </View>

                {/* Marcador central */}
                <View style={{ alignItems: 'center', flex: 1 }}>
                    <Text
                        style={{
                            color: Colors.text.primary,
                            fontSize: 36,
                            fontWeight: 'bold',
                            letterSpacing: -1,
                            lineHeight: 42,
                        }}
                    >
                        {match.homeScore} - {match.awayScore}
                    </Text>
                </View>

                {/* Equipo visitante */}
                <View style={{ alignItems: 'center', flex: 1, gap: 6 }}>
                    <TeamShield letter={awayLetter} color={awayColor} />
                    <Text
                        style={{
                            color: isAwayWin ? Colors.text.primary : Colors.text.secondary,
                            fontSize: 12,
                            fontWeight: isAwayWin ? '700' : '400',
                            textAlign: 'center',
                        }}
                        numberOfLines={2}
                    >
                        {match.awayTeam}
                    </Text>
                </View>
            </View>

            {/* ── Footer: liga y estadio ── */}
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginTop: 14,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: Colors.bg.surface2,
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="trophy-outline" size={11} color={Colors.text.disabled} />
                    <Text style={{ color: Colors.text.disabled, fontSize: 11 }}>
                        {match.leagueName}
                    </Text>
                </View>
                {match.venue && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="location-outline" size={11} color={Colors.text.disabled} />
                        <Text style={{ color: Colors.text.disabled, fontSize: 11 }}>
                            {match.venue}
                        </Text>
                    </View>
                )}
            </View>
        </Pressable>
    );
}
