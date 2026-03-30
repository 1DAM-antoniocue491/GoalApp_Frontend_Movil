import { View, Text, ScrollView, KeyboardAvoidingView, Platform, } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppLogo } from '../../components/ui/AppLogo';
import { AuthTabs } from '../../components/ui/AuthTabs';
import { FormField } from '../../components/ui/FormField';
import { Button } from '../../components/ui/Button';
import { styles } from '../../styles';
import type { LoginForm } from '../../types/auth';
import React, { useState } from 'react';

export default function LoginScreen() {
    const [form, setForm] = React.useState<LoginForm>(
        {
            email: '',
            password: '',
        });

    function handleChange(field: keyof LoginForm, value: string) {
        setForm(prev => ({ ...prev, [field]: value }));
    }
    const [isLoading, setIsLoading] = useState(false);
    const isFormValid =
        form.email.length > 0 &&
        form.password.length >= 6;

    async function handleLogin() {
        if (!isFormValid) return;
        setIsLoading(true);
        try {
            // TODO: conectar con authService.register(form)
            console.log('Registro con:', form);
        } finally {
            setIsLoading(false);
        }
    }
    return (
        // KeyboardAvoidingView: Para empujar el diseño hacia arriba para que los inputs sigan siendo visibles 
        // mientras se va escribiendo en los inputs de más abajo.
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
                style={{ flex: 1 }}
                keyboardShouldPersistTaps="handled"
            >

                <View className={styles.screenContent}>
                    {/* Muestra en el tabs el botón de login activo */}
                    <View className="items-center pt-5">
                        <AppLogo />
                        <Text className={`${styles.titleText} mb-6`}>Iniciar Sesión</Text>
                        <AuthTabs activeTab="login" />
                    </View>
                    {/*Mostramos los campos de email y de contraseña*/}
                    <View className={`${styles.formCard} my-4 pt-10 pb-10 `}>
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
                        <FormField
                            label="Contraseña"
                            icon={<Ionicons name="lock-closed-outline" size={18} color="#8A9AA4" />}
                            placeholder="••••••••"
                            value={form.password}
                            onChangeText={(v) => handleChange('password', v)}
                            secureTextEntry
                        />
                        <Text className="self-end text-blue-500 ">¿Olvidó la contraseña?</Text>
                    </View>
                    {/*Botón de iniciar Sesión*/}
                    <Button
                        label="Iniciar Sesión"
                        isLoading={isLoading}
                        onPress={handleLogin}
                        disabled={!isFormValid}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}


