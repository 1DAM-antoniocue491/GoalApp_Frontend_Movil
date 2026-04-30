/**
 * ResetPasswordScreen - Paso 3 del flujo de recuperación de contraseña
 *
 * El usuario introduce su nueva contraseña y la confirma.
 * Reglas: mínimo 8 caracteres, una mayúscula, un número, confirmación igual.
 * Al guardar correctamente vuelve al login.
 * Conecta con la API real de GoalApp.
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { PasswordField } from '@/src/shared/components/ui/PasswordField';
import { Button } from '@/src/shared/components/ui/Button';
import { AppLogo } from '@/src/shared/components/ui/AppLogo';
import { routes } from '@/src/shared/config/routes';

// Hook de recuperación de contraseña
import { usePasswordRecovery } from '@/src/features/auth/hooks/usePasswordRecovery';

interface PasswordRule {
    label: string;
    passes: boolean;
}

export default function ResetPasswordScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { token } = useLocalSearchParams<{ token: string }>();

    // Hook de recuperación
    const { resetPasswordWithToken, error, isLoading } = usePasswordRecovery();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Reglas de validación
    const rules: PasswordRule[] = [
        { label: 'Mínimo 8 caracteres', passes: password.length >= 8 },
        { label: 'Una letra mayúscula', passes: /[A-Z]/.test(password) },
        { label: 'Un número', passes: /[0-9]/.test(password) },
        {
            label: 'Las contraseñas coinciden',
            passes: confirmPassword.length > 0 && password === confirmPassword,
        },
    ];

    // El botón solo se habilita cuando todas las reglas pasan
    const allRulesPassed = rules.every((r) => r.passes);

    async function handleSave() {
        if (!allRulesPassed) return;

        try {
            await resetPasswordWithToken(token, password);
            Alert.alert(
                '¡Contraseña actualizada!',
                'Tu contraseña ha sido cambiada correctamente. Inicia sesión con tu nueva contraseña.',
                [
                    {
                        text: 'Ir al login',
                        // replace limpia el stack del flujo de recuperación
                        onPress: () => router.replace(routes.public.auth.login),
                    },
                ]
            );
        } catch (err) {
            Alert.alert(
                'Error',
                error || 'No se pudo actualizar la contraseña'
            );
        }
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: Colors.bg.surface1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                style={{ flex: 1, backgroundColor: Colors.bg.surface1 }}
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View
                    style={{
                        flex: 1,
                        paddingTop: insets.top + theme.spacing.md,
                        paddingHorizontal: theme.spacing.lg,
                        paddingBottom: theme.spacing.xl,
                    }}
                >
                    {/* Botón volver */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={{ alignSelf: 'flex-start', marginBottom: theme.spacing.xl }}
                    >
                        <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
                    </TouchableOpacity>

                    {/* Logo + cabecera */}
                    <View style={{ alignItems: 'center' }}>
                        <AppLogo />
                        <Text
                            style={{
                                color: Colors.text.primary,
                                fontSize: theme.fontSize.xxl,
                                fontWeight: '600',
                                marginBottom: theme.spacing.sm,
                                textAlign: 'center',
                            }}
                        >
                            Nueva contraseña
                        </Text>
                        <Text
                            style={{
                                color: Colors.text.secondary,
                                fontSize: theme.fontSize.sm,
                                textAlign: 'center',
                                marginBottom: theme.spacing.xl,
                            }}
                        >
                            Crea una contraseña segura para tu cuenta.
                        </Text>
                    </View>

                    {/* Campos */}
                    <View
                        style={{
                            backgroundColor: Colors.bg.surface1,
                            borderRadius: theme.borderRadius.xl,
                            padding: theme.spacing.xl,
                            gap: theme.spacing.lg,
                            marginBottom: theme.spacing.lg,
                        }}
                    >
                        <PasswordField
                            label="Nueva contraseña"
                            value={password}
                            onChangeText={setPassword}
                            placeholder="••••••••"
                        />
                        <PasswordField
                            label="Confirmar contraseña"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="••••••••"
                        />
                    </View>

                    {/* Reglas de validación */}
                    <View
                        style={{
                            backgroundColor: Colors.bg.surface2,
                            borderRadius: theme.borderRadius.lg,
                            padding: theme.spacing.lg,
                            gap: theme.spacing.sm,
                            marginBottom: theme.spacing.xl,
                        }}
                    >
                        {rules.map((rule) => (
                            <View
                                key={rule.label}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}
                            >
                                <Ionicons
                                    name={rule.passes ? 'checkmark-circle' : 'ellipse-outline'}
                                    size={16}
                                    // Verde si pasa, gris si no
                                    color={rule.passes ? Colors.semantic.success : Colors.text.disabled}
                                />
                                <Text
                                    style={{
                                        fontSize: theme.fontSize.xs,
                                        color: rule.passes ? Colors.text.primary : Colors.text.secondary,
                                    }}
                                >
                                    {rule.label}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* CTA */}
                    <Button
                        label="Guardar contraseña"
                        isLoading={isLoading}
                        onPress={handleSave}
                        disabled={!allRulesPassed}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
