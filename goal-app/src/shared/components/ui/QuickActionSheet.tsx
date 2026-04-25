import React, { useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Modal,
    StyleSheet,
    Pressable,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    runOnJS,
    Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/src/shared/constants/colors';
import { routes } from '@/src/shared/config/routes';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface QuickAction {
    id: string;
    label: string;
    hint: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    iconBg: string;
    onPress: () => void;
}

interface QuickActionSheetProps {
    visible: boolean;
    onClose: () => void;
    /** Callback que dispara la apertura del modal Nuevo Partido desde el layout padre */
    onAddMatch?: () => void;
    /** Callback que dispara la apertura del modal Nuevo Equipo desde el layout padre */
    onAddTeam?: () => void;
    /** Callback que dispara la apertura del modal Crear Calendario desde el layout padre */
    onCreateCalendar?: () => void;
}

// ─── Constantes de animación ─────────────────────────────────────────────────

const ANIM_DURATION = 280;
const SHEET_HEIGHT = 420; // altura aproximada del sheet

// ─── Componente ──────────────────────────────────────────────────────────────

export function QuickActionSheet({ visible, onClose, onAddMatch, onAddTeam, onCreateCalendar }: QuickActionSheetProps) {
    const router = useRouter();

    // Valores animados
    const translateY = useSharedValue(SHEET_HEIGHT);
    const backdropOpacity = useSharedValue(0);

    // Sincronizar animación con visibilidad
    React.useEffect(() => {
        if (visible) {
            backdropOpacity.value = withTiming(1, { duration: ANIM_DURATION });
            translateY.value = withSpring(0, {
                damping: 22,
                stiffness: 200,
                mass: 0.8,
            });
        } else {
            backdropOpacity.value = withTiming(0, {
                duration: ANIM_DURATION,
                easing: Easing.out(Easing.ease),
            });
            translateY.value = withTiming(SHEET_HEIGHT, {
                duration: ANIM_DURATION,
                easing: Easing.out(Easing.ease),
            });
        }
    }, [visible]);

    // Navegar y cerrar
    const navigate = useCallback(
        (route: string) => {
            onClose();
            // Pequeño delay para que la animación de cierre empiece antes del push
            setTimeout(() => router.push(route as any), 120);
        },
        [onClose, router]
    );

    // Definición de acciones — añade o reordena aquí sin tocar el JSX
    const actions: QuickAction[] = [
        {
            id: 'match',
            label: 'Añadir partido',
            hint: 'Crea un nuevo partido',
            icon: 'football-outline',
            iconColor: Colors.brand.primary,
            iconBg: 'rgba(200,245,88,0.12)',
            // Cierra el sheet primero; el layout abre el modal tras la animación de cierre
            onPress: () => {
                onClose();
                setTimeout(() => onAddMatch?.(), 220);
            },
        },
        {
            id: 'calendar',
            label: 'Crear calendario',
            hint: 'Organiza tu temporada',
            icon: 'calendar-outline',
            iconColor: Colors.brand.secondary,
            iconBg: 'rgba(0,180,216,0.12)',
            // Cierra el sheet primero; el layout abre el modal tras la animación de cierre
            onPress: () => {
                onClose();
                setTimeout(() => onCreateCalendar?.(), 220);
            },
        },
        {
            id: 'team',
            label: 'Añadir equipo',
            hint: 'Registra un nuevo equipo',
            icon: 'people-outline',
            iconColor: Colors.brand.accent,
            iconBg: 'rgba(24,162,251,0.12)',
            // Cierra el sheet primero; el layout abre el modal tras la animación de cierre
            onPress: () => {
                onClose();
                setTimeout(() => onAddTeam?.(), 220);
            },
        },
        {
            id: 'users',
            label: 'Gestionar usuarios',
            hint: 'Añade o elimina miembros del equipo',
            icon: 'person-add-outline',
            iconColor: Colors.semantic.success,
            iconBg: 'rgba(50,215,75,0.12)',
            // Navega a la pantalla de Usuarios y roles
            onPress: () => navigate(routes.private.league.users),
        },
    ];

    // Estilos animados
    const sheetStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: backdropOpacity.value,
    }));

    if (!visible) return null;

    return (
        <Modal transparent statusBarTranslucent animationType="none" visible={visible}>
            {/* Backdrop */}
            <TouchableWithoutFeedback onPress={onClose}>
                <Animated.View style={[styles.backdrop, backdropStyle]} />
            </TouchableWithoutFeedback>

            {/* Sheet */}
            <Animated.View style={[styles.sheet, sheetStyle]}>
                {/* Handle */}
                <View style={styles.handle} />

                {/* Título de sección */}
                <Text style={styles.sectionTitle}>ACCIÓN RÁPIDA</Text>

                {/* Grid 2×2 */}
                <View style={styles.grid}>
                    {actions.map((action) => (
                        <Pressable
                            key={action.id}
                            style={({ pressed }) => [
                                styles.card,
                                pressed && styles.cardPressed,
                            ]}
                            onPress={action.onPress}
                            android_ripple={{ color: 'rgba(255,255,255,0.05)', borderless: false }}
                        >
                            {/* Icono */}
                            <View style={[styles.iconWrap, { backgroundColor: action.iconBg }]}>
                                <Ionicons name={action.icon} size={20} color={action.iconColor} />
                            </View>
                            {/* Texto */}
                            <Text style={styles.cardLabel}>{action.label}</Text>
                            <Text style={styles.cardHint}>{action.hint}</Text>
                            {/* Flecha decorativa */}
                            <Ionicons
                                name="arrow-forward-outline"
                                size={14}
                                color={Colors.text.disabled}
                                style={styles.arrow}
                            />
                        </Pressable>
                    ))}
                </View>

                {/* Cancelar */}
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
                    <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
            </Animated.View>
        </Modal>
    );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.bg.surface1,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderTopWidth: 0.5,
        borderColor: Colors.bg.surface2,
        paddingHorizontal: 16,
        paddingBottom: 36, // safe area — sustituir por useSafeAreaInsets si el proyecto lo usa
    },
    handle: {
        width: 36,
        height: 4,
        backgroundColor: Colors.bg.surface2,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 11,
        letterSpacing: 0.8,
        color: Colors.text.disabled,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 16,
    },
    card: {
        // Ocupa exactamente la mitad del ancho menos el gap
        width: '48.5%',
        backgroundColor: Colors.bg.base,
        borderRadius: 16,
        borderWidth: 0.5,
        borderColor: Colors.bg.surface2,
        padding: 14,
        gap: 8,
    },
    cardPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.97 }],
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text.primary,
        lineHeight: 18,
    },
    cardHint: {
        fontSize: 11,
        color: Colors.text.disabled,
        lineHeight: 15,
    },
    arrow: {
        position: 'absolute',
        top: 12,
        right: 12,
    },
    cancelBtn: {
        height: 48,
        backgroundColor: Colors.bg.base,
        borderRadius: 14,
        borderWidth: 0.5,
        borderColor: Colors.bg.surface2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelText: {
        fontSize: 14,
        color: Colors.text.secondary,
    },
});