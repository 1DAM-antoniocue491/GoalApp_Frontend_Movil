/**
 * CheckEmailScreen - Paso 2 del flujo de recuperación de contraseña
 *
 * Confirma al usuario que el correo ha sido enviado.
 * Permite continuar al formulario de nueva contraseña (mock).
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { Button } from '@/src/shared/components/ui/Button';
import { AppLogo } from '@/src/shared/components/ui/AppLogo';
import { routes } from '@/src/shared/config/routes';

export default function CheckEmailScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Email pasado como param desde forgot-password
    const { email } = useLocalSearchParams<{ email: string }>();

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: Colors.bg.surface1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
        >
            <View
                style={{
                    flex: 1,
                    paddingTop: insets.top + theme.spacing.md,
                    paddingHorizontal: theme.spacing.lg,
                    paddingBottom: theme.spacing.xl,
                    alignItems: 'center',
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

                {/* Logo */}
                <AppLogo />

                {/* Icono sobre fondo circular */}
                <View
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: Colors.bg.surface2,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: theme.spacing.xl,
                    }}
                >
                    <Ionicons name="mail-outline" size={40} color={Colors.brand.accent} />
                </View>

                {/* Título */}
                <Text
                    style={{
                        color: Colors.text.primary,
                        fontSize: theme.fontSize.xxl,
                        fontWeight: '600',
                        textAlign: 'center',
                        marginBottom: theme.spacing.sm,
                    }}
                >
                    Revisa tu correo
                </Text>

                {/* Descripción */}
                <Text
                    style={{
                        color: Colors.text.secondary,
                        fontSize: theme.fontSize.sm,
                        textAlign: 'center',
                        lineHeight: 20,
                        paddingHorizontal: theme.spacing.md,
                        marginBottom: theme.spacing.xs,
                    }}
                >
                    Hemos enviado las instrucciones de recuperación a
                </Text>
                <Text
                    style={{
                        color: Colors.text.primary,
                        fontSize: theme.fontSize.sm,
                        fontWeight: '600',
                        textAlign: 'center',
                        marginBottom: theme.spacing.xl,
                    }}
                >
                    {email ?? ''}
                </Text>

                {/* Nota reenvío (mock estático) */}
                <Text
                    style={{
                        color: Colors.text.secondary,
                        fontSize: theme.fontSize.xs,
                        textAlign: 'center',
                        marginBottom: theme.spacing.xxl,
                    }}
                >
                    ¿No recibiste el correo?{' '}
                    <Text style={{ color: Colors.brand.accent }}>Reenviar</Text>
                </Text>

                {/* CTA principal — mock: navega directo a reset-password */}
                <View style={{ width: '100%', marginBottom: theme.spacing.lg }}>
                    <Button
                        label="Continuar"
                        onPress={() => router.push(routes.public.auth.resetPassword)}
                    />
                </View>

                {/* Link volver al login */}
                <TouchableOpacity
                    onPress={() => router.replace(routes.public.auth.login)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Text style={{ color: Colors.brand.accent, fontSize: theme.fontSize.sm }}>
                        Volver al inicio de sesión
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
