// Misma estructura que login, pero con 4 campos.
// ¿Por qué reutilizar los mismos componentes?
// FormField, Button, AuthTabs y AppLogo son idénticos visualmente.
// Solo cambia el contenido, no la estructura — eso es composición de componentes.

import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppLogo } from '../../components/ui/AppLogo';
import { AuthTabs } from '../../components/ui/AuthTabs';
import { FormField } from '../../components/ui/FormField';
import { Button } from '../../components/ui/Button';
import { styles } from '../../styles';
import type { RegisterForm } from '../../types/auth';

export default function RegisterScreen() {
    const [form, setForm] = useState<RegisterForm>({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [isLoading, setIsLoading] = useState(false);

    // [  field: keyof RegisterForm significa:
    // El campo que vamos a actualizar tiene que ser obligatoriamente
    // una de las propiedades que existen en RegisterForm" 
    // (por ejemplo: 'name', 'email', 'password').

    // usar una función con "prev" (que representa el estado previo exacto en ese milisegundo)
    // es una práctica mucho más segura en React.
    // Esta copiar y pegar" todo lo que ya tenía en el formulario

    // '[field]'. Evalúa qué palabra está guardada dentro de la variable field 
    // y usa esa palabra como llave" ].
    function handleChange(field: keyof RegisterForm, value: string) {
        setForm(prev => ({ ...prev, [field]: value }));
    }

    // Validación básica antes de enviar
    // Para dar feedback inmediato al usuario sin esperar una request de red.
    const passwordsMatch = form.password === form.confirmPassword;
    const isFormValid =
        form.name.length > 0 &&
        form.email.length > 0 &&
        form.password.length >= 6 &&
        passwordsMatch;

    async function handleRegister() {
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
                keyboardShouldPersistTaps="handled">
                
                <View className={styles.screenContent}>

                    {/* Muestra en el tabs el botón de registro activo */}
                    <View className="items-center pt-5">
                        <AppLogo />
                        <Text className={`${styles.titleText} mb-6`}>Registrarse</Text>
                        <AuthTabs activeTab="register" />
                    </View>

                    <View className={`${styles.formCard} flex-1 mx-0 my-4`}>
                        <FormField
                            label="Nombre"
                            icon={<Ionicons name="person-outline" size={18} color="#8A9AA4" />}
                            placeholder="John Doe"
                            value={form.name}
                            onChangeText={(v) => handleChange('name', v)}
                            autoCapitalize="words"
                            autoComplete="name"
                        />

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

                        <FormField
                            label="Repetir Contraseña"
                            icon={<Ionicons name="lock-closed-outline" size={18} color="#8A9AA4" />}
                            placeholder="••••••••"
                            value={form.confirmPassword}
                            onChangeText={(v) => handleChange('confirmPassword', v)}
                            secureTextEntry
                        />

                        {/* Feedback visual si las contraseñas no coinciden */}
                        {form.confirmPassword.length > 0 && !passwordsMatch && (
                            <Text className="text-[#FF4534] text-xs mt-1">
                                Las contraseñas no coinciden
                            </Text>
                        )}
                    </View>

                    <Button
                        label="Registrarse"
                        isLoading={isLoading}
                        onPress={handleRegister}
                        disabled={!isFormValid}
                    />

                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
