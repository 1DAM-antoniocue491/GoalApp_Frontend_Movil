/**
 * LoginScreen - Pantalla de inicio de sesión
 *
 * Esta pantalla:
 * - Muestra el acceso por email y contraseña
 * - Navega al onboarding al iniciar sesión correctamente
 * - Conecta con la API real de GoalApp
 */

import React, { useState } from 'react';
import { Text, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { routes } from '@/src/shared/config/routes';

// Componentes reutilizables de la UI de autenticación
import { AuthScreenLayout } from '@/src/shared/components/ui/AuthScreenLayout';
import { FormField } from '@/src/shared/components/ui/FormField';
import { PasswordField } from '@/src/shared/components/ui/PasswordField';
import { Button } from '@/src/shared/components/ui/Button';

// Hook de autenticación
import { useAuth } from '@/src/app/auth/hooks/useAuth';

// Tipado del formulario de login
import type { LoginForm } from '@/src/shared/types/auth';

export default function LoginScreen() {
    // Router de Expo para navegación
    const router = useRouter();

    // Hook de autenticación
    const { login, error, clearError } = useAuth();

    // Estado principal del formulario
    const [form, setForm] = useState<LoginForm>({
        email: '',
        password: '',
    });

    // Estado de loading para el botón
    const [isLoading, setIsLoading] = useState(false);

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
        clearError();

        try {
            // Login con API real
            await login(form.email, form.password);

            // Si llegamos aquí, el login fue exitoso
            router.replace(routes.private.onboarding);
        } catch (err) {
            // Mostrar error del backend
            Alert.alert(
                'Error de inicio de sesión',
                error || 'Credenciales incorrectas'
            );
        } finally {
            // Quitamos loading siempre
            setIsLoading(false);
        }
    }

    return (
        <AuthScreenLayout
            title="Iniciar Sesión"
            activeTab="login"
            ctaButton={
                <Button
                    label="Iniciar Sesión"
                    isLoading={isLoading}
                    onPress={handleLogin}
                    disabled={!isFormValid}
                />
            }
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
            <PasswordField
                label="Contraseña"
                value={form.password}
                onChangeText={(v) => handleChange('password', v)}
                placeholder="••••••••"
            />

            {/* Acción secundaria — navega al flujo de recuperación */}
            <TouchableOpacity
                onPress={() => router.push(routes.public.auth.forgotPassword)}
                className="self-end"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <Text className="text-[#18A2FB] text-sm">
                    ¿Olvidó la contraseña?
                </Text>
            </TouchableOpacity>
        </AuthScreenLayout>
    );
}
