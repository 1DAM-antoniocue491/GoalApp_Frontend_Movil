/**
 * LoginScreen - Pantalla de inicio de sesión
 *
 * Esta pantalla:
 * - Muestra el acceso por email y contraseña
 * - Usa animaciones suaves de entrada
 * - Mantiene el fondo oscuro consistente para evitar flashes
 * - Usa safe area real para que la cabecera no quede demasiado abajo
 * - Navega al onboarding al iniciar sesión correctamente
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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

// Tipado del formulario de login
import type { LoginForm } from '../../types/auth';

// Helpers y datos mock para validar credenciales
import { validateCredentials, GENERIC_PASSWORD } from '../../data/data';

export default function LoginScreen() {
    // Router de Expo para navegación
    const router = useRouter();

    // Insets reales del dispositivo para colocar mejor la pantalla
    const insets = useSafeAreaInsets();

    // Fondo oscuro consistente de la pantalla
    const screenBackground = Colors.bg.surface1;

    // Espaciado superior consistente:
    // sube la cabecera para que no parezca "caída" y respeta notch/status bar
    const topSpacing = Math.max(insets.top + 6, 18);

    // Estado principal del formulario
    const [form, setForm] = useState<LoginForm>({
        email: '',
        password: '',
    });

    // Estado de loading para el botón
    const [isLoading, setIsLoading] = useState(false);

    // Animación de entrada para la cabecera
    const headerAnim = useRef(new Animated.Value(0)).current;

    // Animación de entrada para la card del formulario
    const cardAnim = useRef(new Animated.Value(0)).current;

    // Animación de entrada para el botón CTA
    const buttonAnim = useRef(new Animated.Value(0)).current;

    // Al montar la pantalla, lanzamos una secuencia escalonada
    // para que el contenido entre de forma suave y profesional
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

    // Helper para actualizar cualquier campo del formulario
    function handleChange(field: keyof LoginForm, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    // Validación mínima para habilitar el botón
    const isFormValid = form.email.length > 0 && form.password.length >= 6;

    // Lógica de login
    async function handleLogin() {
        // Si el formulario no es válido, no hacemos nada
        if (!isFormValid) return;

        // Activamos loading
        setIsLoading(true);

        try {
            // Validamos contra los datos mock
            const user = validateCredentials(form.email, form.password);

            // Si el usuario existe, login correcto
            if (user) {
                // Usamos replace para evitar apilar login debajo del onboarding
                // y hacer la navegación más limpia
                router.replace('/onboarding');
            } else {
                // Si las credenciales son incorrectas, mostramos una alerta
                Alert.alert(
                    'Error de inicio de sesión',
                    `Credenciales inválidas.\n\nUsa una cuenta de prueba:\n• Email: juan@goalapp.com\n• Password: ${GENERIC_PASSWORD}`
                );
            }
        } finally {
            // Quitamos loading siempre
            setIsLoading(false);
        }
    }

    // Estilo animado de la cabecera:
    // entra con fade y un pequeño desplazamiento vertical
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

    // Estilo animado de la card:
    // entra un poco después que la cabecera
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

    // Estilo animado del botón:
    // entra el último para completar la secuencia
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
                        <Text className={`${styles.titleText} mb-4`}>Iniciar Sesión</Text>

                        {/* Tabs visuales de auth */}
                        <AuthTabs activeTab="login" />
                    </Animated.View>

                    {/* Card del formulario */}
                    <Animated.View
                        style={cardAnimatedStyle}
                        className={`${styles.formCard} mt-4 mb-5 pt-8 pb-8`}
                    >
                        {/* Campo de email */}
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

                        {/* Campo de contraseña */}
                        <FormField
                            label="Contraseña"
                            icon={<Ionicons name="lock-closed-outline" size={18} color="#8A9AA4" />}
                            placeholder="••••••••"
                            value={form.password}
                            onChangeText={(v) => handleChange('password', v)}
                            secureTextEntry
                        />

                        {/* Acción secundaria */}
                        <Text className="self-end text-[#18A2FB] text-sm">
                            ¿Olvidó la contraseña?
                        </Text>
                    </Animated.View>

                    {/* Botón CTA animado */}
                    <Animated.View style={buttonAnimatedStyle}>
                        <Button
                            label="Iniciar Sesión"
                            isLoading={isLoading}
                            onPress={handleLogin}
                            disabled={!isFormValid}
                        />
                    </Animated.View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}