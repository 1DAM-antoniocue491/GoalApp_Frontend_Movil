/**
 * ForgotPasswordScreen - Paso 1 del flujo de recuperación de contraseña
 *
 * El usuario introduce su email y solicita el enlace de recuperación.
 * Al continuar navega a check-email con el email como parámetro.
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { FormField } from '@/src/shared/components/ui/FormField';
import { Button } from '@/src/shared/components/ui/Button';
import { AppLogo } from '@/src/shared/components/ui/AppLogo';
import { routes } from '@/src/shared/config/routes';

// Validación básica de formato email
function isValidEmail(email: string): boolean {
    const trimmed = email.trim();
    return trimmed.includes('@') && trimmed.split('@')[1]?.includes('.') === true;
}

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const canSubmit = isValidEmail(email);

    async function handleSend() {
        if (!canSubmit) return;
        setIsLoading(true);
        // Mock: simula latencia de red
        await new Promise((r) => setTimeout(r, 800));
        setIsLoading(false);
        router.push({
            pathname: routes.public.auth.resetPassword,
            params: { email: email.trim() },
        });
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
                            Recuperar contraseña
                        </Text>
                        <Text
                            style={{
                                color: Colors.text.secondary,
                                fontSize: theme.fontSize.sm,
                                textAlign: 'center',
                                lineHeight: 20,
                                marginBottom: theme.spacing.xl,
                                paddingHorizontal: theme.spacing.md,
                            }}
                        >
                            Introduce el email de tu cuenta y te enviaremos las instrucciones para recuperar tu contraseña.
                        </Text>
                    </View>

                    {/* Formulario */}
                    <View
                        style={{
                            backgroundColor: Colors.bg.surface1,
                            borderRadius: theme.borderRadius.xl,
                            padding: theme.spacing.xl,
                            gap: theme.spacing.lg,
                            marginBottom: theme.spacing.xl,
                        }}
                    >
                        <FormField
                            label="Email"
                            icon={<Ionicons name="mail-outline" size={18} color="#8A9AA4" />}
                            placeholder="john.doe@goalapp.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                        />
                    </View>

                    {/* CTA */}
                    <Button
                        label="Enviar instrucciones"
                        isLoading={isLoading}
                        onPress={handleSend}
                        disabled={!canSubmit}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
