/**
 * EditProfileScreen
 *
 * Pantalla de edición de perfil del usuario autenticado.
 * TODO: conectar campos a estado real y servicio de actualización cuando la API esté disponible.
 */

import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '@/src/shared/styles';

export function EditProfileScreen() {
    return (
        <View className={styles.screenBase}>
            <SafeAreaView className="flex-1 mt-3">
                <View className="flex flex-row justify-between items-center mr-2">
                    <View className="flex flex-row gap-4 mr-5 ml-5 items-center">
                        <Text className="text-white text-2xl font-black">Editar Perfil</Text>
                    </View>
                    <Link href="../(tabs)/profile">
                        <View className="bg-[#211F21] border border-[#595959] rounded-2xl p-2 ">
                            <Ionicons name="close-outline" size={30} color="#FFFFFF" />
                        </View>
                    </Link>
                </View>
                <View className="flex justify-center items-center gap-5 h-full mr-4 ml-4">
                    <Ionicons name="person-outline" size={60} color="#FFFFFF" className="mr-3 bg-[#211F21] border border-[#595959] rounded-full p-4" />
                    <Text className="text-white text-3xl font-black">Pepe Luis</Text>
                    <Text className="bg-[#2e3d06] rounded-2xl pl-2 pr-2 text-[#C8F558]">Administrador</Text>
                    <View className="bg-[#211F21] border border-[#595959] p-6 rounded-2xl w-full ">
                        <Text className="text-[#C8F558] pb-4"> Información Personal</Text>
                        <View className="flex-row gap-4 items-start mb-4">
                            <View className="bg-[#0F0F13] rounded-2xl p-3 border border-[#262626]">
                                <Ionicons name="mail-outline" size={18} color="#8A9AA4" />
                            </View>
                            <View className="flex-1 flex-col">
                                <Text className="text-gray-400 pb-2">Email</Text>
                                <Text className="w-full text-white bg-[#0F0F13] rounded-2xl p-3 border border-[#262626]">john.doe@goalapp.com</Text>
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

                        <View className="flex flex-row gap-4 items-start mb-4">
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

                    <Link href="../(tabs)/profile">
                        <View className="bg-[#C8F558] rounded-2xl w-full mr-4 ml-4 items-center justify-center">
                            <Text className="p-3 font-black">Guardar</Text>
                        </View>
                    </Link>
                </View>
            </SafeAreaView>
        </View>
    );
}
