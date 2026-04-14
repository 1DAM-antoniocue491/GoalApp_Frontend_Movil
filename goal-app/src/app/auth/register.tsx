/**
 * RegisterScreen - Pantalla de registro
 *
 * Esta pantalla:
 * - Permite crear un usuario mock
 * - Anima el mensaje de error de contraseña de forma suave
 */

import React, { useEffect, useRef, useState } from 'react';
import { Text, Animated, Easing, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Componentes reutilizables de la UI de autenticación
import { AuthScreenLayout } from '../../components/ui/AuthScreenLayout';
import { FormField } from '../../components/ui/FormField';
import { PasswordField } from '../../components/ui/PasswordField';
import { Button } from '../../components/ui/Button';

// Tipado del formulario de registro
import type { RegisterForm } from '../../types/auth';

// Helper mock para crear usuario
import { createUser } from '../../data/data';

export default function RegisterScreen() {
    // Router para navegación
    const router = useRouter();

    // Estado del formulario
    const [form, setForm] = useState<RegisterForm>({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    // Estado de loading del botón
    const [isLoading, setIsLoading] = useState(false);

    // Animación del mensaje de error de contraseñas
    const passwordErrorAnim = useRef(new Animated.Value(0)).current;

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
        <AuthScreenLayout
            title="Registrarse"
            activeTab="register"
            ctaButton={
                <Button
                    label="Registrarse"
                    isLoading={isLoading}
                    onPress={handleRegister}
                    disabled={!isFormValid}
                />
            }
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
            <PasswordField
                label="Contraseña"
                value={form.password}
                onChangeText={(v) => handleChange('password', v)}
                placeholder="••••••••"
            />

            {/* Campo repetir contraseña */}
            <PasswordField
                label="Repetir Contraseña"
                value={form.confirmPassword}
                onChangeText={(v) => handleChange('confirmPassword', v)}
                placeholder="••••••••"
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
        </AuthScreenLayout>
    );
}
