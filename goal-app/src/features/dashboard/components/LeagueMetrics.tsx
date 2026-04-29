/**
 * LeagueMetrics.tsx
 *
 * Grid 2×2 de métricas generales de la liga.
 * Solo visible para admin (canViewLeagueMetrics = true).
 * El padre (AdminDashboard) ya hace ese guard antes de renderizar este componente.
 *
 * RESPONSABILIDAD: Solo renderizado de las 4 tarjetas.
 * Los datos llegan via props desde AdminDashboard → useDashboardData.
 *
 * POR QUÉ `style` EN VEZ DE `className`:
 * - `position: 'absolute'`, `overflow: 'hidden'`, `minHeight` no tienen
 *   equivalentes exactos en las clases NativeWind del proyecto.
 * - Los porcentajes de ancho ('47%') tampoco son clases disponibles.
 * - Se usa `className` en View simples donde Tailwind cubre exactamente
 *   el espaciado (px-4, mt-2), aprovechando NativeWind para los valores
 *   del spacing scale del design system (4, 8, 16, etc.).
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { LeagueMetricsData } from '@/src/shared/types/dashboard.types';
import { Colors } from '@/src/shared/constants/colors';

// ---------------------------------------------------------------------------
// Definición interna de cada tarjeta
// ---------------------------------------------------------------------------

interface MetricCardConfig {
    label: string;
    value: number;
    /** Nombre del icono de Ionicons */
    icon: keyof typeof Ionicons.glyphMap;
}

// ---------------------------------------------------------------------------
// Tarjeta individual con gradiente oscuro y decoración de fondo
// ---------------------------------------------------------------------------

function MetricCard({ card, index }: { card: MetricCardConfig; index: number }) {
    // Animación de entrada escalonada: cada tarjeta aparece con delay incremental
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 400,
                delay: index * 80, // stagger: 0ms, 80ms, 160ms, 240ms
                useNativeDriver: true,
            }),
            Animated.spring(scale, {
                toValue: 1,
                delay: index * 80,
                useNativeDriver: true,
                tension: 100,
                friction: 8,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={{
                opacity,
                transform: [{ scale }],
                // Anchura del 47% permite 2 columnas con gap de ~12px en un contenedor px-4
                width: '47%',
                minHeight: 110,
                backgroundColor: Colors.bg.surface1,
                borderRadius: 12,           // Medium border radius del design system
                padding: 16,
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            {/* ── Icono decorativo de fondo (opacity baja, da profundidad) ── */}
            {/*
       * `position: 'absolute'` obliga a usar `style` aquí.
       * NativeWind no soporta posicionamiento absoluto con offset negativo.
       */}
            <View
                style={{
                    position: 'absolute',
                    right: -10,
                    bottom: -10,
                    opacity: 0.08,
                }}
            >
                <Ionicons name={card.icon} size={80} color={Colors.brand.primary} />
            </View>

            {/* ── Badge de icono ── */}
            <View
                style={{
                    width: 36,
                    height: 36,
                    backgroundColor: Colors.bg.surface2,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                }}
            >
                <Ionicons name={card.icon} size={18} color={Colors.brand.primary} />
            </View>

            {/* ── Caption ── */}
            {/* Caption 12px — tipografía del design system */}
            <Text style={{ color: Colors.text.secondary, fontSize: 12, lineHeight: 16 }}>
                {card.label}
            </Text>

            {/* ── Valor principal ── */}
            {/* Display 30px / Bold — tipografía del design system */}
            <Text
                style={{
                    color: Colors.text.primary,
                    fontSize: 30,
                    fontWeight: 'bold',
                    lineHeight: 36,
                    marginTop: 4,
                }}
            >
                {card.value}
            </Text>
        </Animated.View>
    );
}

// ---------------------------------------------------------------------------
// Componente exportado
// ---------------------------------------------------------------------------

interface LeagueMetricsProps {
    metrics: Pick<
        LeagueMetricsData,
        'teams' | 'users' | 'scheduledMatches' | 'playedMatches'
    >;
}

export function LeagueMetrics({ metrics }: LeagueMetricsProps) {
    /**
     * La configuración de tarjetas está aquí y no en el padre porque
     * son específicas de este componente. Si cambian los iconos o labels,
     * solo se toca este archivo.
     */
    const cards: MetricCardConfig[] = [
        { label: 'Equipos', value: metrics.teams, icon: 'people-outline' },
        { label: 'Usuarios', value: metrics.users, icon: 'person-outline' },
        { label: 'Partidos programados', value: metrics.scheduledMatches, icon: 'calendar-outline' },
        { label: 'Partidos jugados', value: metrics.playedMatches, icon: 'trophy-outline' },
    ];

    return (
        // `className` válido aquí: flex-row, flex-wrap, px-4, gap-3, mt-4
        // son clases NativeWind que cubren exactamente los valores del spacing scale
        <View className="flex-row flex-wrap px-4 gap-3 mt-4">
            {cards.map((card, i) => (
                <MetricCard key={card.label} card={card} index={i} />
            ))}
        </View>
    );
}