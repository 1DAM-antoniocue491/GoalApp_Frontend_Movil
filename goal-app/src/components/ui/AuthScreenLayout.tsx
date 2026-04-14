import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Animated,
    Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLogo } from './AppLogo';
import { AuthTabs } from './AuthTabs';
import { Colors } from '../../constants/colors';
import { styles } from '../../styles';

interface AuthScreenLayoutProps {
    /** Título de la pantalla (ej: "Iniciar Sesión", "Registrarse") */
    title: string;
    /** Tab activa para AuthTabs ("login" o "register") */
    activeTab: 'login' | 'register';
    /** Botón CTA que se renderiza animado al final */
    ctaButton: React.ReactNode;
    /** Campos del formulario que se renderizan dentro de la card */
    children: React.ReactNode;
}

export function AuthScreenLayout({
    title,
    activeTab,
    ctaButton,
    children,
}: AuthScreenLayoutProps) {
    // Insets reales del dispositivo
    const insets = useSafeAreaInsets();

    // Fondo oscuro consistente
    const screenBackground = Colors.bg.surface1;

    // Espaciado superior consistente:
    // sube la cabecera para que no parezca "caída" y respeta notch/status bar
    const topSpacing = Math.max(insets.top + 6, 18);

    // Animación de entrada para la cabecera
    const headerAnim = useRef(new Animated.Value(0)).current;

    // Animación de entrada para la card del formulario
    const cardAnim = useRef(new Animated.Value(0)).current;

    // Animación de entrada para el botón CTA
    const buttonAnim = useRef(new Animated.Value(0)).current;

    // Al montar, lanzamos secuencia escalonada para entrada suave
    useEffect(() => {
        Animated.stagger(110, [
            Animated.timing(headerAnim, {
                toValue: 1,
                duration: 320,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(cardAnim, {
                toValue: 1,
                duration: 340,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(buttonAnim, {
                toValue: 1,
                duration: 300,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();
    }, [headerAnim, cardAnim, buttonAnim]);

    // Estilo animado de la cabecera: fade + pequeño desplazamiento vertical
    const headerAnimatedStyle = {
        opacity: headerAnim,
        transform: [
            {
                translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                }),
            },
        ],
    };

    // Estilo animado de la card: entra un poco después que la cabecera
    const cardAnimatedStyle = {
        opacity: cardAnim,
        transform: [
            {
                translateY: cardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [22, 0],
                }),
            },
        ],
    };

    // Estilo animado del botón: entra el último para completar la secuencia
    const buttonAnimatedStyle = {
        opacity: buttonAnim,
        transform: [
            {
                translateY: buttonAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [26, 0],
                }),
            },
        ],
    };

    return (
        // KeyboardAvoidingView evita que el teclado tape los inputs
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: screenBackground }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* ScrollView para dispositivos pequeños y teclados abiertos */}
            <ScrollView
                style={{ flex: 1, backgroundColor: screenBackground }}
                contentContainerStyle={{
                    flexGrow: 1,
                    backgroundColor: screenBackground,
                }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
            >
                {/* Contenedor principal de la pantalla */}
                <View
                    className={styles.screenContent}
                    style={{
                        backgroundColor: screenBackground,
                        justifyContent: 'flex-start',
                        paddingTop: topSpacing,
                        paddingBottom: 24,
                    }}
                >
                    {/* Cabecera animada */}
                    <Animated.View style={headerAnimatedStyle} className="items-center">
                        {/* Logo de la aplicación */}
                        <AppLogo />

                        {/* Título principal */}
                        <Text className={`${styles.titleText} mb-4`}>{title}</Text>

                        {/* Tabs visuales de auth */}
                        <AuthTabs activeTab={activeTab} />
                    </Animated.View>

                    {/* Card del formulario */}
                    <Animated.View
                        style={cardAnimatedStyle}
                        className={`${styles.formCard} mx-0 mt-4 mb-5 pt-8 pb-8`}
                    >
                        {children}
                    </Animated.View>

                    {/* Botón CTA animado */}
                    <Animated.View style={buttonAnimatedStyle}>
                        {ctaButton}
                    </Animated.View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
