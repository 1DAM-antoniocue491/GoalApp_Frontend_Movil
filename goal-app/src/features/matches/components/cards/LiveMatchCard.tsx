/**
 * LiveMatchCard.tsx
 *
 * Tarjeta hero "EN VIVO" con efecto de estadio mediante gradientes.
 * Fuente de verdad visual para partidos en vivo en toda la app.
 *
 * TEMPORIZADOR:
 * - Si `match.startedAt` está disponible, el minuto se calcula en tiempo real
 *   desde ese timestamp (Date.now() - startedAt) cada 30 segundos.
 * - Sin startedAt, usa `match.minute` como snapshot de fallback.
 * - El minuto se limita a `match.duration` (o 90 si no llega).
 *
 * ESTADO "TIEMPO AGOTADO":
 * - Cuando displayedMinute >= duration se activa `isTimeUp`.
 * - Se bloquea "Añadir evento" y se muestra el banner de finalización.
 * - "Finalizar" pasa a ser el botón primario visible.
 *
 * POR QUÉ `StyleSheet.absoluteFill` EN VEZ DE `className`:
 * - LinearGradient necesita un estilo de posición absoluta con fill completo.
 * - `StyleSheet.absoluteFill` es el patrón canónico de React Native para eso.
 * - No existe equivalente en NativeWind que sea fiable en todas las versiones.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    StyleSheet,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { routes } from '@/src/shared/config/routes';
import type { LiveMatchData } from '@/src/shared/types/dashboard.types';
import type { DashboardPermissions } from '@/src/features/dashboard/services/dashboardService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Calcula el minuto transcurrido desde startedAt. Devuelve un valor entre 1 y limit. */
function computeLiveMinute(
    startedAt: string | null | undefined,
    fallback: number,
    limit: number,
): number {
    if (startedAt) {
        const started = new Date(startedAt).getTime();
        if (!Number.isNaN(started)) {
            const elapsed = Math.floor((Date.now() - started) / 60000) + 1;
            return Math.max(1, Math.min(limit, elapsed));
        }
    }
    return Math.max(1, Math.min(limit, fallback));
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LiveMatchCardProps {
    match: LiveMatchData;
    /** Permisos del usuario actual — vienen de getDashboardPermissions(role) */
    permissions: DashboardPermissions;
    /** Callback cuando el usuario pulsa "Registrar evento" */
    onRegisterEvent?: (matchId: string) => void;
    /** Callback cuando el usuario pulsa "Finalizar partido" */
    onEndMatch?: (matchId: string) => void;
    actionsDisabled?: boolean;
}

// ---------------------------------------------------------------------------
// Sub-componente: escudo de equipo con inicial y color corporativo
// ---------------------------------------------------------------------------

interface TeamShieldProps {
    letter: string;
    primaryColor: string;
}

function TeamShield({ letter, primaryColor }: TeamShieldProps) {
    return (
        <View
            style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                borderWidth: 2,
                borderColor: primaryColor,
                backgroundColor: 'rgba(28, 28, 34, 0.8)',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Text style={{ color: primaryColor, fontSize: 24, fontWeight: 'bold' }}>
                {letter}
            </Text>
        </View>
    );
}

// ---------------------------------------------------------------------------
// Sub-componente: botón de acción
// ---------------------------------------------------------------------------

interface ActionButtonProps {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    primary?: boolean;
    disabled?: boolean;
}

function ActionButton({ label, icon, onPress, primary = false, disabled = false }: ActionButtonProps) {
    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: disabled ? 'rgba(255,255,255,0.06)' : primary ? '#C4F135' : 'rgba(255,255,255,0.1)',
                borderWidth: primary ? 0 : 1,
                borderColor: 'rgba(255,255,255,0.2)',
                opacity: disabled ? 0.45 : 1,
            }}
        >
            <Ionicons
                name={icon}
                size={14}
                color={primary ? '#0F0F13' : '#FFFFFF'}
            />
            <Text
                style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: primary ? '#0F0F13' : '#FFFFFF',
                }}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function LiveMatchCard({
    match,
    permissions,
    onRegisterEvent,
    onEndMatch,
    actionsDisabled = false,
}: LiveMatchCardProps) {
    const router = useRouter();

    const homeColor = match.homeColor ?? '#FFFFFF';
    const awayColor = match.awayColor ?? '#C4F135';
    const homeLetter = match.homeShieldLetter ?? match.homeTeam.charAt(0);
    const awayLetter = match.awayShieldLetter ?? match.awayTeam.charAt(0);

    const safeDuration = useMemo(() => {
        const d = Number(match.duration ?? 90);
        return Number.isFinite(d) && d > 0 ? d : 90;
    }, [match.duration]);

    // ── Temporizador ──
    // Estado inicial calculado ya desde startedAt para evitar flash con valor 1.
    const [localMinute, setLocalMinute] = useState(() =>
        computeLiveMinute(match.startedAt, match.minute ?? 1, safeDuration),
    );

    // Resincronizar si cambia el partido o el timestamp de inicio.
    useEffect(() => {
        setLocalMinute(computeLiveMinute(match.startedAt, match.minute ?? 1, safeDuration));
    }, [match.id, match.startedAt, match.minute, safeDuration]);

    // Recalcular cada 30 s para mantener el minuto actualizado en pantalla.
    useEffect(() => {
        const id = setInterval(() => {
            setLocalMinute(computeLiveMinute(match.startedAt, match.minute ?? 1, safeDuration));
        }, 30000);
        return () => clearInterval(id);
    }, [match.id, match.startedAt, safeDuration]);

    const displayedMinute = useMemo(
        () => Math.max(1, Math.min(safeDuration, localMinute)),
        [safeDuration, localMinute],
    );

    /** true cuando el partido ha llegado a la duración configurada */
    const isTimeUp = displayedMinute >= safeDuration;

    // ── Pulso EN VIVO ──
    const pulse = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 0.2, duration: 600, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const handleCardPress = useCallback(() => {
        // router.push(routes.private.matches.detail(match.id) as never);
    }, []);

    return (
        <Pressable
            onPress={handleCardPress}
            style={{ marginHorizontal: 10, marginTop: 8, borderRadius: 20, overflow: 'hidden' }}
        >
            {/* Gradiente verde oscuro: efecto césped/estadio */}
            <LinearGradient
                colors={['#0A1A0A', '#111F0E', '#162B12', '#0D1A0A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            {/* Borde sutil con el brand color */}
            <View
                style={[
                    StyleSheet.absoluteFill,
                    {
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: isTimeUp
                            ? 'rgba(255, 180, 0, 0.35)'
                            : 'rgba(196, 241, 53, 0.2)',
                    },
                ]}
            />

            {/* Halo central */}
            <View
                style={{
                    position: 'absolute',
                    top: '15%',
                    left: '20%',
                    right: '20%',
                    height: 100,
                    backgroundColor: 'rgba(196, 241, 53, 0.04)',
                    borderRadius: 50,
                }}
            />

            {/* Contenido */}
            <View style={{ padding: 18 }}>

                {/* Indicador EN VIVO */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
                    <Animated.View
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: isTimeUp ? '#FFB400' : '#C4F135',
                            marginRight: 7,
                            opacity: pulse,
                        }}
                    />
                    <Text
                        style={{
                            color: isTimeUp ? '#FFB400' : '#C4F135',
                            fontSize: 11,
                            fontWeight: '700',
                            letterSpacing: 1.5,
                        }}
                    >
                        EN VIVO
                    </Text>
                </View>

                {/* Marcador: escudo local — resultado — escudo visitante */}
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    {/* Equipo local */}
                    <View style={{ alignItems: 'center', flex: 1 }}>
                        <TeamShield letter={homeLetter} primaryColor={homeColor} />
                        <Text
                            style={{
                                color: '#FFFFFF',
                                fontWeight: '600',
                                fontSize: 13,
                                marginTop: 8,
                                textAlign: 'center',
                            }}
                            numberOfLines={2}
                        >
                            {match.homeTeam}
                        </Text>
                    </View>

                    {/* Centro: minuto + marcador */}
                    <View style={{ alignItems: 'center', flex: 1.4 }}>
                        {/* Badge de minuto */}
                        <View
                            style={{
                                backgroundColor: isTimeUp ? '#FFB400' : '#C4F135',
                                paddingHorizontal: 12,
                                paddingVertical: 4,
                                borderRadius: 999,
                                marginBottom: 8,
                            }}
                        >
                            <Text style={{ color: '#0F0F13', fontSize: 12, fontWeight: '800' }}>
                                {displayedMinute}'
                            </Text>
                        </View>

                        {/* Marcador */}
                        <Text
                            style={{
                                color: '#FFFFFF',
                                fontSize: 44,
                                fontWeight: 'bold',
                                lineHeight: 50,
                                letterSpacing: -1,
                            }}
                        >
                            {match.homeScore} - {match.awayScore}
                        </Text>
                    </View>

                    {/* Equipo visitante */}
                    <View style={{ alignItems: 'center', flex: 1 }}>
                        <TeamShield letter={awayLetter} primaryColor={awayColor} />
                        <Text
                            style={{
                                color: '#FFFFFF',
                                fontWeight: '600',
                                fontSize: 13,
                                marginTop: 8,
                                textAlign: 'center',
                            }}
                            numberOfLines={2}
                        >
                            {match.awayTeam}
                        </Text>
                    </View>
                </View>

                {/* Footer: estadio */}
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        marginTop: 16,
                        paddingTop: 14,
                        borderTopWidth: 1,
                        borderTopColor: '#ffffff12',
                    }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center' }}>
                        <Ionicons name="location-outline" size={12} color="#A1A1AA" />
                        <Text style={{ color: '#A1A1AA', fontSize: 12 }}>{match.venue}</Text>
                    </View>
                </View>

                {/* Banner de tiempo agotado */}
                {isTimeUp && (
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                            marginTop: 14,
                            paddingHorizontal: 14,
                            paddingVertical: 10,
                            borderRadius: 12,
                            backgroundColor: 'rgba(255, 180, 0, 0.12)',
                            borderWidth: 1,
                            borderColor: 'rgba(255, 180, 0, 0.35)',
                        }}
                    >
                        <Ionicons name="timer-outline" size={16} color="#FFB400" />
                        <Text style={{ color: '#FFB400', fontSize: 13, fontWeight: '700', flex: 1 }}>
                            Finaliza el partido y elige el MVP
                        </Text>
                    </View>
                )}

                {/* Botones de acción por rol */}
                {(permissions.canRegisterEvent || permissions.canViewLineups || permissions.canEndMatch) && (
                    <View
                        style={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            gap: 8,
                            marginTop: 14,
                        }}
                    >
                        {permissions.canViewLineups && (
                            <ActionButton
                                label="Ver plantillas"
                                icon="people-outline"
                                disabled={actionsDisabled}
                                onPress={() => {
                                    if (!actionsDisabled) router.push(routes.private.matchRoutes.live.squad(match.id) as never);
                                }}
                            />
                        )}
                        {permissions.canRegisterEvent && (
                            <ActionButton
                                label="Añadir evento"
                                icon="add-circle-outline"
                                primary={!isTimeUp}
                                // Bloqueado cuando el tiempo se ha agotado
                                disabled={actionsDisabled || isTimeUp}
                                onPress={() => {
                                    if (!actionsDisabled && !isTimeUp) onRegisterEvent?.(match.id);
                                }}
                            />
                        )}
                        {permissions.canEndMatch && (
                            <ActionButton
                                label="Finalizar"
                                icon="checkmark-circle-outline"
                                // Pasa a ser primario cuando el tiempo se agota
                                primary={isTimeUp}
                                disabled={actionsDisabled}
                                onPress={() => {
                                    if (!actionsDisabled) onEndMatch?.(match.id);
                                }}
                            />
                        )}
                    </View>
                )}
            </View>
        </Pressable>
    );
}
