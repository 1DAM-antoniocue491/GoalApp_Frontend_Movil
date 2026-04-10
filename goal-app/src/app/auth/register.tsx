/**
 * RegisterScreen - Pantalla de registro
 *
 * Esta pantalla:
 * - Permite crear un usuario mock
 * - Usa la misma estructura visual que login para mantener consistencia
 * - Mantiene el fondo oscuro estable durante toda la transición
 * - Usa safe area real para colocar mejor la cabecera
 * - Anima el mensaje de error de contraseña de forma suave
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Animated,
    Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Componentes reutilizables de la UI de autenticación
import { AppLogo } from '../../components/ui/AppLogo';
import { AuthTabs } from '../../components/ui/AuthTabs';
import { FormField } from '../../components/ui/FormField';
import { Button } from '../../components/ui/Button';

// Estilos compartidos del proyecto
import { styles } from '../../styles';

// Colores del sistema de diseño
import { Colors } from '../../constants/colors';

// Tipado del formulario de registro
import type { RegisterForm } from '../../types/auth';

// Helper mock para crear usuario
import { createUser } from '../../data/data';

export default function RegisterScreen() {
    // Router para navegación
    const router = useRouter();

    // Insets reales del dispositivo
    const insets = useSafeAreaInsets();

    // Fondo oscuro consistente
    const screenBackground = Colors.bg.surface1;

    // Espaciado superior consistente con login
    const topSpacing = Math.max(insets.top + 6, 18);

    // Estado del formulario
    const [form, setForm] = useState<RegisterForm>({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    // Estado de loading del botón
    const [isLoading, setIsLoading] = useState(false);

    // Animación de entrada de cabecera
    const headerAnim = useRef(new Animated.Value(0)).current;

    // Animación de entrada del formulario
    const cardAnim = useRef(new Animated.Value(0)).current;

    // Animación de entrada del botón
    const buttonAnim = useRef(new Animated.Value(0)).current;

    // Animación del mensaje de error de contraseñas
    const passwordErrorAnim = useRef(new Animated.Value(0)).current;

    // Secuencia de entrada escalonada
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

    // Helper para actualizar un campo concreto
    function handleChange(field: keyof RegisterForm, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    // Comprobamos si ambas contraseñas coinciden
    const passwordsMatch = form.password === form.confirmPassword;

    // Validación mínima del formulario
    const isFormValid =
        form.name.length > 0 &&
        form.email.length > 0 &&
        form.password.length >= 6 &&
        passwordsMatch;

    // Mostramos error solo cuando ya ha escrito en el segundo campo
    const showPasswordError =
        form.confirmPassword.length > 0 && !passwordsMatch;

    // Animamos la entrada y salida del mensaje de error
    useEffect(() => {
        Animated.timing(passwordErrorAnim, {
            toValue: showPasswordError ? 1 : 0,
            duration: 180,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();
    }, [showPasswordError, passwordErrorAnim]);

    // Lógica de registro
    async function handleRegister() {
        // Si el formulario no es válido, no continuamos
        if (!isFormValid) return;

        // Activamos loading
        setIsLoading(true);

        try {
            // Creamos el usuario mock
            const user = createUser(form.name, form.email, form.password);

            // Si se crea correctamente, notificamos y navegamos
            if (user) {
                Alert.alert(
                    'Registro exitoso',
                    'Tu cuenta ha sido creada. Redirigiendo al onboarding...',
                    [
                        {
                            text: 'OK',
                            // Replace para no dejar register detrás en el stack
                            onPress: () => router.replace('/onboarding'),
                        },
                    ]
                );
            }
        } finally {
            // Quitamos loading siempre
            setIsLoading(false);
        }
    }

    // Animación de la cabecera
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

    // Animación de la card del formulario
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

    // Animación del botón CTA
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

    // Animación del texto de error
    const passwordErrorAnimatedStyle = {
        opacity: passwordErrorAnim,
        transform: [
            {
                translateY: passwordErrorAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-4, 0],
                }),
            },
        ],
    };

    return (
        // KeyboardAvoidingView protege el formulario frente al teclado
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: screenBackground }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* ScrollView para permitir desplazamiento si el contenido crece */}
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
                {/* Contenedor principal */}
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
                        {/* Logo */}
                        <AppLogo />

                        {/* Título */}
                        <Text className={`${styles.titleText} mb-4`}>Registrarse</Text>

                        {/* Tabs visuales */}
                        <AuthTabs activeTab="register" />
                    </Animated.View>

                    {/* Card del formulario */}
                    <Animated.View
                        style={cardAnimatedStyle}
                        className={`${styles.formCard} flex-1 mx-0 mt-4 mb-5 pt-8 pb-8`}
                    >
                        {/* Campo nombre */}
                        <FormField
                            label="Nombre"
                            icon={<Ionicons name="person-outline" size={18} color="#8A9AA4" />}
                            placeholder="John Doe"
                            value={form.name}
                            onChangeText={(v) => handleChange('name', v)}
                            autoCapitalize="words"
                            autoComplete="name"
                        />

                        {/* Campo email */}
                        <FormField
                            label="Gmail"
                            icon={<Ionicons name="mail-outline" size={18} color="#8A9AA4" />}
                            placeholder="john.doe@goalapp.com"
                            value={form.email}
                            onChangeText={(v) => handleChange('email', v)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                        />

                        {/* Campo contraseña */}
                        <FormField
                            label="Contraseña"
                            icon={<Ionicons name="lock-closed-outline" size={18} color="#8A9AA4" />}
                            placeholder="••••••••"
                            value={form.password}
                            onChangeText={(v) => handleChange('password', v)}
                            secureTextEntry
                        />

                        {/* Campo repetir contraseña */}
                        <FormField
                            label="Repetir Contraseña"
                            icon={<Ionicons name="lock-closed-outline" size={18} color="#8A9AA4" />}
                            placeholder="••••••••"
                            value={form.confirmPassword}
                            onChangeText={(v) => handleChange('confirmPassword', v)}
                            secureTextEntry
                        />

                        {/* Error animado cuando las contraseñas no coinciden */}
                        <Animated.View style={passwordErrorAnimatedStyle}>
                            <Text
                                className={`text-xs mt-1 ${showPasswordError ? 'text-[#FF4534]' : 'text-transparent'
                                    }`}
                            >
                                Las contraseñas no coinciden
                            </Text>
                        </Animated.View>
                    </Animated.View>

                    {/* Botón CTA animado */}
                    <Animated.View style={buttonAnimatedStyle}>
                        <Button
                            label="Registrarse"
                            isLoading={isLoading}
                            onPress={handleRegister}
                            disabled={!isFormValid}
                        />
                    </Animated.View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}