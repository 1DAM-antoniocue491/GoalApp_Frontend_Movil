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
 * REGLA DE PRODUCTO:
 * La barra de "Equipos activos" debe completarse al llegar al MÁXIMO de equipos
 * permitido por la configuración de la liga, no al mínimo requerido.
 * Por eso se prioriza `metrics.maxTeams` como denominador cuando está disponible.
 *
 * ANIMACIÓN:
 * La barra de progreso usa Animated.timing con useNativeDriver: false
 * porque anima la propiedad `width`, que no es compatible con el
 * native driver (solo transform y opacity lo son).
 * Esto es una limitación de React Native, no un bug.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { formatProgress } from '../services/dashboardService';
import type { LeagueMetricsData } from '@/src/shared/types/dashboard.types';
import { Colors } from '@/src/shared/constants/colors';

// ---------------------------------------------------------------------------
// Helpers visuales defensivos
// ---------------------------------------------------------------------------

function clampProgress(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.min(Math.max(value, 0), 1);
}

function safeMetricValue(value: unknown, fallback = 0): number {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric >= 0 ? numeric : fallback;
}

// ---------------------------------------------------------------------------
// Sub-componente: barra de progreso animada
// ---------------------------------------------------------------------------

function AnimatedProgressBar({ progress, delay = 0 }: { progress: number; delay?: number }) {
    // Animamos desde 0 hasta el valor real para dar sensación de carga.
    const widthAnim = useRef(new Animated.Value(0)).current;
    const safeProgress = clampProgress(progress);

    useEffect(() => {
        Animated.timing(widthAnim, {
            toValue: safeProgress,          // valor entre 0 y 1
            duration: 900,
            delay,
            // useNativeDriver: false es OBLIGATORIO para animaciones de `width`.
            // No existe workaround: width no puede animarse en el native thread.
            useNativeDriver: false,
        }).start();
    }, [safeProgress, delay, widthAnim]);

    // Interpolamos el valor numérico (0–1) a porcentaje de string ('0%'–'100%').
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
    /** Texto que sigue al porcentaje, ej: "del máximo", "completado" */
    suffix: string;
    icon: keyof typeof Ionicons.glyphMap;
    animDelay: number;
}

function ProgressCard({ config }: { config: ProgressCardConfig }) {
    const current = safeMetricValue(config.current);
    const total = safeMetricValue(config.total);

    const progress = total > 0 ? clampProgress(current / total) : 0;
    // formatProgress viene del service y debe devolver el porcentaje limitado a 100%.
    const pctLabel = formatProgress(current, total);

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

            {/* Valor actual / objetivo */}
            <Text style={{ color: Colors.text.primary, fontSize: 24, fontWeight: 'bold', marginTop: 4 }}>
                {current}{' '}
                {/* El objetivo en color disabled para reducir peso visual */}
                <Text style={{ color: Colors.text.disabled, fontSize: 16, fontWeight: '400' }}>
                    / {total}
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
        'activeTeams' | 'totalTeams' | 'maxTeams' | 'completedRounds' | 'totalRounds'
    >;
}

export function ProgressMetrics({ metrics }: ProgressMetricsProps) {
    /**
     * Denominador correcto para "Equipos activos".
     *
     * Antes se usaba cualquier valor que llegara como `totalTeams`, que en algunas
     * integraciones podía representar el mínimo requerido de equipos. Eso hacía que
     * la barra se completara demasiado pronto. Ahora se prioriza `maxTeams`.
     */
    const activeTeamsTarget = useMemo(() => {
        const maxTeams = safeMetricValue(metrics.maxTeams);
        const legacyTotalTeams = safeMetricValue(metrics.totalTeams);

        return maxTeams > 0 ? maxTeams : legacyTotalTeams;
    }, [metrics.maxTeams, metrics.totalTeams]);

    const cards: ProgressCardConfig[] = [
        {
            label: 'Equipos activos',
            current: metrics.activeTeams,
            total: activeTeamsTarget,
            suffix: 'del máximo',
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
