/**
 * ProgressMetrics.tsx
 *
 * Tarjetas de progreso inferiores del dashboard del admin.
 * Muestra "Equipos activos" y "Jornadas completadas" con barra animada.
 *
 * RESPONSABILIDAD: Solo renderizado.
 * El formateo del porcentaje usa `formatProgress` de dashboardService
 * para no duplicar lógica de cálculo en el componente.
 *
 * ANIMACIÓN:
 * La barra de progreso usa Animated.timing con useNativeDriver: false
 * porque anima la propiedad `width`, que no es compatible con el
 * native driver (solo transform y opacity lo son).
 * Esto es una limitación de React Native, no un bug.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { formatProgress } from '../services/dashboardService';
import type { LeagueMetricsData } from '@/src/shared/types/dashboard.types';
import { Colors } from '@/src/shared/constants/colors';

// ---------------------------------------------------------------------------
// Sub-componente: barra de progreso animada
// ---------------------------------------------------------------------------

function AnimatedProgressBar({ progress, delay = 0 }: { progress: number; delay?: number }) {
    // Animamos desde 0 hasta el valor real para dar sensación de carga
    const widthAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(widthAnim, {
            toValue: progress,          // valor entre 0 y 1
            duration: 900,
            delay,
            // useNativeDriver: false es OBLIGATORIO para animaciones de `width`
            // No existe workaround: width no puede animarse en el native thread
            useNativeDriver: false,
        }).start();
    }, [progress]);

    // Interpolamos el valor numérico (0–1) a porcentaje de string ('0%'–'100%')
    const widthPercent = widthAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View
            style={{
                height: 4,
                backgroundColor: Colors.bg.surface2, // fondo de la barra vacía
                borderRadius: 999,
                overflow: 'hidden',
                marginTop: 10,
            }}
        >
            <Animated.View
                style={{
                    height: '100%',
                    width: widthPercent,
                    backgroundColor: Colors.brand.primary,
                    borderRadius: 999,
                }}
            />
        </View>
    );
}

// ---------------------------------------------------------------------------
// Sub-componente: tarjeta individual de progreso
// ---------------------------------------------------------------------------

interface ProgressCardConfig {
    label: string;
    current: number;
    total: number;
    /** Texto que sigue al porcentaje, ej: "del total", "completado" */
    suffix: string;
    icon: keyof typeof Ionicons.glyphMap;
    animDelay: number;
}

function ProgressCard({ config }: { config: ProgressCardConfig }) {
    const progress = config.total > 0 ? config.current / config.total : 0;
    // formatProgress viene del service: Math.round(ratio * 100) + '%'
    const pctLabel = formatProgress(config.current, config.total);

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: Colors.bg.surface1,
                borderRadius: 12,
                padding: 14,
            }}
        >
            {/* Badge de icono */}
            <View
                style={{
                    width: 36,
                    height: 36,
                    backgroundColor: Colors.bg.surface2,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                }}
            >
                <Ionicons name={config.icon} size={18} color={Colors.brand.primary} />
            </View>

            {/* Caption */}
            <Text style={{ color: Colors.text.secondary, fontSize: 12 }}>{config.label}</Text>

            {/* Valor actual / total */}
            <Text style={{ color: Colors.text.primary, fontSize: 24, fontWeight: 'bold', marginTop: 4 }}>
                {config.current}{' '}
                {/* El total en color disabled para reducir peso visual */}
                <Text style={{ color: Colors.text.disabled, fontSize: 16, fontWeight: '400' }}>
                    / {config.total}
                </Text>
            </Text>

            {/* Porcentaje con color brand */}
            <Text style={{ color: Colors.brand.primary, fontSize: 12, fontWeight: '600', marginTop: 2 }}>
                {pctLabel} {config.suffix}
            </Text>

            <AnimatedProgressBar progress={progress} delay={config.animDelay} />
        </View>
    );
}

// ---------------------------------------------------------------------------
// Componente exportado
// ---------------------------------------------------------------------------

interface ProgressMetricsProps {
    metrics: Pick<
        LeagueMetricsData,
        'activeTeams' | 'totalTeams' | 'completedRounds' | 'totalRounds'
    >;
}

export function ProgressMetrics({ metrics }: ProgressMetricsProps) {
    const cards: ProgressCardConfig[] = [
        {
            label: 'Equipos activos',
            current: metrics.activeTeams,
            total: metrics.totalTeams,
            suffix: 'del total',
            icon: 'shield-outline',
            animDelay: 200, // la primera barra aparece ligeramente antes
        },
        {
            label: 'Jornadas completadas',
            current: metrics.completedRounds,
            total: metrics.totalRounds,
            suffix: 'completado',
            icon: 'flag-outline',
            animDelay: 350, // la segunda barra con un poco más de delay (stagger)
        },
    ];

    return (
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginTop: 16 }}>
            {cards.map((c) => (
                <ProgressCard key={c.label} config={c} />
            ))}
        </View>
    );
}