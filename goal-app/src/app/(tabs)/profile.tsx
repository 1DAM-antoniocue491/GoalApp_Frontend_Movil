import { Text, View, Alert, ScrollView, TouchableOpacity } from "react-native";
import React from "react";
import { styles } from "@/src/shared/styles";
import { Ionicons } from '@expo/vector-icons';
import { Link, RelativePathString, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from '@/src/features/auth/hooks/useAuth';
import { routes } from '@/src/shared/config/routes';

export default function HomeScreen() {
    const router = useRouter();
    const { logout, user } = useAuth();

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
            ]
        );
    };

    return (
        <View className={styles.screenBase}>
            <SafeAreaView className="flex-1">

                {/* SCROLL */}
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                >

                    {/* HEADER */}
                    <View className="flex-row justify-between items-center px-5 mt-4 mb-6">

                        <Text className="text-white text-2xl font-extrabold">
                            Mi Perfil
                        </Text>
                        <Link href={'../profile/editProfile' as RelativePathString}>
                            <Ionicons
                                name="create-outline"
                                size={26}
                                color="#C8F558"
                            />
                        </Link>
                    </View>

                    {/* PERFIL */}
                    <View className="items-center px-5 mb-6">
                        <View className="bg-[#1A1A1D] p-5 rounded-full border border-[#2A2A2A] mb-3">
                            <Ionicons name="person" size={50} color="#C8F558" />
                        </View>

                        <Text className="text-white text-2xl font-bold">
                            {user?.nombre || 'Pepe Luis'}
                        </Text>

                        <Text className="mt-2 text-[#C8F558] bg-[#2e3d06] px-3 py-1 rounded-full text-sm">
                            Administrador
                        </Text>
                    </View>

                    {/* CARD INFO */}
                    <View className="mx-5 bg-[#1A1A1D] rounded-3xl p-5 border border-[#2A2A2A] mb-6">
                        <Text className="text-[#C8F558] text-lg mb-4 font-semibold">
                            Información Personal
                        </Text>

                        {/* ITEM */}
                        {[
                            { icon: "mail-outline", label: "Email", value: user?.email || 'john.doe@goalapp.com' },
                            { icon: "call-outline", label: "Teléfono", value: "+34 790 67 84 35" },
                            { icon: "calendar-clear-outline", label: "Fecha de nacimiento", value: "15 junio 2025" },
                            { icon: "transgender-outline", label: "Género", value: "Masculino" },
                        ].map((item, index) => (
                            <View key={index} className="flex-row items-center mb-4">
                                <View className="bg-[#0F0F13] p-3 rounded-xl mr-3">
                                    <Ionicons name={item.icon as any} size={18} color="#8A9AA4" />
                                </View>

                                <View className="flex-1">
                                    <Text className="text-gray-400 text-sm">
                                        {item.label}
                                    </Text>
                                    <Text className="text-white text-base font-medium">
                                        {item.value}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* SESIÓN */}
                    <View className="mx-5 bg-[#1A1A1D] rounded-3xl p-5 border border-[#2A2A2A]">

                        <Text className="text-gray-400 mb-4 text-center">
                            Sesión
                        </Text>

                        <View className="flex-row gap-3">

                            {/* ACTIVO */}
                            <View className="flex-1 bg-[#0F0F13] p-4 rounded-xl flex-row justify-center items-center gap-2">
                                <Ionicons name="shield-checkmark" size={18} color="#C8F558" />
                                <Text className="text-[#C8F558] font-semibold">
                                    Activo
                                </Text>
                            </View>

                            {/* LOGOUT */}
                            <TouchableOpacity
                                onPress={handleLogout}
                                className="flex-1 bg-[#FF4534]/10 p-4 rounded-xl flex-row justify-center items-center gap-2 border border-[#FF4534]/30"
                            >
                                <Ionicons name="log-out-outline" size={18} color="#FF4534" />
                                <Text className="text-[#FF4534] font-semibold">
                                    Salir
                                </Text>
                            </TouchableOpacity>

                        </View>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}