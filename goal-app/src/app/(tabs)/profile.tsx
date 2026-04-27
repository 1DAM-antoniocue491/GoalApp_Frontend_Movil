import { Text, View, Alert } from "react-native";
import React from "react";
import { styles } from "@/src/shared/styles";
import { Ionicons } from '@expo/vector-icons';
import { Link, RelativePathString, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

// Hook de autenticación para logout
import { useAuth } from '@/src/app/auth/hooks/useAuth';
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
            <SafeAreaView className="flex-1 mt-3">
                <View className="flex flex-row justify-between items-center">
                    <View className="flex flex-row gap-4 mr-5 ml-5 items-center">
                        <Text className="text-white text-2xl font-black">Mi Perfil</Text>
                        <Link href={'../profile/editProfile' as RelativePathString} >
                            <Ionicons name="create-outline" size={30} color="#FFFFFF" className="bg-[#0F0F13] justify-center items-center rounded-4xl p-2 border border-[#262626]" />
                        </Link>
                    </View>
                    <Ionicons name="settings-outline" size={30} color="#FFFFFF" className="mr-3" />
                </View>
                <View className="flex justify-center items-center gap-5 h-full mr-4 ml-4">
                    <Ionicons name="person-outline" size={60} color="#FFFFFF" className="mr-3 bg-[#211F21] border border-[#595959] rounded-full p-4" />
                    <Text className="text-white text-3xl font-black">{user?.nombre || 'Pepe Luis'}</Text>
                    <Text className="bg-[#2e3d06] rounded-2xl pl-2 pr-2 text-[#C8F558]">Administrador</Text>
                    <View className="bg-[#211F21] border border-[#595959] p-6 rounded-2xl w-full ">
                        <Text className="text-[#C8F558] pb-4"> Información Personal</Text>
                        <View className="flex flex-row gap-4 items-start mb-4">
                            <View className="bg-[#0F0F13] rounded-2xl p-3 border border-[#262626]">
                                <Ionicons name="mail-outline" size={18} color="#8A9AA4" />
                            </View>

                            <View className="flex-1 flex-col">
                                <Text className="text-gray-400 pb-2">Email</Text>
                                <Text className="w-full text-white bg-[#0F0F13] rounded-2xl p-3 border border-[#262626]">{user?.email || 'john.doe@goalapp.com'}</Text>
                            </View>
                        </View>


                        <View className="flex flex-row gap-4 items-start mb-4">
                            <View className="bg-[#0F0F13] rounded-2xl p-3 border border-[#262626]">
                                <Ionicons name="call-outline" size={18} color="#8A9AA4" />
                            </View>

                            <View className="flex-1 flex-col">
                                <Text className="text-gray-400 pb-2">Teléfono</Text>
                                <Text className="w-full text-white bg-[#0F0F13] rounded-2xl p-3 border border-[#262626]">
                                    +34 790 67 84 35
                                </Text>
                            </View>
                        </View>

                        <View className=" flex flex-row gap-4 items-start mb-4">
                            <View className="bg-[#0F0F13] rounded-2xl p-3 border border-[#262626]">
                                <Ionicons name="calendar-clear-outline" size={18} color="#8A9AA4" />
                            </View>

                            <View className="flex-1 flex-col">
                                <Text className="text-gray-400 pb-2">Fecha de nacimiento</Text>
                                <Text className="text-white bg-[#0F0F13] rounded-2xl p-3 border border-[#262626]">15 de junio, 2025</Text>
                            </View>
                        </View>

                        <View className="flex flex-row gap-4 items-start">
                            <View className="bg-[#0F0F13] rounded-2xl p-3 border border-[#262626]">
                                <Ionicons name="transgender-outline" size={18} color="#8A9AA4" />
                            </View>

                            <View className="flex-1 flex-col">
                                <Text className="text-gray-400 pb-2">Género</Text>
                                <Text className="text-white bg-[#0F0F13] rounded-2xl p-3 border border-[#262626]">Masculino</Text>
                            </View>
                        </View>
                    </View>

                    {/* Botón de logout */}
                    <View className="w-full mt-4">
                        <View className="bg-[#211F21] border border-[#595959] rounded-2xl p-4">
                            <Text className="text-gray-400 pb-3 text-center">Sesión</Text>
                            <View className="flex flex-row gap-2">
                                <View className="flex-1">
                                    <View className="bg-[#0F0F13] rounded-xl p-3 border border-[#262626] flex-row items-center gap-2">
                                        <Ionicons name="shield-checkmark-outline" size={18} color="#C8F558" />
                                        <Text className="text-[#C8F558] text-sm font-semibold">Activo</Text>
                                    </View>
                                </View>
                                <View className="flex-1">
                                    <View className="bg-[#FF4534]/10 rounded-xl p-3 border border-[#FF4534]/30 flex-row items-center justify-center gap-2" style={{ opacity: 0.9 }}>
                                        <Ionicons name="log-out-outline" size={18} color="#FF4534" />
                                        <Text className="text-[#FF4534] text-sm font-semibold" onPress={handleLogout}>Salir</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </View >
    );
}
