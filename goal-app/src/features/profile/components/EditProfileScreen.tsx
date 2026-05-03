/**
 * EditProfileScreen
 *
 * Prefill con datos reales de la API.
 * Email es solo lectura (el backend no permite editarlo).
 * Guardar llama a la API real; si falla, muestra error y no navega.
 */

import React, { useState, useEffect } from 'react';
import {
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from '@/src/shared/styles';
import { Colors } from '@/src/shared/constants/colors';
import { useProfile } from '@/src/features/profile/hooks/useProfile';

/** Genera iniciales a partir del nombre */
function getInitials(name: string): string {
    if (!name.trim()) return '';
    return name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');
}

export function EditProfileScreen() {
    const router = useRouter();
    const { profile, isLoading, isSaving, error, updateProfile } = useProfile();

    // Formulario — prefill cuando lleguen datos
    const [nombre, setNombre] = useState('');
    const [telefono, setTelefono] = useState('');
    const [fechaNacimiento, setFechaNacimiento] = useState('');
    const [genero, setGenero] = useState('');
    const [formError, setFormError] = useState<string | null>(null);

    // Rellenar formulario cuando el perfil cargue
    useEffect(() => {
        if (profile) {
            setNombre(profile.nombre);
            setTelefono(profile.telefono);
            setFechaNacimiento(profile.fechaNacimiento);
            setGenero(profile.genero);
        }
    }, [profile]);

    // Propagar errores del hook al estado local
    useEffect(() => {
        if (error) setFormError(error);
    }, [error]);

    const handleSave = async () => {
        setFormError(null);

        // Validación mínima
        if (nombre.trim().length > 0 && nombre.trim().length < 2) {
            setFormError('El nombre debe tener al menos 2 caracteres');
            return;
        }

        const payload = {
            nombre: nombre.trim() || null,
            telefono: telefono.trim() || null,
            fecha_nacimiento: fechaNacimiento.trim() || null,
            genero: genero.trim() || null,
        };

        const success = await updateProfile(payload);
        if (success) {
            router.back();
        }
        // Si falla, useProfile actualiza error → useEffect lo pasa a formError
    };

    const initials = nombre ? getInitials(nombre) : '';

    return (
        <View className={styles.screenBase}>
            <SafeAreaView className="flex-1">
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                >
                    {/* HEADER */}
                    <View className="flex-row justify-between items-center px-5 mt-2 mb-3">
                        <Text className="text-white text-2xl font-extrabold">Editar Perfil</Text>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="bg-[#1A1A1D] rounded-2xl p-4 border border-[#2A2A2A]"
                        >
                            <Ionicons name="close-outline" size={20} color="#8A9AA4" />
                        </TouchableOpacity>
                    </View>

                    {/* Loading inicial */}
                    {isLoading && (
                        <View className="items-center py-10">
                            <ActivityIndicator size="large" color={Colors.brand.primary} />
                            <Text className="text-gray-400 mt-3 text-sm">Cargando perfil...</Text>
                        </View>
                    )}

                    {!isLoading && (
                        <>
                            {/* AVATAR */}
                            <View className="items-center px-5 mb-6">
                                <View className="bg-[#1A1A1D] rounded-full border border-[#2A2A2A] mb-3 items-center justify-center w-24 h-24">
                                    {initials ? (
                                        <Text style={{ fontSize: 28, fontWeight: '700', color: Colors.brand.primary }}>
                                            {initials}
                                        </Text>
                                    ) : (
                                        <Ionicons name="person" size={50} color={Colors.brand.primary} />
                                    )}
                                </View>
                                <Text className="text-white text-xl font-bold">
                                    {nombre || 'Sin nombre'}
                                </Text>
                            </View>

                            {/* ERROR */}
                            {formError ? (
                                <View className="mx-5 mb-4 bg-[#FF4534]/10 border border-[#FF4534]/30 rounded-2xl p-4">
                                    <Text className="text-[#FF4534] text-sm text-center">{formError}</Text>
                                </View>
                            ) : null}

                            {/* CARD FORMULARIO */}
                            <View className="mx-5 bg-[#1A1A1D] rounded-3xl p-5 border border-[#2A2A2A] mb-6">
                                <Text className="text-[#C8F558] mb-4 font-semibold">
                                    Información Personal
                                </Text>

                                {/* Nombre */}
                                <FieldRow
                                    icon="create-outline"
                                    label="Nombre"
                                    value={nombre}
                                    onChangeText={setNombre}
                                    placeholder="Tu nombre"
                                />

                                {/* Email — solo lectura */}
                                <FieldRow
                                    icon="mail-outline"
                                    label="Email"
                                    value={profile?.email ?? ''}
                                    onChangeText={() => {}}
                                    placeholder="—"
                                    editable={false}
                                />

                                {/* Teléfono */}
                                <FieldRow
                                    icon="call-outline"
                                    label="Teléfono"
                                    value={telefono}
                                    onChangeText={setTelefono}
                                    placeholder="Ej: +34 600 000 000"
                                    keyboardType="phone-pad"
                                />

                                {/* Fecha de nacimiento */}
                                <FieldRow
                                    icon="calendar-clear-outline"
                                    label="Fecha de nacimiento"
                                    value={fechaNacimiento}
                                    onChangeText={setFechaNacimiento}
                                    placeholder="YYYY-MM-DD"
                                />

                                {/* Género */}
                                <FieldRow
                                    icon="transgender-outline"
                                    label="Género"
                                    value={genero}
                                    onChangeText={setGenero}
                                    placeholder="Ej: Masculino, Femenino"
                                    isLast
                                />
                            </View>

                            {/* ACCIONES */}
                            <View className="flex-row w-full px-5 gap-3 mb-6">
                                {/* Cancelar */}
                                <TouchableOpacity
                                    onPress={() => router.back()}
                                    className="flex-1 bg-[#1A1A1D] rounded-3xl p-4 border border-[#2A2A2A] items-center"
                                    disabled={isSaving}
                                >
                                    <Text className="text-white font-black">Cancelar</Text>
                                </TouchableOpacity>

                                {/* Guardar */}
                                <TouchableOpacity
                                    onPress={handleSave}
                                    disabled={isSaving}
                                    className="flex-1 bg-[#C8F558] rounded-3xl p-4 items-center"
                                    style={{ opacity: isSaving ? 0.7 : 1 }}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator size="small" color="#000" />
                                    ) : (
                                        <View className="flex-row items-center justify-center gap-2">
                                            <Ionicons name="save-outline" size={20} color="#000" />
                                            <Text className="text-black font-black">Guardar</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

// ── Componente interno de campo de formulario ──────────────────────────────

interface FieldRowProps {
    icon: string;
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    editable?: boolean;
    keyboardType?: 'default' | 'phone-pad' | 'email-address';
    isLast?: boolean;
}

function FieldRow({
    icon,
    label,
    value,
    onChangeText,
    placeholder = '',
    editable = true,
    keyboardType = 'default',
    isLast = false,
}: FieldRowProps) {
    return (
        <View className={`flex-row items-center ${isLast ? '' : 'mb-4'}`}>
            <View className="bg-[#0F0F13] p-3 rounded-xl mr-3">
                <Ionicons name={icon as any} size={18} color="#8A9AA4" />
            </View>
            <View className="flex-1">
                <Text className="text-gray-400 text-sm mb-1">{label}</Text>
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#525258"
                    editable={editable}
                    keyboardType={keyboardType}
                    className="text-white bg-[#0F0F13] border border-[#262626] rounded-xl px-4 py-3"
                    // Color diferente para campos no editables
                    style={!editable ? { color: '#52525B' } : undefined}
                />
            </View>
        </View>
    );
}
