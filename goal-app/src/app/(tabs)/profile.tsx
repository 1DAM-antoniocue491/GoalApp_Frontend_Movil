import React from 'react';
import { Text, View, Alert, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/src/features/auth/hooks/useAuth';
import { useProfile } from '@/src/features/profile/hooks/useProfile';
import { useActiveLeague } from '@/src/state/activeLeague/activeLeagueStore';
import { routes } from '@/src/shared/config/routes';
import { styles } from '@/src/shared/styles';
import { Colors } from '@/src/shared/constants/colors';
import { ROLE_LABELS } from '@/src/shared/types/league';

/** Genera iniciales a partir del nombre */
function getInitials(name: string): string {
    if (!name.trim()) return '';
    return name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');
}

/** Formatea fecha ISO (YYYY-MM-DD) a texto legible */
function formatDate(iso: string): string {
    if (!iso) return '';
    const [year, month, day] = iso.split('-');
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const m = parseInt(month, 10) - 1;
    return `${parseInt(day, 10)} ${months[m] ?? ''} ${year}`;
}

export default function ProfileScreen() {
    const router = useRouter();
    const { logout } = useAuth();
    const { profile, isLoading } = useProfile();
    const { session: leagueSession } = useActiveLeague();

    // Rol del usuario en la liga activa — solo si existe
    const roleLabel = leagueSession?.role ? ROLE_LABELS[leagueSession.role] ?? null : null;

    const handleLogout = async () => {
        Alert.alert(
            'Cerrar sesión',
            '¿Estás seguro de que quieres cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Cerrar sesión',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace(routes.public.auth.login);
                    },
                },
            ],
        );
    };

    const initials = profile?.nombre ? getInitials(profile.nombre) : '';

    return (
        <View className={styles.screenBase}>
            <SafeAreaView className="flex-1">
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                >
                    {/* HEADER */}
                    <View className="flex-row justify-between items-center px-5 mt-4 mb-6">
                        <Text className="text-white text-2xl font-extrabold">Mi Perfil</Text>
                        <TouchableOpacity onPress={() => router.push(routes.private.profileRoutes.edit as any)}>
                            <Ionicons name="create-outline" size={26} color={Colors.brand.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* Loading */}
                    {isLoading && (
                        <View className="items-center py-10">
                            <ActivityIndicator size="large" color={Colors.brand.primary} />
                            <Text className="text-gray-400 mt-3 text-sm">Cargando perfil...</Text>
                        </View>
                    )}

                    {/* Contenido */}
                    {!isLoading && (
                        <>
                            {/* AVATAR + NOMBRE + ROL */}
                            <View className="items-center px-5 mb-6">
                                <View className="bg-[#1A1A1D] p-5 rounded-full border border-[#2A2A2A] mb-3 items-center justify-center w-24 h-24">
                                    {initials ? (
                                        <Text style={{ fontSize: 28, fontWeight: '700', color: Colors.brand.primary }}>
                                            {initials}
                                        </Text>
                                    ) : (
                                        <Ionicons name="person" size={50} color={Colors.brand.primary} />
                                    )}
                                </View>

                                <Text className="text-white text-2xl font-bold">
                                    {profile?.nombre || 'Sin nombre'}
                                </Text>

                                {/* Badge de rol — solo si hay liga activa */}
                                {roleLabel ? (
                                    <Text className="mt-2 text-[#C8F558] bg-[#2e3d06] px-3 py-1 rounded-full text-sm">
                                        {roleLabel}
                                    </Text>
                                ) : null}
                            </View>

                            {/* CARD INFORMACIÓN */}
                            <View className="mx-5 bg-[#1A1A1D] rounded-3xl p-5 border border-[#2A2A2A] mb-6">
                                <Text className="text-[#C8F558] text-lg mb-4 font-semibold">
                                    Información Personal
                                </Text>

                                {[
                                    {
                                        icon: 'mail-outline',
                                        label: 'Email',
                                        value: profile?.email || '',
                                    },
                                    {
                                        icon: 'call-outline',
                                        label: 'Teléfono',
                                        value: profile?.telefono || '',
                                    },
                                    {
                                        icon: 'calendar-clear-outline',
                                        label: 'Fecha de nacimiento',
                                        value: profile?.fechaNacimiento ? formatDate(profile.fechaNacimiento) : '',
                                    },
                                    {
                                        icon: 'transgender-outline',
                                        label: 'Género',
                                        value: profile?.genero || '',
                                    },
                                ].map((item) => (
                                    <View key={item.label} className="flex-row items-center mb-4">
                                        <View className="bg-[#0F0F13] p-3 rounded-xl mr-3">
                                            <Ionicons name={item.icon as any} size={18} color="#8A9AA4" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-gray-400 text-sm">{item.label}</Text>
                                            <Text className="text-white text-base font-medium">
                                                {item.value || 'Sin completar'}
                                            </Text>
                                        </View>
                                    </View>
                                ))}

                                {/* Miembro desde */}
                                {profile?.createdAt ? (
                                    <View className="flex-row items-center">
                                        <View className="bg-[#0F0F13] p-3 rounded-xl mr-3">
                                            <Ionicons name="time-outline" size={18} color="#8A9AA4" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-gray-400 text-sm">Miembro desde</Text>
                                            <Text className="text-white text-base font-medium">
                                                {formatDate(profile.createdAt.split('T')[0])}
                                            </Text>
                                        </View>
                                    </View>
                                ) : null}
                            </View>

                            {/* SESIÓN */}
                            <View className="mx-5 bg-[#1A1A1D] rounded-3xl p-5 border border-[#2A2A2A]">
                                <Text className="text-gray-400 mb-4 text-center">Sesión</Text>
                                <View className="flex-row gap-3">
                                    <View className="flex-1 bg-[#0F0F13] p-4 rounded-xl flex-row justify-center items-center gap-2">
                                        <Ionicons name="shield-checkmark" size={18} color={Colors.brand.primary} />
                                        <Text className="text-[#C8F558] font-semibold">Activo</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={handleLogout}
                                        className="flex-1 bg-[#FF4534]/10 p-4 rounded-xl flex-row justify-center items-center gap-2 border border-[#FF4534]/30"
                                    >
                                        <Ionicons name="log-out-outline" size={18} color={Colors.semantic.error} />
                                        <Text className="text-[#FF4534] font-semibold">Salir</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
