/**
 * LiveMatchCard.tsx
 *
 * Tarjeta hero "EN VIVO" con efecto de estadio mediante gradientes.
 * Fuente de verdad visual para partidos en vivo en toda la app.
 *
 * RESPONSABILIDAD: Renderizado de un único partido en vivo.
 * Los permisos de acción (registrar evento, finalizar) los recibe como prop
 * desde el padre, que los obtiene de dashboardService.
 *
 * ACCIONES POR ROL:
 *   admin / field_delegate → muestra botones de acción (registrar evento, finalizar)
 *   coach                  → solo botón "Ver plantillas"
 *   player                 → solo botón "Ver plantillas"
 *
 * COLORES DE EQUIPO:
 * Proceden de LiveMatchData.homeColor / awayColor, que a su vez se mapean
 * desde Team.primaryColor en data.ts. Cuando la feature Teams tenga logos
 * reales, el escudo SVG se reemplaza por <Image> sin modificar el layout.
 *
 * POR QUÉ `StyleSheet.absoluteFill` EN VEZ DE `className`:
 * - LinearGradient necesita un estilo de posición absoluta con fill completo.
 * - `StyleSheet.absoluteFill` es el patrón canónico de React Native para eso.
 * - No existe equivalente en NativeWind que sea fiable en todas las versiones.
 */

import React, { useEffect, useRef } from 'react';
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
// DashboardPermissions vive en dashboard — esta card la consume como contrato externo
import type { DashboardPermissions } from '@/src/features/dashboard/services/dashboardService';

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
}

// ---------------------------------------------------------------------------
// Sub-componente: escudo de equipo con inicial y color corporativo
// ---------------------------------------------------------------------------

interface TeamShieldProps {
    /** Inicial del equipo: "B" para Betis, "S" para Sevilla, etc. */
    letter: string;
    /** Color primario corporativo del equipo (Team.primaryColor) */
    primaryColor: string;
}

function TeamShield({ letter, primaryColor }: TeamShieldProps) {
    return (
        <View
            style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                // Borde con el color corporativo del equipo — efecto de escudo real
                borderWidth: 2,
                borderColor: primaryColor,
                // Fondo oscuro para que el borde contraste
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
// Sub-componente: botón de acción secundario
// ---------------------------------------------------------------------------

interface ActionButtonProps {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    /** Si true, el botón tiene fondo sólido #C4F135 (acción primaria) */
    primary?: boolean;
}

function ActionButton({ label, icon, onPress, primary = false }: ActionButtonProps) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                // Botón primario: fondo amarillo-verde de la marca
                // Botón secundario: borde con transparencia sobre el gradiente
                backgroundColor: primary ? '#C4F135' : 'rgba(255,255,255,0.1)',
                borderWidth: primary ? 0 : 1,
                borderColor: 'rgba(255,255,255,0.2)',
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
}: LiveMatchCardProps) {
    const router = useRouter();

    // Colores de equipo con fallback seguro si no llegan del mock/API
    const homeColor = match.homeColor ?? '#FFFFFF';
    const awayColor = match.awayColor ?? '#C4F135';

    // Iniciales de equipo para el escudo SVG (hasta que lleguen logos reales)
    const homeLetter = match.homeShieldLetter ?? match.homeTeam.charAt(0);
    const awayLetter = match.awayShieldLetter ?? match.awayTeam.charAt(0);

    // Pulso animado para el indicador "EN VIVO"
    const pulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 0.2, duration: 600, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const handleCardPress = () => {
        // Navega al detalle del partido usando la ruta semántica
        // router.push(routes.private.matches.detail(match.id) as never);
    };

    return (
        <Pressable
            onPress={handleCardPress}
            style={{ marginHorizontal: 10, marginTop: 8, borderRadius: 20, overflow: 'hidden' }}
        >
            {/* ── Gradiente verde oscuro: efecto cesped/estadio ── */}
            {/*
       * LinearGradient necesita absoluteFill para cubrir todo el contenedor.
       * No es posible hacer esto con className en NativeWind de forma fiable.
       */}
            <LinearGradient
                colors={['#0A1A0A', '#111F0E', '#162B12', '#0D1A0A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            {/* ── Borde sutil con el brand color ── */}
            <View
                style={[
                    StyleSheet.absoluteFill,
                    {
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: 'rgba(196, 241, 53, 0.2)',
                    },
                ]}
            />

            {/* ── Halo central (luz de estadio simulada) ── */}
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

            {/* ── Contenido ── */}
            <View style={{ padding: 18 }}>

                {/* Indicador EN VIVO */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
                    <Animated.View
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#C4F135',
                            marginRight: 7,
                            opacity: pulse,
                        }}
                    />
                    <Text
                        style={{
                            color: '#C4F135',
                            fontSize: 11,
                            fontWeight: '700',
                            letterSpacing: 1.5,
                        }}
                    >
                        EN VIVO
                    </Text>
                </View>

                {/* Marcador principal: escudo local — resultado — escudo visitante */}
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
                        {/* Badge de minuto con el brand color */}
                        <View
                            style={{
                                backgroundColor: '#C4F135',
                                paddingHorizontal: 12,
                                paddingVertical: 4,
                                borderRadius: 999,
                                marginBottom: 8,
                            }}
                        >
                            <Text style={{ color: '#0F0F13', fontSize: 12, fontWeight: '800' }}>
                                {match.minute}'
                            </Text>
                        </View>

                        {/* Marcador — Display 42px Bold (mayor que Display del design system para énfasis) */}
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

                {/* Footer: liga y estadio */}
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

                {/* Banner "finaliza el partido" — solo para roles con canEndMatch */}
                {permissions.canEndMatch && (
                    <View
                        style={{
                            marginTop: 14,
                            borderRadius: 12,
                            padding: 10,
                            backgroundColor: 'rgba(196, 241, 53, 0.08)',
                            borderWidth: 1,
                            borderColor: 'rgba(196, 241, 53, 0.25)',
                        }}
                    >
                        <Text style={{ color: '#C4F135', fontSize: 12, fontWeight: '700', textAlign: 'center' }}>
                            Finaliza el partido y escoge el MVP
                        </Text>
                    </View>
                )}

                {/* ── Botones de acción por rol ── */}
                {(permissions.canRegisterEvent || permissions.canViewLineups) && (
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
                                onPress={() => router.push(routes.private.matchRoutes.live.squad(match.id) as never)}
                            />
                        )}
                        {permissions.canRegisterEvent && (
                            <ActionButton
                                label="Añadir evento"
                                icon="add-circle-outline"
                                primary
                                onPress={() => onRegisterEvent?.(match.id)}
                            />
                        )}
                        {permissions.canEndMatch && (
                            <ActionButton
                                label="Finalizar"
                                icon="checkmark-circle-outline"
                                onPress={() => onEndMatch?.(match.id)}
                            />
                        )}
                    </View>
                )}
            </View>
        </Pressable>
    );
}
